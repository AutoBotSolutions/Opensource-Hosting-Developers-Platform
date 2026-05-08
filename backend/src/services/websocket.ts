import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { database } from '../database/database';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> socketIds
  private userSockets: Map<string, AuthenticatedSocket> = new Map(); // socketId -> socket

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        const user = await database.getUserById(decoded.id);
        
        if (!user || !user.isActive) {
          return next(new Error('Invalid user'));
        }

        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userRole = user.role;

        next();
      } catch (error) {
        logger.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      
      logger.info(`User connected: ${userId} (${socket.id})`);
      
      // Track user connections
      if (!this.connectedUsers.has(userId)) {
        this.connectedUsers.set(userId, new Set());
      }
      this.connectedUsers.get(userId)!.add(socket.id);
      this.userSockets.set(socket.id, socket);

      // Join user to their personal room
      socket.join(`user:${userId}`);
      
      // Join role-based rooms
      socket.join(`role:${socket.userRole}`);
      
      // Send initial data
      this.sendInitialData(socket);

      // Handle client events
      socket.on('join_room', (room) => {
        socket.join(room);
        logger.info(`User ${userId} joined room: ${room}`);
      });

      socket.on('leave_room', (room) => {
        socket.leave(room);
        logger.info(`User ${userId} left room: ${room}`);
      });

      socket.on('server_action', async (data) => {
        await this.handleServerAction(socket, data);
      });

      socket.on('ticket_action', async (data) => {
        await this.handleTicketAction(socket, data);
      });

      socket.on('billing_action', async (data) => {
        await this.handleBillingAction(socket, data);
      });

      socket.on('dashboard_refresh', async () => {
        await this.sendDashboardUpdate(userId);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      socket.on('error', (error) => {
        logger.error(`Socket error for user ${userId}:`, error);
      });
    });
  }

  private async sendInitialData(socket: AuthenticatedSocket) {
    try {
      const userId = socket.userId!;
      
      // Send dashboard stats
      const stats = await database.getDashboardStats();
      socket.emit('dashboard_stats', stats);

      // Send user's servers
      const servers = await database.getServersByUserId(userId);
      socket.emit('servers_update', servers);

      // Send user's tickets
      const tickets = await database.getTicketsByUserId(userId);
      socket.emit('tickets_update', tickets);

      // Send user's invoices
      const invoices = await database.getInvoicesByUserId(userId);
      socket.emit('invoices_update', invoices);

      logger.info(`Initial data sent to user: ${userId}`);
    } catch (error) {
      logger.error('Error sending initial data:', error);
    }
  }

  private async handleServerAction(socket: AuthenticatedSocket, data: any) {
    try {
      const { action, serverId, ...payload } = data;
      const userId = socket.userId!;

      // Verify user owns the server
      const server = await database.getServerById(serverId);
      if (!server || server.userId !== userId) {
        socket.emit('error', { message: 'Server not found or access denied' });
        return;
      }

      let updatedServer: any;

      switch (action) {
        case 'start':
        case 'stop':
        case 'restart':
          updatedServer = await database.updateServer(serverId, {
            status: action === 'stop' ? 'stopped' : 'active'
          });
          
          // Broadcast server status change
          this.broadcastToUser(userId, 'server_status_changed', {
            serverId,
            status: updatedServer.status,
            action
          });
          break;

        case 'update_settings':
          updatedServer = await database.updateServer(serverId, {
            settings: { ...server.settings, ...payload.settings }
          });
          
          this.broadcastToUser(userId, 'server_settings_updated', {
            serverId,
            settings: updatedServer.settings
          });
          break;

        default:
          socket.emit('error', { message: 'Unknown server action' });
          return;
      }

      // Log activity
      await database.logActivity({
        userId,
        action: `server_${action}`,
        resource: 'server',
        resourceId: serverId,
        details: payload,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || ''
      });

      logger.info(`Server action ${action} completed for server ${serverId}`);
    } catch (error) {
      logger.error('Error handling server action:', error);
      socket.emit('error', { message: 'Server action failed' });
    }
  }

  private async handleTicketAction(socket: AuthenticatedSocket, data: any) {
    try {
      const { action, ticketId, ...payload } = data;
      const userId = socket.userId!;

      // Verify user owns the ticket
      const ticket = await database.getTicketById(ticketId);
      if (!ticket || ticket.userId !== userId) {
        socket.emit('error', { message: 'Ticket not found or access denied' });
        return;
      }

      let updatedTicket: any;

      switch (action) {
        case 'reply':
          const newMessage = {
            id: Date.now().toString(),
            ticketId,
            sender: 'user' as 'user' | 'support',
            content: payload.message,
            timestamp: new Date()
          };

          updatedTicket = await database.updateTicket(ticketId, {
            messages: [...ticket.messages, newMessage],
            status: 'in_progress',
            updatedAt: new Date()
          });

          this.broadcastToUser(userId, 'ticket_message_added', {
            ticketId,
            message: newMessage,
            status: 'in_progress'
          });
          break;

        case 'close':
          updatedTicket = await database.updateTicket(ticketId, {
            status: 'closed',
            resolvedAt: new Date(),
            updatedAt: new Date()
          });

          this.broadcastToUser(userId, 'ticket_closed', {
            ticketId,
            status: 'closed',
            resolvedAt: updatedTicket.resolvedAt
          });
          break;

        default:
          socket.emit('error', { message: 'Unknown ticket action' });
          return;
      }

      // Log activity
      await database.logActivity({
        userId,
        action: `ticket_${action}`,
        resource: 'ticket',
        resourceId: ticketId,
        details: payload,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || ''
      });

      logger.info(`Ticket action ${action} completed for ticket ${ticketId}`);
    } catch (error) {
      logger.error('Error handling ticket action:', error);
      socket.emit('error', { message: 'Ticket action failed' });
    }
  }

  private async handleBillingAction(socket: AuthenticatedSocket, data: any) {
    try {
      const { action, invoiceId, ...payload } = data;
      const userId = socket.userId!;

      // Verify user owns the invoice
      const invoice = await database.getInvoiceById(invoiceId);
      if (!invoice || invoice.userId !== userId) {
        socket.emit('error', { message: 'Invoice not found or access denied' });
        return;
      }

      let updatedInvoice: any;

      switch (action) {
        case 'pay':
          updatedInvoice = await database.updateInvoice(invoiceId, {
            status: 'paid',
            paidDate: new Date(),
            updatedAt: new Date()
          });

          this.broadcastToUser(userId, 'invoice_paid', {
            invoiceId,
            status: 'paid',
            paidDate: updatedInvoice.paidDate
          });

          // Update dashboard stats for all users
          this.broadcastToAll('dashboard_stats_updated', await database.getDashboardStats());
          break;

        default:
          socket.emit('error', { message: 'Unknown billing action' });
          return;
      }

      // Log activity
      await database.logActivity({
        userId,
        action: `invoice_${action}`,
        resource: 'invoice',
        resourceId: invoiceId,
        details: payload,
        ipAddress: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'] || ''
      });

      logger.info(`Billing action ${action} completed for invoice ${invoiceId}`);
    } catch (error) {
      logger.error('Error handling billing action:', error);
      socket.emit('error', { message: 'Billing action failed' });
    }
  }

  private async sendDashboardUpdate(userId: string) {
    try {
      const stats = await database.getDashboardStats();
      this.broadcastToUser(userId, 'dashboard_stats_updated', stats);
    } catch (error) {
      logger.error('Error sending dashboard update:', error);
    }
  }

  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId!;
    
    logger.info(`User disconnected: ${userId} (${socket.id})`);
    
    // Remove from tracking
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }
    
    this.userSockets.delete(socket.id);
  }

  // Public methods for broadcasting
  public broadcastToUser(userId: string, event: string, data: any) {
    this.io.to(`user:${userId}`).emit(event, data);
    logger.info(`Broadcasted ${event} to user: ${userId}`);
  }

  public broadcastToRole(role: string, event: string, data: any) {
    this.io.to(`role:${role}`).emit(event, data);
    logger.info(`Broadcasted ${event} to role: ${role}`);
  }

  public broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
    logger.info(`Broadcasted ${event} to all users`);
  }

  public broadcastToRoom(room: string, event: string, data: any) {
    this.io.to(room).emit(event, data);
    logger.info(`Broadcasted ${event} to room: ${room}`);
  }

  // Get connection statistics
  public getConnectionStats() {
    return {
      totalConnections: this.userSockets.size,
      connectedUsers: this.connectedUsers.size,
      usersByRole: this.getUsersByRole()
    };
  }

  private getUsersByRole() {
    const roles: Record<string, number> = {};
    
    for (const socket of this.userSockets.values()) {
      const role = socket.userRole || 'unknown';
      roles[role] = (roles[role] || 0) + 1;
    }
    
    return roles;
  }

  // Send notification to specific user
  public async sendNotification(userId: string, notification: any) {
    this.broadcastToUser(userId, 'notification', {
      ...notification,
      timestamp: new Date().toISOString()
    });

    // Log notification
    await database.logActivity({
      userId,
      action: 'notification_sent',
      resource: 'notification',
      resourceId: notification.id || 'system',
      details: notification,
      ipAddress: 'system',
      userAgent: 'websocket'
    });
  }

  // Send system-wide announcement
  public sendAnnouncement(announcement: any) {
    this.broadcastToAll('announcement', {
      ...announcement,
      timestamp: new Date().toISOString()
    });

    logger.info(`System announcement sent: ${announcement.title}`);
  }
}

// Singleton instance
let websocketService: WebSocketService | null = null;

export const initializeWebSocket = (server: HTTPServer): WebSocketService => {
  if (!websocketService) {
    websocketService = new WebSocketService(server);
  }
  return websocketService;
};

export const getWebSocketService = (): WebSocketService => {
  if (!websocketService) {
    throw new Error('WebSocket service not initialized');
  }
  return websocketService;
};

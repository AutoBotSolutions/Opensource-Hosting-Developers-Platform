import { 
  User, 
  Server, 
  Invoice, 
  SupportTicket, 
  Client, 
  ActivityLog, 
  DashboardStats,
  UserSettings,
  SystemSettings,
  DatabaseOperations,
  PaymentMethod,
  ApiKey,
  TicketMessage
} from './models';
import { logger } from '../utils/logger';

// In-memory database implementation (in production, this would be replaced with a real database)
class InMemoryDatabase implements DatabaseOperations {
  private users: Map<string, User> = new Map();
  private servers: Map<string, Server> = new Map();
  private invoices: Map<string, Invoice> = new Map();
  private tickets: Map<string, SupportTicket> = new Map();
  private clients: Map<string, Client> = new Map();
  private activities: ActivityLog[] = [];
  private userSettings: Map<string, UserSettings> = new Map();
  private systemSettings: SystemSettings;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Initialize system settings
    this.systemSettings = {
      general: {
        siteName: 'HostingCo',
        siteUrl: 'https://hostingco.com',
        supportEmail: 'support@hostingco.com',
        timezone: 'UTC',
        dateFormat: 'YYYY-MM-DD',
        currency: 'USD'
      },
      security: {
        maxLoginAttempts: 5,
        lockoutDuration: '15m',
        sessionTimeout: '24h',
        passwordMinLength: 8,
        require2FA: false
      },
      notifications: {
        emailProvider: 'smtp',
        smtpHost: 'smtp.hostingco.com',
        smtpPort: 587,
        smtpUser: 'noreply@hostingco.com',
        smsProvider: 'twilio',
        pushEnabled: true
      },
      backup: {
        enabled: true,
        frequency: 'daily',
        retentionDays: 30,
        storageLocation: 's3://backups/hostingco'
      }
    };

    // Create sample admin user
    this.createUser({
      email: 'admin@hostingco.com',
      password: '$2b$10$example.hash', // In production, this would be properly hashed
      name: 'Admin User',
      phone: '+1 (555) 000-0000',
      company: 'HostingCo',
      role: 'admin',
      permissions: ['read', 'write', 'delete', 'admin'],
      settings: this.getDefaultUserSettings(),
      isActive: true
    });
  }

  private getDefaultUserSettings(): UserSettings {
    return {
      personal: {
        name: '',
        email: '',
        phone: '',
        company: '',
        timezone: 'America/New_York',
        language: 'en'
      },
      notifications: {
        email: {
          billing: true,
          serverAlerts: true,
          maintenance: true,
          security: true,
          marketing: false
        },
        push: {
          billing: true,
          serverAlerts: true,
          maintenance: false,
          security: true,
          marketing: false
        },
        sms: {
          billing: false,
          serverAlerts: true,
          maintenance: false,
          security: true,
          marketing: false
        }
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: '24h',
        ipWhitelist: [],
        apiKeys: []
      },
      preferences: {
        theme: 'light',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        currency: 'USD',
        defaultPage: 'dashboard'
      }
    };
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    this.userSettings.set(user.id, userData.settings);

    logger.info(`User created: ${user.id}`);
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    
    logger.info(`User updated: ${id}`);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    const deleted = this.users.delete(id);
    this.userSettings.delete(id);
    
    if (!deleted) {
      throw new Error('User not found');
    }
    
    logger.info(`User deleted: ${id}`);
  }

  // Server operations
  async createServer(serverData: Omit<Server, 'id' | 'createdAt' | 'updatedAt'>): Promise<Server> {
    const server: Server = {
      ...serverData,
      id: `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.servers.set(server.id, server);
    logger.info(`Server created: ${server.id}`);
    return server;
  }

  async getServerById(id: string): Promise<Server | null> {
    const server = this.servers.get(id);
    return server || null;
  }

  async getServersByUserId(userId: string): Promise<Server[]> {
    const userServers: Server[] = [];
    for (const server of this.servers.values()) {
      if (server.userId === userId) {
        userServers.push(server);
      }
    }
    return userServers;
  }

  async updateServer(id: string, updates: Partial<Server>): Promise<Server> {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error('Server not found');
    }

    const updatedServer = { ...server, ...updates, updatedAt: new Date() };
    this.servers.set(id, updatedServer);
    
    logger.info(`Server updated: ${id}`);
    return updatedServer;
  }

  async deleteServer(id: string): Promise<void> {
    const deleted = this.servers.delete(id);
    if (!deleted) {
      throw new Error('Server not found');
    }
    
    logger.info(`Server deleted: ${id}`);
  }

  // Invoice operations
  async createInvoice(invoiceData: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
    const invoice: Invoice = {
      ...invoiceData,
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.invoices.set(invoice.id, invoice);
    logger.info(`Invoice created: ${invoice.id}`);
    return invoice;
  }

  async getInvoiceById(id: string): Promise<Invoice | null> {
    const invoice = this.invoices.get(id);
    return invoice || null;
  }

  async getInvoicesByUserId(userId: string): Promise<Invoice[]> {
    const userInvoices: Invoice[] = [];
    for (const invoice of this.invoices.values()) {
      if (invoice.userId === userId) {
        userInvoices.push(invoice);
      }
    }
    return userInvoices;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const invoice = this.invoices.get(id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    const updatedInvoice = { ...invoice, ...updates, updatedAt: new Date() };
    this.invoices.set(id, updatedInvoice);
    
    logger.info(`Invoice updated: ${id}`);
    return updatedInvoice;
  }

  // Support ticket operations
  async createTicket(ticketData: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt'>): Promise<SupportTicket> {
    const ticket: SupportTicket = {
      ...ticketData,
      id: `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.tickets.set(ticket.id, ticket);
    logger.info(`Ticket created: ${ticket.id}`);
    return ticket;
  }

  async getTicketById(id: string): Promise<SupportTicket | null> {
    const ticket = this.tickets.get(id);
    return ticket || null;
  }

  async getTicketsByUserId(userId: string): Promise<SupportTicket[]> {
    const userTickets: SupportTicket[] = [];
    for (const ticket of this.tickets.values()) {
      if (ticket.userId === userId) {
        userTickets.push(ticket);
      }
    }
    return userTickets;
  }

  async updateTicket(id: string, updates: Partial<SupportTicket>): Promise<SupportTicket> {
    const ticket = this.tickets.get(id);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const updatedTicket = { ...ticket, ...updates, updatedAt: new Date() };
    this.tickets.set(id, updatedTicket);
    
    logger.info(`Ticket updated: ${id}`);
    return updatedTicket;
  }

  // Activity logging
  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: ActivityLog = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    this.activities.unshift(logEntry);
    
    // Keep only last 1000 activities
    if (this.activities.length > 1000) {
      this.activities = this.activities.slice(0, 1000);
    }
  }

  async getActivitiesByUserId(userId: string, limit: number = 50): Promise<ActivityLog[]> {
    return this.activities
      .filter(activity => activity.userId === userId)
      .slice(0, limit);
  }

  // Settings operations
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const settings = this.userSettings.get(userId);
    return settings || null;
  }

  async updateUserSettings(userId: string, settings: UserSettings): Promise<UserSettings> {
    this.userSettings.set(userId, settings);
    logger.info(`User settings updated: ${userId}`);
    return settings;
  }

  async getSystemSettings(): Promise<SystemSettings> {
    return this.systemSettings;
  }

  async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    this.systemSettings = settings;
    logger.info('System settings updated');
    return settings;
  }

  // Additional helper methods
  async getDashboardStats(): Promise<DashboardStats> {
    const servers = Array.from(this.servers.values());
    const invoices = Array.from(this.invoices.values());
    const tickets = Array.from(this.tickets.values());
    const users = Array.from(this.users.values());

    return {
      servers: {
        total: servers.length,
        active: servers.filter(s => s.status === 'active').length,
        inactive: servers.filter(s => s.status === 'inactive').length,
        suspended: servers.filter(s => s.status === 'suspended').length
      },
      clients: {
        total: users.filter(u => u.role === 'user').length,
        active: users.filter(u => u.role === 'user' && u.isActive).length,
        new: users.filter(u => u.role === 'user' && 
          new Date().getTime() - u.createdAt.getTime() < 30 * 24 * 60 * 60 * 1000).length
      },
      billing: {
        totalRevenue: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0),
        pendingInvoices: invoices.filter(i => i.status === 'pending').length,
        paidInvoices: invoices.filter(i => i.status === 'paid').length,
        overdueInvoices: invoices.filter(i => i.status === 'overdue').length
      },
      support: {
        totalTickets: tickets.length,
        openTickets: tickets.filter(t => t.status === 'open').length,
        inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: tickets.filter(t => t.status === 'resolved').length
      },
      recentActivity: this.activities.slice(0, 10)
    };
  }

  async getAllServers(): Promise<Server[]> {
    return Array.from(this.servers.values());
  }

  async getAllInvoices(): Promise<Invoice[]> {
    return Array.from(this.invoices.values());
  }

  async getAllTickets(): Promise<SupportTicket[]> {
    return Array.from(this.tickets.values());
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

// Export singleton database instance
export const database = new InMemoryDatabase();
export default database;

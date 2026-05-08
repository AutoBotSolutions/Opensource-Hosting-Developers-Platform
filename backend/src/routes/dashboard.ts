import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { database } from '../database/database';
import { asyncHandler } from '../utils/errors';
import { validateRequest } from '../utils/validation';
import { Schemas } from '../utils/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Dashboard statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  const stats = await database.getDashboardStats();
  
  // Log activity
  await database.logActivity({
    userId: (req as any).user.id,
    action: 'view_dashboard',
    resource: 'dashboard_stats',
    resourceId: 'global',
    details: {},
    ipAddress: req.ip || '',
    userAgent: req.get('User-Agent') || ''
  });

  res.json({ success: true, data: stats });
}));

// Refresh dashboard data
router.post('/refresh', authenticateToken, asyncHandler(async (req: Request, res: Response) => {
  // Log activity
  await database.logActivity({
    userId: (req as any).user.id,
    action: 'refresh_dashboard',
    resource: 'dashboard_stats',
    resourceId: 'global',
    details: {},
    ipAddress: req.ip || '',
    userAgent: req.get('User-Agent') || ''
  });

  // Simulate data refresh with delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  logger.info('Dashboard data refreshed');
  res.json({ 
    success: true, 
    message: 'Dashboard data refreshed successfully',
    timestamp: new Date().toISOString()
  });
}));

// Quick actions endpoints
router.post('/add-server', authenticateToken, validateRequest(Schemas.server), asyncHandler(async (req: Request, res: Response) => {
  const { name, plan, location } = req.body;
  const userId = (req as any).user.id;

  // Create server in database
  const newServer = await database.createServer({
    name,
    plan,
    location,
    userId,
    status: 'active',
    ip: `192.168.1.${100 + Math.floor(Math.random() * 155)}`,
    specs: {
      cpu: plan === 'basic' ? 2 : plan === 'pro' ? 4 : 8,
      ram: plan === 'basic' ? '4GB' : plan === 'pro' ? '8GB' : '16GB',
      storage: plan === 'basic' ? '50GB' : plan === 'pro' ? '100GB' : '200GB',
      bandwidth: plan === 'basic' ? '1TB' : plan === 'pro' ? '2TB' : '5TB'
    },
    uptime: 0,
    load: [0, 0, 0],
    settings: {
      hostname: name,
      firewall: true,
      backups: true,
      monitoring: true,
      ssl: true
    },
    statistics: {
      cpuUsage: 0,
      memoryUsage: 0,
      diskUsage: 0,
      networkIn: 0,
      networkOut: 0,
      processes: 0,
      connections: 0
    }
  });

  // Log activity
  await database.logActivity({
    userId,
    action: 'create_server',
    resource: 'server',
    resourceId: newServer.id,
    details: { name, plan, location },
    ipAddress: req.ip || '',
    userAgent: req.get('User-Agent') || ''
  });

  logger.info(`New server created: ${name}`);
  
  // Emit real-time event (would normally use WebSocket)
  setTimeout(() => {
    logger.info('Server creation event emitted');
  }, 100);

  res.json({ 
    success: true, 
    message: 'Server created successfully',
    data: newServer
  });
}));

router.post('/add-client', authenticateToken, validateRequest(Schemas.user), asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, company } = req.body;
  const userId = (req as any).user.id;

  // Create client in database
  const newClient = await database.createUser({
    email,
    password: '$2b$10$default.hash.change.on.first.login', // Default password
    name,
    phone,
    company,
    role: 'user',
    permissions: ['read', 'write'],
    settings: {
      personal: {
        name,
        email,
        phone,
        company,
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
    },
    isActive: true
  });

  // Log activity
  await database.logActivity({
    userId,
    action: 'create_client',
    resource: 'user',
    resourceId: newClient.id,
    details: { name, email, phone, company },
    ipAddress: req.ip || '',
    userAgent: req.get('User-Agent') || ''
  });

  logger.info(`New client created: ${name}`);

  res.json({ 
    success: true, 
    message: 'Client created successfully',
    data: {
      id: newClient.id,
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      company: newClient.company,
      status: newClient.isActive ? 'active' : 'inactive',
      createdAt: newClient.createdAt,
      servers: [],
      billing: {
        totalSpent: 0,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  });
}));

export { router as dashboardRoutes };

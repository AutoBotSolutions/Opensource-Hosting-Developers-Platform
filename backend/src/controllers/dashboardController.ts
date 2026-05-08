import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class DashboardController {
  static async getStats(req: Request, res: Response) {
    try {
      // Mock dashboard stats - in production, fetch from database
      const stats = {
        servers: {
          total: 5,
          active: 4,
          inactive: 1,
          suspended: 0
        },
        clients: {
          total: 12,
          active: 10,
          new: 2
        },
        billing: {
          totalRevenue: 1250.00,
          pendingInvoices: 3,
          paidInvoices: 15,
          overdueInvoices: 1
        },
        support: {
          totalTickets: 25,
          openTickets: 5,
          inProgressTickets: 3,
          resolvedTickets: 17
        },
        recentActivity: [
          {
            id: '1',
            userId: '1',
            action: 'server_created',
            resource: 'server',
            resourceId: 'server-123',
            details: { serverName: 'web-server-01' },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date('2026-01-15T10:30:00Z')
          },
          {
            id: '2',
            userId: '1',
            action: 'invoice_paid',
            resource: 'invoice',
            resourceId: 'inv-456',
            details: { amount: 29.99 },
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0...',
            timestamp: new Date('2026-01-15T09:15:00Z')
          }
        ]
      };
      res.json(stats);
    } catch (error) {
      logger.error('Get dashboard stats error:', error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  }

  static async getServerMetrics(req: Request, res: Response) {
    try {
      // Mock server metrics - in production, fetch from monitoring system
      const metrics = [
        {
          serverId: '1',
          timestamp: new Date(),
          cpuUsage: 25.5,
          memoryUsage: 60.2,
          diskUsage: 45.8,
          networkIn: 1024,
          networkOut: 512,
          processes: 15,
          connections: 50,
          loadAverage: [0.2, 0.3, 0.1]
        }
      ];
      res.json(metrics);
    } catch (error) {
      logger.error('Get server metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch server metrics' });
    }
  }

  static async getBillingOverview(req: Request, res: Response) {
    try {
      // Mock billing overview - in production, fetch from database
      const billingOverview = {
        currentMonth: {
          revenue: 1250.00,
          expenses: 450.00,
          profit: 800.00,
          invoices: 18,
          paidInvoices: 15,
          pendingInvoices: 3
        },
        previousMonth: {
          revenue: 1100.00,
          expenses: 420.00,
          profit: 680.00,
          invoices: 16,
          paidInvoices: 14,
          pendingInvoices: 2
        },
        yearToDate: {
          revenue: 14500.00,
          expenses: 5200.00,
          profit: 9300.00,
          invoices: 205,
          paidInvoices: 195,
          pendingInvoices: 10
        },
        upcomingPayments: [
          {
            invoiceId: 'inv-789',
            amount: 29.99,
            dueDate: new Date('2026-01-20'),
            clientName: 'John Doe'
          },
          {
            invoiceId: 'inv-790',
            amount: 49.99,
            dueDate: new Date('2026-01-22'),
            clientName: 'Jane Smith'
          }
        ]
      };
      res.json(billingOverview);
    } catch (error) {
      logger.error('Get billing overview error:', error);
      res.status(500).json({ error: 'Failed to fetch billing overview' });
    }
  }

  static async getSupportStats(req: Request, res: Response) {
    try {
      // Mock support stats - in production, fetch from database
      const supportStats = {
        tickets: {
          total: 25,
          open: 5,
          inProgress: 3,
          resolved: 17,
          closed: 0
        },
        responseTimes: {
          average: 2.5, // hours
          fastest: 0.5,
          slowest: 8.0
        },
        categories: {
          technical: 12,
          billing: 6,
          general: 4,
          feature: 3
        },
        priorities: {
          low: 8,
          medium: 12,
          high: 5
        },
        agents: [
          {
            id: 'agent-1',
            name: 'John Support',
            activeTickets: 3,
            resolvedToday: 2,
            averageResponseTime: 1.8
          },
          {
            id: 'agent-2',
            name: 'Jane Help',
            activeTickets: 2,
            resolvedToday: 3,
            averageResponseTime: 2.1
          }
        ]
      };
      res.json(supportStats);
    } catch (error) {
      logger.error('Get support stats error:', error);
      res.status(500).json({ error: 'Failed to fetch support stats' });
    }
  }
}

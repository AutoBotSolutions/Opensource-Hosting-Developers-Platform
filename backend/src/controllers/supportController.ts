import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class SupportController {
  static async getTickets(req: Request, res: Response) {
    try {
      // Mock ticket data - in production, fetch from database
      const tickets = [
        {
          id: '1',
          userId: '1',
          subject: 'Server performance issues',
          description: 'My server is running slowly',
          status: 'open',
          priority: 'high',
          category: 'technical',
          assignedTo: 'support-agent-1',
          messages: [
            {
              id: '1',
              ticketId: '1',
              sender: 'user',
              content: 'My server is running slowly',
              timestamp: new Date('2026-01-15T10:00:00Z'),
              isInternal: false
            },
            {
              id: '2',
              ticketId: '1',
              sender: 'support',
              content: 'We are looking into this issue',
              timestamp: new Date('2026-01-15T10:30:00Z'),
              isInternal: false
            }
          ],
          createdAt: new Date('2026-01-15'),
          updatedAt: new Date('2026-01-15')
        }
      ];
      res.json(tickets);
    } catch (error) {
      logger.error('Get tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  }

  static async getTicketById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Mock ticket data - in production, fetch from database
      const ticket = {
        id: id,
        userId: '1',
        subject: 'Server performance issues',
        description: 'My server is running slowly',
        status: 'open',
        priority: 'high',
        category: 'technical',
        assignedTo: 'support-agent-1',
        messages: [
          {
            id: '1',
            ticketId: '1',
            sender: 'user',
            content: 'My server is running slowly',
            timestamp: new Date('2026-01-15T10:00:00Z'),
            isInternal: false
          },
          {
            id: '2',
            ticketId: '1',
            sender: 'support',
            content: 'We are looking into this issue',
            timestamp: new Date('2026-01-15T10:30:00Z'),
            isInternal: false
          }
        ],
        createdAt: new Date('2026-01-15'),
        updatedAt: new Date('2026-01-15')
      };
      res.json(ticket);
    } catch (error) {
      logger.error('Get ticket error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  }

  static async createTicket(req: Request, res: Response) {
    try {
      const ticketData = req.body;
      const ticket = {
        id: Date.now().toString(),
        ...ticketData,
        status: 'open',
        messages: [
          {
            id: Date.now().toString(),
            ticketId: Date.now().toString(),
            sender: 'user',
            content: ticketData.description,
            timestamp: new Date(),
            isInternal: false
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.status(201).json(ticket);
    } catch (error) {
      logger.error('Create ticket error:', error);
      res.status(400).json({ error: 'Failed to create ticket' });
    }
  }

  static async updateTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ticketData = req.body;
      const ticket = {
        id: id,
        ...ticketData,
        updatedAt: new Date()
      };
      res.json(ticket);
    } catch (error) {
      logger.error('Update ticket error:', error);
      res.status(400).json({ error: 'Failed to update ticket' });
    }
  }

  static async addMessage(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { content, sender, isInternal } = req.body;
      const message = {
        id: Date.now().toString(),
        ticketId: id,
        sender: sender,
        content: content,
        timestamp: new Date(),
        isInternal: isInternal || false
      };
      res.status(201).json(message);
    } catch (error) {
      logger.error('Add message error:', error);
      res.status(400).json({ error: 'Failed to add message' });
    }
  }

  static async closeTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const ticket = {
        id: id,
        status: 'closed',
        resolvedAt: new Date(),
        updatedAt: new Date()
      };
      res.json(ticket);
    } catch (error) {
      logger.error('Close ticket error:', error);
      res.status(400).json({ error: 'Failed to close ticket' });
    }
  }

  static async assignTicket(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { assignedTo } = req.body;
      const ticket = {
        id: id,
        assignedTo: assignedTo,
        status: 'in_progress',
        updatedAt: new Date()
      };
      res.json(ticket);
    } catch (error) {
      logger.error('Assign ticket error:', error);
      res.status(400).json({ error: 'Failed to assign ticket' });
    }
  }
}

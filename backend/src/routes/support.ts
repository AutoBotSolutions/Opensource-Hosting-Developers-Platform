import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get all support tickets
router.get('/tickets', (req, res) => {
  try {
    const tickets = [
      {
        id: '1',
        subject: 'Server downtime issue',
        description: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
        status: 'in_progress',
        priority: 'high',
        category: 'Technical',
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2023-12-01T12:00:00Z',
        messages: [
          {
            id: '1',
            sender: 'user',
            content: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
            timestamp: '2023-12-01T10:00:00Z'
          },
          {
            id: '2',
            sender: 'support',
            content: 'We are investigating the issue. Our team is working on it.',
            timestamp: '2023-12-01T11:30:00Z'
          }
        ]
      },
      {
        id: '2',
        subject: 'Billing question',
        description: 'I have a question about my latest invoice. Can you help me understand the charges?',
        status: 'open',
        priority: 'medium',
        category: 'Billing',
        createdAt: '2023-12-02T09:00:00Z',
        updatedAt: '2023-12-02T09:00:00Z',
        messages: [
          {
            id: '1',
            sender: 'user',
            content: 'I have a question about my latest invoice. Can you help me understand the charges?',
            timestamp: '2023-12-02T09:00:00Z'
          }
        ]
      },
      {
        id: '3',
        subject: 'Domain transfer help',
        description: 'I need help transferring my domain to your service.',
        status: 'resolved',
        priority: 'low',
        category: 'Domain',
        createdAt: '2023-11-30T14:30:00Z',
        updatedAt: '2023-12-01T16:45:00Z',
        messages: [
          {
            id: '1',
            sender: 'user',
            content: 'I need help transferring my domain to your service.',
            timestamp: '2023-11-30T14:30:00Z'
          },
          {
            id: '2',
            sender: 'support',
            content: 'We can help you with that. Please provide your domain name and current registrar.',
            timestamp: '2023-11-30T15:00:00Z'
          },
          {
            id: '3',
            sender: 'user',
            content: 'Domain: example.com, Registrar: GoDaddy',
            timestamp: '2023-11-30T15:30:00Z'
          },
          {
            id: '4',
            sender: 'support',
            content: 'Thank you! We\'ve initiated the transfer process. You should receive an email shortly.',
            timestamp: '2023-12-01T16:45:00Z'
          }
        ]
      }
    ];

    res.json({ success: true, data: tickets });
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch support tickets' });
  }
});

// Get ticket details
router.get('/tickets/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const ticket = {
      id,
      subject: 'Server downtime issue',
      description: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
      status: 'in_progress',
      priority: 'high',
      category: 'Technical',
      createdAt: '2023-12-01T10:00:00Z',
      updatedAt: '2023-12-01T12:00:00Z',
      assignedTo: 'John Smith',
      messages: [
        {
          id: '1',
          sender: 'user',
          content: 'My VPS server has been down for the last 2 hours. I need urgent assistance.',
          timestamp: '2023-12-01T10:00:00Z'
        },
        {
          id: '2',
          sender: 'support',
          content: 'We are investigating the issue. Our team is working on it.',
          timestamp: '2023-12-01T11:30:00Z'
        },
        {
          id: '3',
          sender: 'support',
          content: 'We found the issue. There was a network configuration problem. We\'re fixing it now.',
          timestamp: '2023-12-01T12:00:00Z'
        }
      ]
    };

    res.json({ success: true, data: ticket });
  } catch (error) {
    logger.error('Error fetching ticket details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket details' });
  }
});

// Create new support ticket
router.post('/tickets', (req, res) => {
  try {
    const { subject, description, priority, category } = req.body;
    
    if (!subject || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: subject, description' 
      });
    }

    const newTicket = {
      id: Date.now().toString(),
      subject,
      description,
      status: 'open',
      priority: priority || 'medium',
      category: category || 'General',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: '1',
          sender: 'user',
          content: description,
          timestamp: new Date().toISOString()
        }
      ]
    };

    logger.info(`New support ticket created: ${subject}`);
    
    // Simulate ticket assignment
    setTimeout(() => {
      logger.info(`Ticket ${newTicket.id} assigned to support team`);
    }, 1000);

    res.json({ 
      success: true, 
      message: 'Support ticket created successfully',
      data: newTicket
    });
  } catch (error) {
    logger.error('Error creating support ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to create support ticket' });
  }
});

// Reply to ticket
router.post('/tickets/:id/reply', (req, res) => {
  try {
    const { id } = req.params;
    const { message, sender } = req.body;
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required field: message' 
      });
    }

    const newMessage = {
      id: Date.now().toString(),
      sender: sender || 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    logger.info(`Reply added to ticket ${id} by ${sender}`);
    
    // Update ticket status to in_progress if it was open
    const updatedStatus = sender === 'user' ? 'in_progress' : 'pending';

    res.json({ 
      success: true, 
      message: 'Reply added successfully',
      data: {
        ticketId: id,
        message: newMessage,
        status: updatedStatus
      }
    });
  } catch (error) {
    logger.error('Error adding reply to ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to add reply to ticket' });
  }
});

// Close ticket
router.put('/tickets/:id/close', (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    logger.info(`Ticket ${id} closed. Reason: ${reason || 'Not specified'}`);
    
    res.json({ 
      success: true, 
      message: 'Ticket closed successfully',
      data: { 
        ticketId: id,
        status: 'closed',
        closedAt: new Date().toISOString(),
        reason
      }
    });
  } catch (error) {
    logger.error('Error closing ticket:', error);
    res.status(500).json({ success: false, message: 'Failed to close ticket' });
  }
});

// Get ticket categories
router.get('/categories', (req, res) => {
  try {
    const categories = [
      { id: 'technical', name: 'Technical', description: 'Server and technical issues' },
      { id: 'billing', name: 'Billing', description: 'Payment and invoice questions' },
      { id: 'domain', name: 'Domain', description: 'Domain registration and transfers' },
      { id: 'account', name: 'Account', description: 'Account management and settings' },
      { id: 'general', name: 'General', description: 'General inquiries' }
    ];

    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('Error fetching ticket categories:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch ticket categories' });
  }
});

// Get support statistics
router.get('/stats', (req, res) => {
  try {
    const stats = {
      totalTickets: 234,
      openTickets: 12,
      inProgressTickets: 8,
      resolvedTickets: 214,
      averageResponseTime: '2 hours',
      ticketsByCategory: {
        Technical: 89,
        Billing: 45,
        Domain: 23,
        Account: 34,
        General: 43
      },
      ticketsByPriority: {
        high: 23,
        medium: 156,
        low: 55
      }
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching support statistics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch support statistics' });
  }
});

export { router as supportRoutes };

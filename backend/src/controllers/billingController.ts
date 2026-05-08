import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class BillingController {
  static async getInvoices(req: Request, res: Response) {
    try {
      // Mock invoice data - in production, fetch from database
      const invoices = [
        {
          id: '1',
          number: 'INV-001',
          userId: '1',
          amount: 29.99,
          status: 'paid',
          dueDate: new Date('2026-01-15'),
          paidDate: new Date('2026-01-14'),
          description: 'Monthly hosting plan',
          items: [
            { id: '1', name: 'VPS Standard Plan', quantity: 1, price: 29.99 }
          ],
          billingAddress: {
            name: 'John Doe',
            company: 'Tech Corp',
            address: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA'
          },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-14')
        }
      ];
      res.json(invoices);
    } catch (error) {
      logger.error('Get invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  }

  static async getInvoiceById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      // Mock invoice data - in production, fetch from database
      const invoice = {
        id: id,
        number: 'INV-001',
        userId: '1',
        amount: 29.99,
        status: 'paid',
        dueDate: new Date('2026-01-15'),
        paidDate: new Date('2026-01-14'),
        description: 'Monthly hosting plan',
        items: [
          { id: '1', name: 'VPS Standard Plan', quantity: 1, price: 29.99 }
        ],
        billingAddress: {
          name: 'John Doe',
          company: 'Tech Corp',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          zip: '10001',
          country: 'USA'
        },
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-14')
      };
      res.json(invoice);
    } catch (error) {
      logger.error('Get invoice error:', error);
      res.status(500).json({ error: 'Failed to fetch invoice' });
    }
  }

  static async createInvoice(req: Request, res: Response) {
    try {
      const invoiceData = req.body;
      const invoice = {
        id: Date.now().toString(),
        number: `INV-${Date.now()}`,
        ...invoiceData,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.status(201).json(invoice);
    } catch (error) {
      logger.error('Create invoice error:', error);
      res.status(400).json({ error: 'Failed to create invoice' });
    }
  }

  static async updateInvoice(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const invoiceData = req.body;
      const invoice = {
        id: id,
        ...invoiceData,
        updatedAt: new Date()
      };
      res.json(invoice);
    } catch (error) {
      logger.error('Update invoice error:', error);
      res.status(400).json({ error: 'Failed to update invoice' });
    }
  }

  static async getPaymentMethods(req: Request, res: Response) {
    try {
      // Mock payment methods - in production, fetch from database
      const paymentMethods = [
        {
          id: '1',
          userId: '1',
          type: 'credit_card',
          isDefault: true,
          cardInfo: {
            brand: 'visa',
            last4: '1234',
            expiryMonth: 12,
            expiryYear: 2025
          },
          createdAt: new Date('2026-01-01'),
          updatedAt: new Date('2026-01-01')
        }
      ];
      res.json(paymentMethods);
    } catch (error) {
      logger.error('Get payment methods error:', error);
      res.status(500).json({ error: 'Failed to fetch payment methods' });
    }
  }

  static async addPaymentMethod(req: Request, res: Response) {
    try {
      const paymentData = req.body;
      const paymentMethod = {
        id: Date.now().toString(),
        ...paymentData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      res.status(201).json(paymentMethod);
    } catch (error) {
      logger.error('Add payment method error:', error);
      res.status(400).json({ error: 'Failed to add payment method' });
    }
  }

  static async processPayment(req: Request, res: Response) {
    try {
      const { invoiceId, paymentMethodId } = req.body;
      // Mock payment processing - in production, integrate with payment gateway
      const payment = {
        id: Date.now().toString(),
        invoiceId: invoiceId,
        paymentMethodId: paymentMethodId,
        amount: 29.99,
        status: 'completed',
        processedAt: new Date()
      };
      res.json(payment);
    } catch (error) {
      logger.error('Process payment error:', error);
      res.status(400).json({ error: 'Failed to process payment' });
    }
  }
}

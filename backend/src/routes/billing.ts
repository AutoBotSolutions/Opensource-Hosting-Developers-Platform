import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Get all invoices
router.get('/invoices', (req, res) => {
  try {
    const invoices = [
      {
        id: '1',
        number: 'INV-2023-001',
        amount: 29.99,
        status: 'paid',
        dueDate: '2023-12-15T00:00:00Z',
        paidDate: '2023-12-14T14:30:00Z',
        description: 'Pro Plan - December 2023',
        items: [
          { name: 'Pro Plan Hosting', quantity: 1, price: 29.99 }
        ]
      },
      {
        id: '2',
        number: 'INV-2023-002',
        amount: 99.99,
        status: 'pending',
        dueDate: '2023-12-20T00:00:00Z',
        description: 'Enterprise Plan - December 2023',
        items: [
          { name: 'Enterprise Plan Hosting', quantity: 1, price: 99.99 }
        ]
      },
      {
        id: '3',
        number: 'INV-2023-003',
        amount: 9.99,
        status: 'overdue',
        dueDate: '2023-12-01T00:00:00Z',
        description: 'Basic Plan - November 2023',
        items: [
          { name: 'Basic Plan Hosting', quantity: 1, price: 9.99 }
        ]
      }
    ];

    res.json({ success: true, data: invoices });
  } catch (error) {
    logger.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
  }
});

// Get invoice details
router.get('/invoices/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const invoice = {
      id,
      number: `INV-2023-${id.padStart(3, '0')}`,
      amount: 29.99,
      status: 'paid',
      dueDate: '2023-12-15T00:00:00Z',
      paidDate: '2023-12-14T14:30:00Z',
      description: 'Pro Plan - December 2023',
      items: [
        { name: 'Pro Plan Hosting', quantity: 1, price: 29.99 }
      ],
      billingAddress: {
        name: 'John Doe',
        company: 'Example Corp',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        zip: '10001',
        country: 'USA'
      },
      paymentMethod: {
        type: 'credit_card',
        last4: '1234',
        brand: 'visa'
      }
    };

    res.json({ success: true, data: invoice });
  } catch (error) {
    logger.error('Error fetching invoice details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch invoice details' });
  }
});

// Pay invoice
router.post('/invoices/:id/pay', (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethodId } = req.body;
    
    if (!paymentMethodId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing payment method ID' 
      });
    }

    // Simulate payment processing
    setTimeout(() => {
      logger.info(`Invoice ${id} paid successfully with payment method ${paymentMethodId}`);
    }, 2000);

    res.json({ 
      success: true, 
      message: 'Payment processing initiated',
      data: { 
        invoiceId: id,
        paymentMethodId,
        status: 'processing'
      }
    });
  } catch (error) {
    logger.error('Error processing payment:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment' });
  }
});

// Download invoice
router.get('/invoices/:id/download', (req, res) => {
  try {
    const { id } = req.params;
    
    // Simulate PDF generation
    const pdfBuffer = Buffer.from(`Invoice ${id} PDF content`);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    
    logger.info(`Invoice ${id} downloaded`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error downloading invoice:', error);
    res.status(500).json({ success: false, message: 'Failed to download invoice' });
  }
});

// Get payment methods
router.get('/payment-methods', (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'pm_1',
        type: 'credit_card',
        brand: 'visa',
        last4: '1234',
        expiryMonth: 12,
        expiryYear: 2025,
        isDefault: true
      },
      {
        id: 'pm_2',
        type: 'credit_card',
        brand: 'mastercard',
        last4: '5678',
        expiryMonth: 9,
        expiryYear: 2024,
        isDefault: false
      },
      {
        id: 'pm_3',
        type: 'bank_account',
        bankName: 'Chase Bank',
        last4: '9012',
        isDefault: false
      }
    ];

    res.json({ success: true, data: paymentMethods });
  } catch (error) {
    logger.error('Error fetching payment methods:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment methods' });
  }
});

// Add payment method
router.post('/payment-methods', (req, res) => {
  try {
    const { type, cardNumber, expiryMonth, expiryYear, cvv, bankName, accountNumber, routingNumber } = req.body;
    
    if (type === 'credit_card') {
      if (!cardNumber || !expiryMonth || !expiryYear || !cvv) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required credit card fields' 
        });
      }
    } else if (type === 'bank_account') {
      if (!bankName || !accountNumber || !routingNumber) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required bank account fields' 
        });
      }
    }

    const newPaymentMethod = {
      id: `pm_${Date.now()}`,
      type,
      ...(type === 'credit_card' ? {
        brand: cardNumber.startsWith('4') ? 'visa' : cardNumber.startsWith('5') ? 'mastercard' : 'unknown',
        last4: cardNumber.slice(-4),
        expiryMonth: parseInt(expiryMonth),
        expiryYear: parseInt(expiryYear)
      } : {
        bankName,
        last4: accountNumber.slice(-4)
      }),
      isDefault: false
    };

    logger.info(`New payment method added: ${newPaymentMethod.id}`);
    res.json({ 
      success: true, 
      message: 'Payment method added successfully',
      data: newPaymentMethod
    });
  } catch (error) {
    logger.error('Error adding payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to add payment method' });
  }
});

// Set default payment method
router.put('/payment-methods/:id/default', (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Payment method ${id} set as default`);
    res.json({ 
      success: true, 
      message: 'Default payment method updated successfully',
      data: { id, isDefault: true }
    });
  } catch (error) {
    logger.error('Error setting default payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to set default payment method' });
  }
});

// Remove payment method
router.delete('/payment-methods/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info(`Payment method ${id} removed`);
    res.json({ 
      success: true, 
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    logger.error('Error removing payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to remove payment method' });
  }
});

// Get billing summary
router.get('/summary', (req, res) => {
  try {
    const summary = {
      totalRevenue: 45678.90,
      thisMonthRevenue: 3456.78,
      pendingInvoices: 3,
      overdueInvoices: 2,
      totalInvoices: 94,
      paidInvoices: 89,
      totalPaymentMethods: 3,
      nextBillingDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    logger.error('Error fetching billing summary:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch billing summary' });
  }
});

export { router as billingRoutes };

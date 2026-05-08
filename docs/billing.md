# Billing Operations Guide

This comprehensive guide covers all aspects of billing operations in the HostingCo system, including invoice management, payment processing, subscription handling, and financial reporting.

## 💰 Billing System Overview

The HostingCo billing system provides comprehensive financial management capabilities including automated invoicing, payment processing, subscription management, and detailed financial reporting.

### Core Components
- **Invoice Management** - Automated generation and tracking
- **Payment Processing** - Multiple payment gateway integration
- **Subscription Management** - Recurring billing and plan management
- **Financial Reporting** - Comprehensive analytics and reporting
- **Tax Management** - Multi-jurisdiction tax calculation
- **Discount System** - Promotional codes and discount management

## 🧾 Invoice Management

### Invoice Generation

#### Automated Invoicing
```javascript
// Automated invoice generation service
class InvoiceService {
  async generateMonthlyInvoices() {
    const users = await knex('users')
      .where('is_active', true)
      .whereNotNull('subscription_plan');
    
    const invoices = [];
    
    for (const user of users) {
      try {
        const invoice = await this.generateInvoice(user.id, 'monthly');
        invoices.push(invoice);
        
        // Send invoice notification
        await this.sendInvoiceNotification(user, invoice);
        
        // Log invoice generation
        await logActivity({
          userId: user.id,
          action: 'invoice_generated',
          resource: 'invoice',
          resourceId: invoice.id,
          details: { type: 'monthly', amount: invoice.total }
        });
      } catch (error) {
        console.error(`Failed to generate invoice for user ${user.id}:`, error);
      }
    }
    
    return invoices;
  }
  
  async generateInvoice(userId, type = 'custom', items = null) {
    const user = await getUserById(userId);
    const invoiceNumber = await this.generateInvoiceNumber();
    
    let invoiceItems = items;
    
    if (!invoiceItems) {
      invoiceItems = await this.generateInvoiceItems(user, type);
    }
    
    const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
    const tax = await this.calculateTax(subtotal, user);
    const total = subtotal + tax;
    
    const invoice = await knex('invoices').insert({
      user_id: userId,
      number: invoiceNumber,
      amount: subtotal,
      tax,
      total,
      status: 'pending',
      due_date: this.calculateDueDate(type),
      items: JSON.stringify(invoiceItems),
      created_at: new Date()
    }).returning('*');
    
    return invoice[0];
  }
  
  async generateInvoiceItems(user, type) {
    const items = [];
    
    // Base subscription plan
    const plan = await this.getSubscriptionPlan(user.subscription_plan);
    items.push({
      description: `${plan.name} - ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      quantity: 1,
      unit_price: plan.price,
      total: plan.price
    });
    
    // Additional services
    const userServers = await knex('servers').where({ user_id: user.id, status: 'active' });
    const additionalServers = userServers.length - plan.included_servers;
    
    if (additionalServers > 0) {
      items.push({
        description: `Additional Servers (${additionalServers})`,
        quantity: additionalServers,
        unit_price: plan.additional_server_price,
        total: additionalServers * plan.additional_server_price
      });
    }
    
    // Storage overage
    const storageUsage = await this.calculateStorageUsage(user.id);
    const storageOverage = Math.max(0, storageUsage - plan.included_storage);
    
    if (storageOverage > 0) {
      items.push({
        description: `Storage Overage (${storageOverage}GB)`,
        quantity: storageOverage,
        unit_price: plan.storage_overage_price,
        total: storageOverage * plan.storage_overage_price
      });
    }
    
    return items;
  }
}
```

#### Manual Invoice Creation
```bash
# Create custom invoice
POST /api/billing/invoices
Authorization: Bearer <admin-token>

# Request body
{
  "userId": "user_123",
  "items": [
    {
      "description": "Custom Development Services",
      "quantity": 10,
      "unitPrice": 150.00,
      "total": 1500.00
    },
    {
      "description": "Premium Support - Monthly",
      "quantity": 1,
      "unitPrice": 299.99,
      "total": 299.99
    }
  ],
  "dueDate": "2026-06-01T00:00:00.000Z",
  "notes": "Custom development project completed"
}

# Response
{
  "success": true,
  "data": {
    "id": "inv_456",
    "number": "INV-2026-001",
    "userId": "user_123",
    "amount": 1799.99,
    "tax": 143.99,
    "total": 1943.98,
    "status": "pending",
    "dueDate": "2026-06-01T00:00:00.000Z",
    "items": [...],
    "createdAt": "2026-05-08T03:14:24.942Z"
  },
  "message": "Invoice created successfully"
}
```

### Invoice Status Management

#### Invoice Status Workflow
```javascript
// Invoice status transitions
const INVOICE_STATUS_TRANSITIONS = {
  pending: ['paid', 'cancelled', 'overdue'],
  paid: ['refunded', 'partially_refunded'],
  overdue: ['paid', 'cancelled', 'sent_to_collections'],
  cancelled: [],
  sent_to_collections: ['paid', 'written_off'],
  refunded: [],
  partially_refunded: ['refunded', 'partially_refunded'],
  written_off: []
};

// Update invoice status
const updateInvoiceStatus = async (invoiceId, newStatus, paymentDetails = null) => {
  const invoice = await getInvoiceById(invoiceId);
  
  // Validate status transition
  const validTransitions = INVOICE_STATUS_TRANSITIONS[invoice.status];
  if (!validTransitions.includes(newStatus)) {
    throw new Error(`Cannot transition from ${invoice.status} to ${newStatus}`);
  }
  
  const updateData = {
    status: newStatus,
    updated_at: new Date()
  };
  
  // Add payment details if provided
  if (paymentDetails) {
    updateData.payment_method = JSON.stringify(paymentDetails.method);
    updateData.paid_date = paymentDetails.paidDate;
    updateData.transaction_id = paymentDetails.transactionId;
  }
  
  await knex('invoices')
    .where({ id: invoiceId })
    .update(updateData);
  
  // Log status change
  await logActivity({
    userId: invoice.user_id,
    action: 'invoice_status_changed',
    resource: 'invoice',
    resourceId: invoiceId,
    details: {
      oldStatus: invoice.status,
      newStatus: newStatus,
      paymentDetails
    }
  });
  
  // Trigger status-specific actions
  await this.handleInvoiceStatusChange(invoice, newStatus, paymentDetails);
  
  return await getInvoiceById(invoiceId);
};

// Handle invoice status changes
const handleInvoiceStatusChange = async (invoice, newStatus, paymentDetails) => {
  switch (newStatus) {
    case 'paid':
      await this.sendPaymentConfirmation(invoice, paymentDetails);
      await this.updateUserSubscription(invoice.user_id);
      break;
      
    case 'overdue':
      await this.sendOverdueNotification(invoice);
      await this.applyLateFees(invoice.id);
      break;
      
    case 'cancelled':
      await this.sendCancellationNotification(invoice);
      await this.handleServiceCancellation(invoice.user_id);
      break;
      
    case 'sent_to_collections':
      await this.initiateCollectionsProcess(invoice);
      break;
  }
};
```

#### Overdue Invoice Processing
```javascript
// Automated overdue invoice processing
const processOverdueInvoices = async () => {
  const overdueInvoices = await knex('invoices')
    .where('status', 'pending')
    .where('due_date', '<', new Date())
    .where('overdue_notified', false);
  
  for (const invoice of overdueInvoices) {
    await this.markInvoiceAsOverdue(invoice.id);
    await this.sendOverdueNotification(invoice);
    await this.applyLateFees(invoice.id);
  }
};

const applyLateFees = async (invoiceId) => {
  const invoice = await getInvoiceById(invoiceId);
  const daysOverdue = Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24));
  
  let lateFee = 0;
  
  if (daysOverdue > 30) {
    lateFee = invoice.total * 0.10; // 10% late fee after 30 days
  } else if (daysOverdue > 15) {
    lateFee = invoice.total * 0.05; // 5% late fee after 15 days
  }
  
  if (lateFee > 0) {
    await knex('invoices')
      .where({ id: invoiceId })
      .update({
        late_fee: lateFee,
        total: invoice.total + lateFee
      });
  }
};
```

## Payment Processing

### Payment Gateway Integration

#### Stripe Integration
```javascript
// Stripe payment service
class StripePaymentService {
  constructor() {
    this.stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
  
  async createPaymentIntent(invoiceId) {
    const invoice = await getInvoiceById(invoiceId);
    
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(invoice.total * 100), // Convert to cents
      currency: invoice.currency || 'usd',
      metadata: {
        invoiceId: invoice.id,
        userId: invoice.user_id
      },
      automatic_payment_methods: {
        enabled: true
      }
    });
    
    // Save payment intent ID
    await knex('invoices')
      .where({ id: invoiceId })
      .update({ payment_intent_id: paymentIntent.id });
    
    return paymentIntent;
  }
  
  async confirmPayment(paymentIntentId) {
    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      const invoiceId = paymentIntent.metadata.invoiceId;
      
      await updateInvoiceStatus(invoiceId, 'paid', {
        method: { type: 'stripe', id: paymentIntent.id },
        paidDate: new Date(),
        transactionId: paymentIntent.charges.data[0].id
      });
      
      return { success: true, invoiceId };
    }
    
    return { success: false, error: 'Payment not successful' };
  }
  
  async setupSubscription(userId, planId, paymentMethodId) {
    const user = await getUserById(userId);
    const plan = await getSubscriptionPlan(planId);
    
    const customer = await this.getOrCreateStripeCustomer(user);
    
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: plan.stripe_price_id }],
      default_payment_method: paymentMethodId,
      metadata: {
        userId: user.id,
        planId: plan.id
      }
    });
    
    // Save subscription to database
    await knex('users')
      .where({ id: userId })
      .update({
        stripe_subscription_id: subscription.id,
        subscription_plan: planId,
        subscription_status: subscription.status
      });
    
    return subscription;
  }
}
```

#### PayPal Integration
```javascript
// PayPal payment service
class PayPalPaymentService {
  constructor() {
    this.paypal = require('@paypal/checkout-server-sdk');
    this.environment = new this.paypal.core.SandboxEnvironment(
      process.env.PAYPAL_CLIENT_ID,
      process.env.PAYPAL_CLIENT_SECRET
    );
    this.client = new this.paypal.core.PayPalHttpClient(this.environment);
  }
  
  async createOrder(invoiceId) {
    const invoice = await getInvoiceById(invoiceId);
    
    const request = new this.paypal.orders.OrdersCreateRequest();
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: invoice.currency || 'USD',
          value: invoice.total.toFixed(2)
        },
        reference_id: invoice.id,
        description: `Invoice ${invoice.number}`
      }]
    });
    
    const response = await this.client.execute(request);
    return response.result;
  }
  
  async captureOrder(orderId) {
    const request = new this.paypal.orders.OrdersCaptureRequest(orderId);
    const response = await this.client.execute(request);
    
    if (response.result.status === 'COMPLETED') {
      const invoiceId = response.result.purchase_units[0].reference_id;
      
      await updateInvoiceStatus(invoiceId, 'paid', {
        method: { type: 'paypal', id: orderId },
        paidDate: new Date(),
        transactionId: response.result.id
      });
      
      return { success: true, invoiceId };
    }
    
    return { success: false, error: 'Payment not completed' };
  }
}
```

### Payment Methods Management

#### Payment Method Storage
```javascript
// Payment method management
class PaymentMethodManager {
  async addPaymentMethod(userId, paymentMethodData) {
    const { type, gateway, details } = paymentMethodData;
    
    let paymentMethod;
    
    switch (type) {
      case 'credit_card':
        paymentMethod = await this.addCreditCard(userId, gateway, details);
        break;
      case 'bank_account':
        paymentMethod = await this.addBankAccount(userId, gateway, details);
        break;
      case 'paypal':
        paymentMethod = await this.addPayPalAccount(userId, details);
        break;
      default:
        throw new Error('Unsupported payment method type');
    }
    
    // Save to database
    const savedMethod = await knex('payment_methods').insert({
      user_id: userId,
      type,
      gateway,
      gateway_method_id: paymentMethod.id,
      details: JSON.stringify(paymentMethod.details),
      is_default: false,
      created_at: new Date()
    }).returning('*');
    
    return savedMethod[0];
  }
  
  async addCreditCard(userId, gateway, cardDetails) {
    const user = await getUserById(userId);
    
    if (gateway === 'stripe') {
      const customer = await this.getOrCreateStripeCustomer(user);
      
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: cardDetails.exp_month,
          exp_year: cardDetails.exp_year,
          cvc: cardDetails.cvc
        }
      });
      
      await this.stripe.paymentMethods.attach(paymentMethod.id, { customer: customer.id });
      
      return {
        id: paymentMethod.id,
        details: {
          last4: paymentMethod.card.last4,
          brand: paymentMethod.card.brand,
          exp_month: paymentMethod.card.exp_month,
          exp_year: paymentMethod.card.exp_year
        }
      };
    }
  }
  
  async setDefaultPaymentMethod(userId, paymentMethodId) {
    await knex.transaction(async (trx) => {
      // Remove default flag from all methods
      await trx('payment_methods')
        .where({ user_id: userId })
        .update({ is_default: false });
      
      // Set new default
      await trx('payment_methods')
        .where({ id: paymentMethodId, user_id: userId })
        .update({ is_default: true });
    });
  }
}
```

## Subscription Management

### Subscription Plans

#### Plan Configuration
```javascript
// Subscription plan management
class SubscriptionPlanService {
  async createPlan(planData) {
    const {
      name,
      description,
      price,
      billing_cycle,
      currency,
      features,
      limits,
      stripe_price_id
    } = planData;
    
    const plan = await knex('subscription_plans').insert({
      name,
      description,
      price,
      billing_cycle,
      currency,
      features: JSON.stringify(features),
      limits: JSON.stringify(limits),
      stripe_price_id,
      is_active: true,
      created_at: new Date()
    }).returning('*');
    
    return plan[0];
  }
  
  async updateSubscription(userId, newPlanId) {
    const user = await getUserById(userId);
    const currentPlan = await getSubscriptionPlan(user.subscription_plan);
    const newPlan = await getSubscriptionPlan(newPlanId);
    
    // Handle Stripe subscription update
    if (user.stripe_subscription_id) {
      await this.updateStripeSubscription(user.stripe_subscription_id, newPlan);
    }
    
    // Update user record
    await knex('users')
      .where({ id: userId })
      .update({
        subscription_plan: newPlanId,
        subscription_updated_at: new Date()
      });
    
    // Log subscription change
    await logActivity({
      userId,
      action: 'subscription_changed',
      resource: 'subscription',
      details: {
        oldPlan: currentPlan.name,
        newPlan: newPlan.name,
        priceChange: newPlan.price - currentPlan.price
      }
    });
    
    // Send notification
    await this.sendSubscriptionChangeNotification(user, currentPlan, newPlan);
    
    return await getUserById(userId);
  }
  
  async cancelSubscription(userId, reason, immediate = false) {
    const user = await getUserById(userId);
    
    if (immediate) {
      // Cancel immediately
      if (user.stripe_subscription_id) {
        await this.stripe.subscriptions.del(user.stripe_subscription_id);
      }
      
      await knex('users')
        .where({ id: userId })
        .update({
          subscription_status: 'cancelled',
          subscription_cancelled_at: new Date(),
          cancellation_reason: reason
        });
      
      // Handle service cancellation
      await this.handleServiceCancellation(userId);
    } else {
      // Cancel at period end
      if (user.stripe_subscription_id) {
        await this.stripe.subscriptions.update(user.stripe_subscription_id, {
          cancel_at_period_end: true
        });
      }
      
      await knex('users')
        .where({ id: userId })
        .update({
          subscription_status: 'cancelled_pending',
          cancellation_reason: reason
        });
    }
    
    await logActivity({
      userId,
      action: 'subscription_cancelled',
      resource: 'subscription',
      details: { reason, immediate }
    });
  }
}
```

#### Subscription Billing Automation
```javascript
// Automated subscription billing
const processSubscriptionBilling = async () => {
  const activeSubscriptions = await knex('users')
    .where('subscription_status', 'active')
    .whereNotNull('stripe_subscription_id');
  
  for (const user of activeSubscriptions) {
    try {
      // Check if billing is due
      const nextBillingDate = await this.getNextBillingDate(user.stripe_subscription_id);
      
      if (new Date(nextBillingDate) <= new Date()) {
        await this.processSubscriptionPayment(user);
      }
    } catch (error) {
      console.error(`Failed to process subscription for user ${user.id}:`, error);
      await this.notifyBillingFailure(user, error);
    }
  }
};

const processSubscriptionPayment = async (user) => {
  const subscription = await this.stripe.subscriptions.retrieve(user.stripe_subscription_id);
  
  if (subscription.status === 'active') {
    // Create invoice for this billing period
    const invoice = await this.generateInvoice(user.id, 'subscription');
    
    // Attempt payment using default payment method
    const defaultPaymentMethod = await this.getDefaultPaymentMethod(user.id);
    
    if (defaultPaymentMethod) {
      await this.processPayment(invoice.id, defaultPaymentMethod);
    } else {
      // Notify user to add payment method
      await this.notifyPaymentMethodRequired(user, invoice);
    }
  }
};
```

## Financial Reporting

### Revenue Analytics

#### Revenue Dashboard
```javascript
// Financial analytics service
class FinancialAnalyticsService {
  async getRevenueAnalytics(period = '30d') {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));
    
    const analytics = {
      overview: await this.getRevenueOverview(startDate, endDate),
      byPlan: await this.getRevenueByPlan(startDate, endDate),
      byPaymentMethod: await this.getRevenueByPaymentMethod(startDate, endDate),
      trends: await this.getRevenueTrends(startDate, endDate),
      forecasts: await this.getRevenueForecast()
    };
    
    return analytics;
  }
  
  async getRevenueOverview(startDate, endDate) {
    const [totalRevenue, paidRevenue, pendingRevenue, overdueRevenue] = await Promise.all([
      knex('invoices')
        .whereBetween('created_at', [startDate, endDate])
        .sum('total as total')
        .first(),
      
      knex('invoices')
        .whereBetween('created_at', [startDate, endDate])
        .where('status', 'paid')
        .sum('total as total')
        .first(),
      
      knex('invoices')
        .whereBetween('created_at', [startDate, endDate])
        .where('status', 'pending')
        .sum('total as total')
        .first(),
      
      knex('invoices')
        .whereBetween('created_at', [startDate, endDate])
        .where('status', 'overdue')
        .sum('total as total')
        .first()
    ]);
    
    return {
      total: totalRevenue.total || 0,
      paid: paidRevenue.total || 0,
      pending: pendingRevenue.total || 0,
      overdue: overdueRevenue.total || 0,
      collectionRate: ((paidRevenue.total / totalRevenue.total) * 100).toFixed(2)
    };
  }
  
  async getRevenueByPlan(startDate, endDate) {
    return await knex('invoices as inv')
      .join('users as u', 'inv.user_id', 'u.id')
      .join('subscription_plans as sp', 'u.subscription_plan', 'sp.id')
      .whereBetween('inv.created_at', [startDate, endDate])
      .where('inv.status', 'paid')
      .select(
        'sp.name as plan',
        knex.raw('SUM(inv.total) as revenue'),
        knex.raw('COUNT(*) as invoice_count')
      )
      .groupBy('sp.name')
      .orderBy('revenue', 'desc');
  }
  
  async getRevenueTrends(startDate, endDate) {
    return await knex('invoices')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'paid')
      .select(
        knex.raw('DATE(created_at) as date'),
        knex.raw('SUM(total) as revenue'),
        knex.raw('COUNT(*) as invoices')
      )
      .groupBy(knex.raw('DATE(created_at)'))
      .orderBy('date');
  }
}
```

#### Financial Reports
```bash
# Generate monthly financial report
GET /api/billing/reports/monthly?month=2026-05
Authorization: Bearer <admin-token>

# Response
{
  "success": true,
  "data": {
    "period": "2026-05",
    "overview": {
      "totalRevenue": 45678.90,
      "paidRevenue": 42156.23,
      "pendingRevenue": 3522.67,
      "overdueRevenue": 0.00,
      "collectionRate": "92.3",
      "growthRate": "12.5"
    },
    "byPlan": [
      {
        "plan": "Basic",
        "revenue": 12345.67,
        "invoiceCount": 156,
        "percentage": "27.0"
      },
      {
        "plan": "Pro",
        "revenue": 23456.78,
        "invoiceCount": 89,
        "percentage": "51.4"
      },
      {
        "plan": "Enterprise",
        "revenue": 9876.45,
        "invoiceCount": 23,
        "percentage": "21.6"
      }
    ],
    "byPaymentMethod": [
      {
        "method": "Credit Card",
        "revenue": 38901.23,
        "percentage": "85.2"
      },
      {
        "method": "PayPal",
        "revenue": 3255.00,
        "percentage": "7.1"
      },
      {
        "method": "Bank Transfer",
        "revenue": 3500.00,
        "percentage": "7.7"
      }
    ],
    "trends": [
      {
        "date": "2026-05-01",
        "revenue": 1234.56,
        "invoices": 12
      },
      {
        "date": "2026-05-02",
        "revenue": 2345.67,
        "invoices": 18
      }
    ]
  }
}
```

### Tax Management

#### Tax Calculation
```javascript
// Tax calculation service
class TaxService {
  async calculateTax(subtotal, user, invoiceItems = []) {
    let taxAmount = 0;
    const taxBreakdown = [];
    
    // Get user's tax jurisdiction
    const jurisdiction = await this.getTaxJurisdiction(user);
    
    // Calculate tax by jurisdiction
    for (const taxRule of jurisdiction.tax_rules) {
      let taxableAmount = subtotal;
      
      // Apply tax exemptions
      if (taxRule.exemptions && taxRule.exemptions.length > 0) {
        taxableAmount = await this.calculateTaxableAmount(invoiceItems, taxRule.exemptions);
      }
      
      const tax = (taxableAmount * taxRule.rate) / 100;
      taxAmount += tax;
      
      taxBreakdown.push({
        type: taxRule.type,
        rate: taxRule.rate,
        taxableAmount,
        tax,
        jurisdiction: taxRule.jurisdiction
      });
    }
    
    return {
      amount: taxAmount,
      breakdown: taxBreakdown,
      jurisdiction: jurisdiction.name
    };
  }
  
  async getTaxJurisdiction(user) {
    // Determine tax jurisdiction based on user's address
    const country = user.country || 'US';
    const state = user.state || user.province;
    const city = user.city;
    
    // Look up tax rules for this jurisdiction
    const jurisdiction = await knex('tax_jurisdictions')
      .where('country', country)
      .where(function() {
        if (state) this.where('state', state);
        if (city) this.where('city', city);
      })
      .first();
    
    if (!jurisdiction) {
      // Default to no tax if jurisdiction not found
      return {
        name: 'No Tax',
        tax_rules: []
      };
    }
    
    return {
      id: jurisdiction.id,
      name: jurisdiction.name,
      tax_rules: JSON.parse(jurisdiction.tax_rules)
    };
  }
  
  async generateTaxReport(startDate, endDate) {
    const invoices = await knex('invoices')
      .whereBetween('created_at', [startDate, endDate])
      .where('status', 'paid');
    
    const taxReport = {
      period: { startDate, endDate },
      totalTax: 0,
      jurisdictionBreakdown: {},
      summary: {}
    };
    
    for (const invoice of invoices) {
      const user = await getUserById(invoice.user_id);
      const taxInfo = await this.calculateTax(invoice.amount, user, JSON.parse(invoice.items));
      
      taxReport.totalTax += taxInfo.amount;
      
      // Accumulate by jurisdiction
      const jurisdictionName = taxInfo.jurisdiction;
      if (!taxReport.jurisdictionBreakdown[jurisdictionName]) {
        taxReport.jurisdictionBreakdown[jurisdictionName] = {
          taxAmount: 0,
          invoiceCount: 0
        };
      }
      
      taxReport.jurisdictionBreakdown[jurisdictionName].taxAmount += taxInfo.amount;
      taxReport.jurisdictionBreakdown[jurisdictionName].invoiceCount += 1;
    }
    
    return taxReport;
  }
}
```

## 🎁 Discount and Promotion Management

### Discount System

#### Discount Code Management
```javascript
// Discount management service
class DiscountService {
  async createDiscountCode(discountData) {
    const {
      code,
      type, // percentage, fixed_amount, free_trial
      value,
      usage_limit,
      expires_at,
      applicable_plans,
      minimum_amount,
      user_restrictions
    } = discountData;
    
    const discount = await knex('discount_codes').insert({
      code: code.toUpperCase(),
      type,
      value,
      usage_limit,
      usage_count: 0,
      expires_at: expires_at || null,
      applicable_plans: JSON.stringify(applicable_plans || []),
      minimum_amount: minimum_amount || 0,
      user_restrictions: JSON.stringify(user_restrictions || []),
      is_active: true,
      created_at: new Date()
    }).returning('*');
    
    return discount[0];
  }
  
  async applyDiscountCode(userId, invoiceId, discountCode) {
    const discount = await this.validateDiscountCode(userId, discountCode);
    const invoice = await getInvoiceById(invoiceId);
    
    let discountAmount = 0;
    
    switch (discount.type) {
      case 'percentage':
        discountAmount = (invoice.total * discount.value) / 100;
        break;
        
      case 'fixed_amount':
        discountAmount = Math.min(discount.value, invoice.total);
        break;
        
      case 'free_trial':
        // Handle trial logic
        return await this.applyFreeTrial(userId, discount);
    }
    
    // Update invoice with discount
    const newTotal = invoice.total - discountAmount;
    
    await knex('invoices')
      .where({ id: invoiceId })
      .update({
        discount_code: discount.code,
        discount_amount: discountAmount,
        total: newTotal
      });
    
    // Increment usage count
    await knex('discount_codes')
      .where({ id: discount.id })
      .increment('usage_count', 1);
    
    // Log discount usage
    await logActivity({
      userId,
      action: 'discount_applied',
      resource: 'discount',
      resourceId: discount.id,
      details: {
        code: discount.code,
        amount: discountAmount,
        invoiceId
      }
    });
    
    return {
      discountAmount,
      newTotal,
      discount: {
        code: discount.code,
        type: discount.type,
        value: discount.value
      }
    };
  }
  
  async validateDiscountCode(userId, code) {
    const discount = await knex('discount_codes')
      .where('code', code.toUpperCase())
      .where('is_active', true)
      .first();
    
    if (!discount) {
      throw new Error('Invalid discount code');
    }
    
    // Check expiration
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      throw new Error('Discount code has expired');
    }
    
    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      throw new Error('Discount code usage limit exceeded');
    }
    
    // Check user restrictions
    if (discount.user_restrictions) {
      const restrictions = JSON.parse(discount.user_restrictions);
      if (restrictions.allowed_users && !restrictions.allowed_users.includes(userId)) {
        throw new Error('Discount code not valid for this user');
      }
      
      if (restrictions.excluded_users && restrictions.excluded_users.includes(userId)) {
        throw new Error('Discount code not valid for this user');
      }
    }
    
    return discount;
  }
}
```

## 📧 Billing Notifications

### Email Templates

#### Invoice Notifications
```javascript
// Email notification service
class BillingNotificationService {
  async sendInvoiceNotification(user, invoice) {
    const template = 'invoice-created';
    const subject = `Invoice ${invoice.number} from HostingCo`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        invoiceNumber: invoice.number,
        amount: invoice.total,
        dueDate: new Date(invoice.due_date).toLocaleDateString(),
        paymentUrl: `${process.env.FRONTEND_URL}/billing/invoices/${invoice.id}`,
        downloadUrl: `${process.env.FRONTEND_URL}/billing/invoices/${invoice.id}/download`
      }
    });
  }
  
  async sendPaymentConfirmation(user, invoice, paymentDetails) {
    const template = 'payment-confirmed';
    const subject = `Payment Confirmed for Invoice ${invoice.number}`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        invoiceNumber: invoice.number,
        amount: invoice.total,
        paymentDate: new Date().toLocaleDateString(),
        paymentMethod: paymentDetails.method.type,
        receiptUrl: `${process.env.FRONTEND_URL}/billing/receipts/${invoice.id}`
      }
    });
  }
  
  async sendOverdueNotification(user, invoice) {
    const template = 'invoice-overdue';
    const subject = `Urgent: Invoice ${invoice.number} is Overdue`;
    
    await emailService.send({
      to: user.email,
      subject,
      template,
      data: {
        userName: user.name,
        invoiceNumber: invoice.number,
        amount: invoice.total,
        dueDate: new Date(invoice.due_date).toLocaleDateString(),
        daysOverdue: Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)),
        paymentUrl: `${process.env.FRONTEND_URL}/billing/invoices/${invoice.id}/pay`
      }
    });
  }
}
```

## Billing Operations Tools

### Administrative Tools

#### Billing CLI Commands
```bash
# Generate monthly invoices
npm run billing:generate-invoices -- --month=2026-05

# Process overdue invoices
npm run billing:process-overdue

# Send payment reminders
npm run billing:send-reminders -- --days=7

# Generate financial report
npm run billing:report -- --period=monthly --month=2026-05

# Export invoice data
npm run billing:export -- --format=csv --start=2026-05-01 --end=2026-05-31

# Validate tax calculations
npm run billing:validate-tax -- --period=monthly

# Process refunds
npm run billing:refund -- --invoice=inv_123 --amount=100.00 --reason="Service credit"
```

#### Bulk Operations
```javascript
// Bulk billing operations
const bulkBillingOperations = {
  generateBulkInvoices: async (userIds, type = 'monthly') => {
    const results = { success: [], errors: [] };
    
    for (const userId of userIds) {
      try {
        const invoice = await invoiceService.generateInvoice(userId, type);
        results.success.push({ userId, invoiceId: invoice.id });
      } catch (error) {
        results.errors.push({ userId, error: error.message });
      }
    }
    
    return results;
  },
  
  sendBulkReminders: async (overdueDays) => {
    const overdueInvoices = await knex('invoices')
      .where('status', 'pending')
      .where('due_date', '<', new Date(Date.now() - overdueDays * 24 * 60 * 60 * 1000))
      .where('reminder_sent', false);
    
    for (const invoice of overdueInvoices) {
      const user = await getUserById(invoice.user_id);
      await notificationService.sendOverdueNotification(user, invoice);
      
      await knex('invoices')
        .where({ id: invoice.id })
        .update({ reminder_sent: true });
    }
    
    return overdueInvoices.length;
  }
};
```

## Billing Procedures

### Daily Procedures
- [ ] Process new invoice payments
- [ ] Check for failed payments and retry
- [ ] Send payment confirmations
- [ ] Update subscription statuses

### Weekly Procedures
- [ ] Generate weekly revenue reports
- [ ] Process overdue invoice notifications
- [ ] Review payment gateway settlements
- [ ] Update financial forecasts

### Monthly Procedures
- [ ] Generate monthly invoices
- [ ] Process subscription billing
- [ ] Generate monthly financial reports
- [ ] Calculate and remit taxes
- [ ] Review revenue analytics

### Quarterly Procedures
- [ ] Generate quarterly financial statements
- [ ] Conduct revenue reconciliation
- [ ] Review tax compliance
- [ ] Update pricing strategies
- [ ] Audit billing processes

## Common Issues and Solutions

### Payment Processing Issues
```bash
# Issue: Payment failed
# Solution: Check payment method validity
npm run billing:check-payment-method -- --user=user_123

# Issue: Duplicate invoice
# Solution: Check for existing invoices
npm run billing:check-duplicates -- --user=user_123 --month=2026-05

# Issue: Tax calculation error
# Solution: Validate tax jurisdiction
npm run billing:validate-tax -- --user=user_123
```

### Subscription Issues
```bash
# Issue: Subscription not renewing
# Solution: Check subscription status
npm run subscription:status -- --user=user_123

# Issue: Plan change not applied
# Solution: Force subscription update
npm run subscription:update -- --user=user_123 --plan=pro

# Issue: Cancellation not processed
# Solution: Process cancellation manually
npm run subscription:cancel -- --user=user_123 --immediate=true
```

### Reporting Issues
```bash
# Issue: Report data mismatch
# Solution: Rebuild financial cache
npm run billing:rebuild-cache -- --period=monthly

# Issue: Tax report incorrect
# Solution: Recalculate taxes
npm run billing:recalculate-tax -- --period=2026-05

# Issue: Revenue forecast inaccurate
# Solution: Update forecast model
npm run billing:update-forecast -- --period=quarterly
```

---

*Last updated: $(date)*

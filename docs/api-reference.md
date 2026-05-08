# API Reference

This comprehensive reference documents all API endpoints available in the HostingCo system.

## Base URL

- **Development**: `http://localhost:3003/api`
- **Production**: `https://yourdomain.com/api`

## Authentication

Most API endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Flow
1. Login to obtain JWT token
2. Include token in subsequent requests
3. Token expires after 24 hours (configurable)

## Response Format

All API responses follow a consistent format:

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Operation successful",
  "timestamp": "2026-05-08T03:14:24.942Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {
      // Additional error details
    }
  },
  "timestamp": "2026-05-08T03:14:24.942Z"
}
```

## Health Check

### GET /health
Check API server health and status.

**Request**:
```bash
curl http://localhost:3003/api/health
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2026-05-08T03:14:24.942Z",
    "uptime": 7.844690395,
    "environment": "development",
    "version": "1.0.0"
  }
}
```

## 🔐 Authentication Endpoints

### POST /auth/login
Authenticate user and return JWT token.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "admin",
      "permissions": ["read", "write", "delete"]
    },
    "expiresIn": "24h"
  }
}
```

### POST /auth/register
Register new user account.

**Request Body**:
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "name": "Jane Smith",
  "company": "Acme Corp",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_456",
      "email": "newuser@example.com",
      "name": "Jane Smith",
      "role": "user",
      "isActive": true,
      "createdAt": "2026-05-08T03:14:24.942Z"
    }
  },
  "message": "User registered successfully"
}
```

### POST /auth/logout
Logout user and invalidate token.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### POST /auth/refresh
Refresh JWT token.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "new.jwt.token...",
    "expiresIn": "24h"
  }
}
```

## �️ Hosting Plans Endpoint

### GET /hosting/plans
Get available hosting plans.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "basic",
      "name": "Basic Plan",
      "type": "shared",
      "price": 9.99,
      "specs": {
        "cpu": 2,
        "ram": "4GB",
        "storage": "50GB",
        "bandwidth": "1TB"
      },
      "features": ["Free SSL", "Daily Backups", "Email Support"]
    },
    {
      "id": "pro",
      "name": "Pro Plan",
      "type": "vps",
      "price": 29.99,
      "specs": {
        "cpu": 4,
        "ram": "8GB",
        "storage": "100GB",
        "bandwidth": "2TB"
      },
      "features": ["Free SSL", "Daily Backups", "Priority Support", "Root Access"]
    },
    {
      "id": "enterprise",
      "name": "Enterprise Plan",
      "type": "dedicated",
      "price": 99.99,
      "specs": {
        "cpu": 8,
        "ram": "16GB",
        "storage": "200GB",
        "bandwidth": "5TB"
      },
      "features": ["Free SSL", "Real-time Backups", "24/7 Support", "Root Access", "DDoS Protection"]
    }
  ]
}
```

## User Management Endpoints

### GET /users
Get list of users (admin only).

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `search` (string): Search term
- `role` (string): Filter by role

**Response**:
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "user_123",
        "email": "user@example.com",
        "name": "John Doe",
        "role": "admin",
        "isActive": true,
        "createdAt": "2026-05-08T03:14:24.942Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### GET /users/:id
Get user by ID.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "phone": "+1234567890",
    "role": "admin",
    "permissions": ["read", "write", "delete"],
    "settings": {
      "theme": "light",
      "notifications": true
    },
    "isActive": true,
    "createdAt": "2026-05-08T03:14:24.942Z",
    "lastLogin": "2026-05-08T03:14:24.942Z"
  }
}
```

### PUT /users/:id
Update user information.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "company": "New Company",
  "phone": "+1234567890",
  "settings": {
    "theme": "dark",
    "notifications": false
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Updated",
    "company": "New Company",
    "phone": "+1234567890",
    "settings": {
      "theme": "dark",
      "notifications": false
    },
    "updatedAt": "2026-05-08T03:14:24.942Z"
  },
  "message": "User updated successfully"
}
```

### DELETE /users/:id
Delete user (admin only).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

## Dashboard Endpoints

### GET /dashboard/stats
Get dashboard statistics.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 150,
      "activeUsers": 120,
      "totalServers": 45,
      "activeServers": 42,
      "totalRevenue": 12500.00,
      "monthlyRevenue": 2500.00
    },
    "servers": {
      "byStatus": {
        "active": 42,
        "inactive": 3,
        "maintenance": 0
      },
      "byPlan": {
        "basic": 20,
        "pro": 15,
        "enterprise": 10
      }
    },
    "users": {
      "byRole": {
        "admin": 5,
        "user": 145
      },
      "newThisMonth": 12
    },
    "billing": {
      "pendingInvoices": 8,
      "overdueInvoices": 2,
      "totalPending": 1250.00
    }
  }
}
```

### POST /dashboard/refresh
Refresh dashboard data.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Dashboard data refreshed successfully",
  "timestamp": "2026-05-08T03:14:24.942Z"
}
```

### POST /dashboard/add-server
Add new server (quick action).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "web-server-01",
  "plan": "pro",
  "location": "us-east-1"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Server created successfully",
  "data": {
    "id": "server_789",
    "name": "web-server-01",
    "plan": "pro",
    "location": "us-east-1",
    "status": "active",
    "ip": "192.168.1.101",
    "specs": {
      "cpu": 4,
      "ram": "8GB",
      "storage": "100GB",
      "bandwidth": "2TB"
    },
    "createdAt": "2026-05-08T03:14:24.942Z"
  }
}
```

### POST /dashboard/add-client
Add new client (quick action).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "Acme Corporation",
  "email": "contact@acme.com",
  "phone": "+1234567890",
  "company": "Acme Corporation"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": {
    "id": "user_101",
    "name": "Acme Corporation",
    "email": "contact@acme.com",
    "phone": "+1234567890",
    "company": "Acme Corporation",
    "status": "active",
    "createdAt": "2026-05-08T03:14:24.942Z",
    "servers": [],
    "billing": {
      "totalSpent": 0,
      "nextBillingDate": "2026-06-08T03:14:24.942Z"
    }
  }
}
```

## Hosting Endpoints

### GET /hosting/servers
Get list of servers.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status
- `plan` (string): Filter by plan
- `search` (string): Search term

**Response**:
```json
{
  "success": true,
  "data": {
    "servers": [
      {
        "id": "server_789",
        "name": "web-server-01",
        "plan": "pro",
        "location": "us-east-1",
        "status": "active",
        "ip": "192.168.1.101",
        "specs": {
          "cpu": 4,
          "ram": "8GB",
          "storage": "100GB",
          "bandwidth": "2TB"
        },
        "statistics": {
          "cpuUsage": 25.5,
          "memoryUsage": 60.2,
          "diskUsage": 45.8,
          "networkIn": 1024.5,
          "networkOut": 2048.3
        },
        "uptime": 99.9,
        "createdAt": "2026-05-08T03:14:24.942Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "pages": 3
    }
  }
}
```

### GET /hosting/servers/:id
Get server details.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "server_789",
    "name": "web-server-01",
    "plan": "pro",
    "location": "us-east-1",
    "status": "active",
    "ip": "192.168.1.101",
    "specs": {
      "cpu": 4,
      "ram": "8GB",
      "storage": "100GB",
      "bandwidth": "2TB"
    },
    "settings": {
      "hostname": "web-server-01",
      "firewall": true,
      "backups": true,
      "monitoring": true,
      "ssl": true
    },
    "statistics": {
      "cpuUsage": 25.5,
      "memoryUsage": 60.2,
      "diskUsage": 45.8,
      "networkIn": 1024.5,
      "networkOut": 2048.3,
      "processes": 45,
      "connections": 120
    },
    "uptime": 99.9,
    "load": [0.5, 0.8, 0.6],
    "createdAt": "2026-05-08T03:14:24.942Z",
    "lastBackup": "2026-05-08T02:00:00.000Z"
  }
}
```

### POST /hosting/servers
Create new server.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "app-server-02",
  "plan": "enterprise",
  "location": "eu-west-1",
  "settings": {
    "hostname": "app-server-02",
    "firewall": true,
    "backups": true,
    "monitoring": true,
    "ssl": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Server created successfully",
  "data": {
    "id": "server_102",
    "name": "app-server-02",
    "plan": "enterprise",
    "location": "eu-west-1",
    "status": "provisioning",
    "ip": null,
    "specs": {
      "cpu": 8,
      "ram": "16GB",
      "storage": "200GB",
      "bandwidth": "5TB"
    },
    "createdAt": "2026-05-08T03:14:24.942Z"
  }
}
```

### PUT /hosting/servers/:id
Update server configuration.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "web-server-01-updated",
  "settings": {
    "firewall": false,
    "backups": true,
    "monitoring": true,
    "ssl": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "Server updated successfully",
  "data": {
    "id": "server_789",
    "name": "web-server-01-updated",
    "settings": {
      "hostname": "web-server-01-updated",
      "firewall": false,
      "backups": true,
      "monitoring": true,
      "ssl": true
    },
    "updatedAt": "2026-05-08T03:14:24.942Z"
  }
}
```

### DELETE /hosting/servers/:id
Delete server.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Server deleted successfully"
}
```

### POST /hosting/servers/:id/power
Perform server power actions.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "action": "restart"
}
```

**Available Actions**:
- `start` - Start server
- `stop` - Stop server
- `restart` - Restart server

**Response**:
```json
{
  "success": true,
  "message": "Server restart command initiated successfully",
  "data": {
    "id": "server_789",
    "action": "restart",
    "status": "active"
  }
}
```

### GET /hosting/servers/:id/statistics
Get server statistics.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "cpuUsage": 25.5,
    "memoryUsage": 60.2,
    "diskUsage": 45.8,
    "networkIn": 1024,
    "networkOut": 2048,
    "uptime": 99.9,
    "processes": 45,
    "connections": 128
  }
}
```

### PUT /hosting/servers/:id/settings
Update server settings.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "hostname": "web-server-01-updated",
  "firewall": true,
  "backups": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Server settings updated successfully",
  "data": {
    "id": "server_789",
    "hostname": "web-server-01-updated",
    "firewall": true,
    "backups": true
  }
}
```

## 💰 Billing Endpoints

### GET /billing/invoices
Get list of invoices.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (paid, pending, overdue)
- `userId` (string): Filter by user ID

**Response**:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "id": "inv_123",
        "userId": "user_456",
        "number": "INV-2026-001",
        "amount": 99.99,
        "status": "paid",
        "dueDate": "2026-06-01T00:00:00.000Z",
        "paidDate": "2026-05-15T10:30:00.000Z",
        "items": [
          {
            "description": "Pro Plan - Monthly",
            "quantity": 1,
            "unitPrice": 99.99,
            "total": 99.99
          }
        ],
        "createdAt": "2026-05-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "pages": 8
    }
  }
}
```

### GET /billing/invoices/:id
Get invoice details.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "inv_123",
    "userId": "user_456",
    "user": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com",
      "company": "Acme Corp"
    },
    "number": "INV-2026-001",
    "amount": 99.99,
    "tax": 8.00,
    "total": 107.99,
    "status": "paid",
    "dueDate": "2026-06-01T00:00:00.000Z",
    "paidDate": "2026-05-15T10:30:00.000Z",
    "items": [
      {
        "description": "Pro Plan - Monthly",
        "quantity": 1,
        "unitPrice": 99.99,
        "total": 99.99
      }
    ],
    "paymentMethod": {
      "type": "credit_card",
      "last4": "4242",
      "brand": "Visa"
    },
    "createdAt": "2026-05-01T00:00:00.000Z",
    "updatedAt": "2026-05-15T10:30:00.000Z"
  }
}
```

### POST /billing/invoices/:id/pay
Process invoice payment.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "paymentMethodId": "pm_1"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment processing initiated",
  "data": {
    "invoiceId": "inv_123",
    "paymentMethodId": "pm_1",
    "status": "processing"
  }
}
```

### GET /billing/invoices/:id/download
Download invoice PDF.

**Headers**: `Authorization: Bearer <token>`

**Response**: PDF file download

### GET /billing/payment-methods
Get payment methods.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_1",
      "type": "credit_card",
      "brand": "visa",
      "last4": "1234",
      "expiryMonth": 12,
      "expiryYear": 2025,
      "isDefault": true
    },
    {
      "id": "pm_2",
      "type": "credit_card",
      "brand": "mastercard",
      "last4": "5678",
      "expiryMonth": 9,
      "expiryYear": 2024,
      "isDefault": false
    }
  ]
}
```

### POST /billing/payment-methods
Add new payment method.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "type": "credit_card",
  "cardNumber": "4242424242424242",
  "expiryMonth": 12,
  "expiryYear": 2025,
  "cvv": "123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment method added successfully",
  "data": {
    "id": "pm_3",
    "type": "credit_card",
    "brand": "visa",
    "last4": "4242",
    "expiryMonth": 12,
    "expiryYear": 2025,
    "isDefault": false
  }
}
```

### PUT /billing/payment-methods/:id/default
Set default payment method.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Default payment method updated successfully",
  "data": {
    "id": "pm_1",
    "isDefault": true
  }
}
```

### DELETE /billing/payment-methods/:id
Remove payment method.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Payment method removed successfully"
}
```

### GET /billing/summary
Get billing summary.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalRevenue": 45678.90,
    "thisMonthRevenue": 3456.78,
    "pendingInvoices": 3,
    "overdueInvoices": 2,
    "totalInvoices": 94,
    "paidInvoices": 89,
    "totalPaymentMethods": 3,
    "nextBillingDate": "2026-05-23T03:14:24.942Z"
  }
}
```

## 🎫 Support Endpoints

### GET /support/tickets
Get list of support tickets.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page` (number): Page number
- `limit` (number): Items per page
- `status` (string): Filter by status (open, in_progress, resolved, closed)
- `priority` (string): Filter by priority (low, medium, high, urgent)
- `userId` (string): Filter by user ID

**Response**:
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "id": "ticket_789",
        "userId": "user_456",
        "subject": "Server not responding",
        "status": "open",
        "priority": "high",
        "category": "technical",
        "createdAt": "2026-05-08T03:14:24.942Z",
        "updatedAt": "2026-05-08T03:14:24.942Z",
        "messageCount": 3
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "pages": 2
    }
  }
}
```

### GET /support/tickets/:id
Get ticket details.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "ticket_789",
    "userId": "user_456",
    "user": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "subject": "Server not responding",
    "description": "My server has been down for 2 hours...",
    "status": "open",
    "priority": "high",
    "category": "technical",
    "assignedTo": {
      "id": "user_123",
      "name": "Support Agent"
    },
    "messages": [
      {
        "id": "msg_001",
        "sender": "user",
        "content": "My server has been down for 2 hours...",
        "timestamp": "2026-05-08T03:14:24.942Z"
      },
      {
        "id": "msg_002",
        "sender": "support",
        "content": "I'm looking into this issue now...",
        "timestamp": "2026-05-08T03:16:24.942Z"
      }
    ],
    "createdAt": "2026-05-08T03:14:24.942Z",
    "updatedAt": "2026-05-08T03:16:24.942Z"
  }
}
```

### POST /support/tickets
Create new support ticket.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "subject": "Billing question",
  "description": "I have a question about my latest invoice...",
  "priority": "medium",
  "category": "billing"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Ticket created successfully",
  "data": {
    "id": "ticket_101",
    "userId": "user_456",
    "subject": "Billing question",
    "description": "I have a question about my latest invoice...",
    "status": "open",
    "priority": "medium",
    "category": "billing",
    "createdAt": "2026-05-08T03:14:24.942Z"
  }
}
```

### POST /support/tickets/:id/reply
Reply to support ticket.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "message": "Thank you for the quick response!",
  "sender": "user"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Reply added successfully",
  "data": {
    "ticketId": "ticket_789",
    "message": {
      "id": "msg_003",
      "sender": "user",
      "content": "Thank you for the quick response!",
      "timestamp": "2026-05-08T03:20:24.942Z"
    },
    "status": "in_progress"
  }
}
```

### PUT /support/tickets/:id/close
Close support ticket.

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Issue resolved"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Ticket closed successfully",
  "data": {
    "ticketId": "ticket_789",
    "status": "closed",
    "closedAt": "2026-05-08T03:20:24.942Z",
    "reason": "Issue resolved"
  }
}
```

### GET /support/categories
Get support ticket categories.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "technical",
      "name": "Technical",
      "description": "Server and technical issues"
    },
    {
      "id": "billing",
      "name": "Billing",
      "description": "Payment and invoice questions"
    },
    {
      "id": "domain",
      "name": "Domain",
      "description": "Domain registration and transfers"
    },
    {
      "id": "account",
      "name": "Account",
      "description": "Account management and settings"
    },
    {
      "id": "general",
      "name": "General",
      "description": "General inquiries"
    }
  ]
}
```

### GET /support/stats
Get support statistics.

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "totalTickets": 234,
    "openTickets": 12,
    "inProgressTickets": 8,
    "resolvedTickets": 214,
    "averageResponseTime": "2 hours",
    "ticketsByCategory": {
      "Technical": 89,
      "Billing": 45,
      "Domain": 23,
      "Account": 34,
      "General": 43
    },
    "ticketsByPriority": {
      "high": 23,
      "medium": 156,
      "low": 55
    }
  }
}
```

## Settings Endpoints

### GET /settings/system
Get system settings (admin only).

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "general": {
      "siteName": "HostingCo",
      "siteUrl": "https://yourdomain.com",
      "supportEmail": "support@yourdomain.com",
      "timezone": "UTC"
    },
    "billing": {
      "currency": "USD",
      "taxRate": 8.0,
      "invoicePrefix": "INV-",
      "autoBilling": true
    },
    "notifications": {
      "emailNotifications": true,
      "smsNotifications": false,
      "pushNotifications": true
    },
    "security": {
      "sessionTimeout": "24h",
      "passwordMinLength": 8,
      "twoFactorAuth": true,
      "ipWhitelist": []
    }
  }
}
```

### PUT /settings/system
Update system settings (admin only).

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "general": {
    "siteName": "HostingCo Platform",
    "supportEmail": "support@hostingco.com"
  },
  "billing": {
    "taxRate": 8.5
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "System settings updated successfully"
}
```

## Analytics Endpoints

### GET /analytics/overview
Get analytics overview.

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `period` (string): Time period (day, week, month, year)
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "month",
    "users": {
      "new": 45,
      "active": 120,
      "churned": 5,
      "growth": 12.5
    },
    "revenue": {
      "total": 12500.00,
      "recurring": 10000.00,
      "oneTime": 2500.00,
      "growth": 8.3
    },
    "servers": {
      "total": 45,
      "active": 42,
      "new": 8,
      "utilization": 78.5
    },
    "support": {
      "tickets": {
        "opened": 25,
        "resolved": 20,
        "averageResolutionTime": "4.2 hours"
      },
      "satisfaction": 4.6
    }
  }
}
```

## Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `AUTHENTICATION_ERROR` | Authentication failed | 401 |
| `AUTHORIZATION_ERROR` | Access denied | 403 |
| `VALIDATION_ERROR` | Input validation failed | 400 |
| `NOT_FOUND` | Resource not found | 404 |
| `CONFLICT` | Resource conflict | 409 |
| `RATE_LIMIT` | Too many requests | 429 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `EXTERNAL_SERVICE_ERROR` | External service error | 502 |
| `INTERNAL_ERROR` | Internal server error | 500 |

## Rate Limiting

- **Standard endpoints**: 100 requests per 15 minutes
- **Authentication endpoints**: 10 requests per 15 minutes
- **Upload endpoints**: 20 requests per hour

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1652006400
```

## Testing the API

### Using curl
```bash
# Health check
curl http://localhost:3003/api/health

# Login
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Get users (with token)
curl -X GET http://localhost:3003/api/users \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Using Postman
1. Import the API collection from `docs/api-collection.json`
2. Set environment variables:
   - `base_url`: `http://localhost:3003/api`
   - `jwt_token`: Your authentication token
3. Use the pre-configured requests

### Using JavaScript
```javascript
// Login
const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await loginResponse.json();
const token = data.token;

// Get dashboard stats
const statsResponse = await fetch('http://localhost:3003/api/dashboard/stats', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const stats = await statsResponse.json();
```

## API Testing & Verification

### Quick Test Commands (Verified)
```bash
# Health Check (No auth required)
curl http://localhost:3003/api/health

# Hosting Plans (No auth required)
curl http://localhost:3003/api/hosting/plans

# Login (Get token)
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostingco.com","password":"admin123"}'

# Dashboard Stats (Auth required)
curl http://localhost:3003/api/dashboard/stats \
  -H "Authorization: Bearer <token>"

# Server Actions (Auth required)
curl -X POST http://localhost:3003/api/hosting/servers/server_id/power \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"action":"restart"}'
```

### Endpoint Status (Current)
- **Health Check**: `/api/health` - Working
- **Auth Login**: `/api/auth/login` - Working (returns mock response)
- **Hosting Plans**: `/api/hosting/plans` - Working
- **Dashboard Stats**: `/api/dashboard/stats` - Working (requires auth)
- **Server Management**: `/api/hosting/servers/*` - Working
- **Billing**: `/api/billing/*` - Working
- **Support**: `/api/support/*` - Working

### Authentication Notes
- Default admin credentials: `admin@hostingco.com` / `admin123`
- JWT tokens expire after 24 hours
- Include token in `Authorization: Bearer <token>` header
- Protected endpoints return 401 without valid token

### Response Format Verification
All endpoints return consistent JSON format:
```json
{
  "success": true|false,
  "data": {...}|null,
  "message": "Description",
  "timestamp": "ISO 8601 timestamp"
}
```

---

*Last updated: 2026-05-08*

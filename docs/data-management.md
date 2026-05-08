# Data Management Guide

This comprehensive guide covers all aspects of data management for the HostingCo system, including seed data, configuration, migrations, and database operations.

## 📁 Data Directory Structure

```
data/
├── README.md                    # Data documentation
├── seed/                        # Database seed data
│   ├── users.json              # Sample user accounts
│   ├── servers.json            # Sample server configurations
│   ├── invoices.json           # Sample invoice data
│   └── support-tickets.json    # Sample support tickets
├── config/                      # Configuration files
│   ├── hosting-plans.json      # Hosting plan definitions
│   └── system-settings.json    # System configuration
├── sample/                      # Sample data for development
│   ├── dashboard-stats.json    # Dashboard statistics
│   └── analytics-data.json     # Analytics and metrics data
├── migrations/                  # Database migrations
│   ├── 001_initial_schema.sql  # Initial database schema
│   └── 002_add_indexes.sql     # Performance indexes
└── backups/                     # Backup storage (auto-created)
    ├── database/                # Database backups
    ├── files/                   # File backups
    └── logs/                    # Log backups
```

## 🌱 Seed Data Management

### Users Data (`seed/users.json`)
Contains sample user accounts with realistic data:

**Default Accounts:**
- **Admin**: `admin@hostingco.com` / `admin123` (full permissions)
- **User**: `john.doe@acme.com` / `password123` (customer account)
- **Support**: `support.agent@hostingco.com` / `support123` (support staff)

**User Structure:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "password": "hashed_password",
  "name": "Full Name",
  "phone": "+1-555-0123",
  "company": "Company Name",
  "role": "admin|user|support",
  "permissions": ["read", "write"],
  "settings": { /* detailed settings */ },
  "isActive": true
}
```

### Servers Data (`seed/servers.json`)
Sample server configurations covering all hosting plans:

**Server Types:**
- **Basic Plan**: Shared hosting (2 CPU, 4GB RAM, 50GB storage)
- **Pro Plan**: VPS hosting (4 CPU, 8GB RAM, 100GB storage)
- **Enterprise Plan**: Dedicated hosting (8 CPU, 16GB RAM, 200GB storage)

**Server Structure:**
```json
{
  "id": "uuid",
  "userId": "user_uuid",
  "name": "server-name",
  "plan": "basic|pro|enterprise",
  "location": "us-east-1",
  "status": "active|inactive|maintenance",
  "ip": "192.168.1.100",
  "specs": {
    "cpu": 4,
    "ram": "8GB",
    "storage": "100GB",
    "bandwidth": "2TB"
  },
  "settings": { /* server settings */ },
  "statistics": { /* usage statistics */ }
}
```

### Invoices Data (`seed/invoices.json`)
Sample billing data with various statuses:

**Invoice Types:**
- **Paid**: Successfully processed payments
- **Pending**: Awaiting payment
- **Overdue**: Past due date

**Invoice Structure:**
```json
{
  "id": "uuid",
  "userId": "user_uuid",
  "number": "INV-2026-001",
  "amount": 29.99,
  "tax": 2.40,
  "total": 32.39,
  "status": "paid|pending|overdue",
  "dueDate": "2026-06-01T00:00:00.000Z",
  "items": [ /* line items */ ],
  "billingAddress": { /* address info */ }
}
```

### Support Tickets Data (`seed/support-tickets.json`)
Customer support data with conversation history:

**Ticket Categories:**
- **Technical**: Server and infrastructure issues
- **Billing**: Payment and invoice questions
- **Domain**: Domain registration and transfers
- **Account**: User account management

**Ticket Structure:**
```json
{
  "id": "uuid",
  "userId": "user_uuid",
  "subject": "Ticket Subject",
  "description": "Issue description",
  "status": "open|in_progress|resolved|closed",
  "priority": "low|medium|high|urgent",
  "category": "technical|billing|domain|account",
  "messages": [ /* conversation history */ ]
}
```

## Configuration Management

### Hosting Plans (`config/hosting-plans.json`)
Complete hosting plan definitions:

**Available Plans:**
- **Basic Plan**: $9.99/month - Shared hosting
- **Pro Plan**: $29.99/month - VPS hosting
- **Enterprise Plan**: $99.99/month - Dedicated hosting

**Plan Features:**
```json
{
  "id": "basic",
  "name": "Basic Plan",
  "type": "shared|vps|dedicated",
  "price": 9.99,
  "specs": {
    "cpu": 2,
    "ram": "4GB",
    "storage": "50GB",
    "bandwidth": "1TB"
  },
  "features": ["Free SSL", "Daily Backups", "Email Support"],
  "addOns": [ /* optional add-ons */ ]
}
```

### System Settings (`config/system-settings.json`)
Comprehensive system configuration:

**Configuration Categories:**
- **General**: Site name, timezone, language
- **Billing**: Currency, tax rates, payment methods
- **Notifications**: Email, SMS, push settings
- **Security**: Authentication, rate limiting, CORS
- **Backup**: Schedule, retention, storage
- **Monitoring**: Metrics, alerts, logging

## Sample Data for Development

### Dashboard Stats (`sample/dashboard-stats.json`)
Real-time dashboard statistics:

**Data Categories:**
- **Overview**: Users, servers, revenue metrics
- **Servers**: Status distribution, utilization
- **Users**: Role distribution, geographic data
- **Billing**: Invoice status, payment methods
- **Support**: Ticket statistics, satisfaction ratings
- **Performance**: API response times, uptime

### Analytics Data (`sample/analytics-data.json`)
Comprehensive analytics data:

**Analytics Categories:**
- **Traffic**: Daily, weekly, monthly visitor data
- **Revenue**: Financial metrics and trends
- **Servers**: Utilization and performance metrics
- **Users**: Acquisition, retention, engagement
- **Support**: Ticket volume and resolution times

## 🗃️ Database Migrations

### Initial Schema (`migrations/001_initial_schema.sql`)
Core database structure with:

**Tables:**
- **users**: User accounts and authentication
- **servers**: Hosting server configurations
- **invoices**: Billing and payment data
- **support_tickets**: Customer support system
- **support_ticket_messages**: Ticket conversations
- **activity_logs**: System activity tracking
- **payment_methods**: User payment options

**Features:**
- UUID primary keys
- Foreign key relationships
- Timestamp triggers
- JSONB fields for flexible data
- Check constraints for data integrity

### Performance Indexes (`migrations/002_add_indexes.sql`)
Database optimization with:

**Index Types:**
- **Composite Indexes**: Multi-column query optimization
- **Full-Text Search**: Text search capabilities
- **JSONB Indexes**: JSON field optimization
- **Partial Indexes**: Filtered query performance
- **Unique Constraints**: Data integrity

## Data Operations

### Loading Seed Data
```bash
# Load all seed data
npm run db:seed

# Load specific seed data
npm run db:seed:users
npm run db:seed:servers
npm run db:seed:invoices
npm run db:seed:support
```

### Running Migrations
```bash
# Run all pending migrations
npm run db:migrate

# Run specific migration
npm run db:migrate:001_initial_schema
npm run db:migrate:002_add_indexes

# Rollback migration
npm run db:rollback
```

### Database Reset
```bash
# Reset database (clear and reseed)
npm run db:reset

# Clear all data
npm run db:clear

# Reseed data only
npm run db:reseed
```

### Configuration Management
```bash
# Load system configuration
npm run config:load

# Validate configuration
npm run config:validate

# Update configuration
npm run config:update

# Export configuration
npm run config:export
```

### Backup Operations
```bash
# Create backup
npm run backup:create

# Restore backup
npm run backup:restore

# List backups
npm run backup:list

# Verify backup integrity
npm run backup:verify
```

## 📝 Data Formats and Standards

### JSON Schema Standards
- **IDs**: UUID format (v4)
- **Dates**: ISO 8601 format
- **Currency**: Decimal with 2 places
- **Booleans**: lowercase true/false
- **Arrays**: Consistent ordering
- **Objects**: camelCase keys

### Naming Conventions
- **Files**: kebab-case (e.g., `hosting-plans.json`)
- **JSON Keys**: camelCase (e.g., `hostingPlans`, `userId`)
- **Database**: snake_case (e.g., `user_id`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PLAN`)

### Data Relationships
```
Users (1) ──── (N) Servers
Users (1) ──── (N) Invoices
Users (1) ──── (N) Support Tickets
Users (1) ──── (N) Payment Methods
Users (1) ──── (N) Activity Logs

Support Tickets (1) ──── (N) Messages
```

## 🔐 Security Considerations

### Password Security
- All passwords hashed with bcrypt
- Default passwords for development only
- Production uses secure password generation
- Password complexity requirements enforced

### Data Protection
- Sensitive configuration uses environment variables
- API keys and secrets not stored in JSON files
- Database connections use SSL in production
- Backup files encrypted in production

### Access Control
- Role-based permissions in seed data
- User roles: admin, user, support
- Permission levels: read, write, delete, admin
- API endpoints protected with JWT authentication

## Production Considerations

### Environment-Specific Data
```bash
# Development
NODE_ENV=development
USE_MOCK_DATA=true
SEED_DATA=true

# Staging
NODE_ENV=staging
USE_MOCK_DATA=false
SEED_DATA=true

# Production
NODE_ENV=production
USE_MOCK_DATA=false
SEED_DATA=false
```

### Data Validation
- Input validation at application level
- JSON schema validation for configuration
- Database constraints for data integrity
- API request/response validation

### Performance Optimization
- Database indexes for common queries
- Connection pooling for database access
- Caching for frequently accessed data
- Pagination for large datasets

### Backup and Recovery
- Automated daily backups
- Point-in-time recovery capability
- Geographic backup distribution
- Regular backup integrity checks

## 📈 Data Analytics

### Dashboard Metrics
- Real-time server statistics
- User engagement metrics
- Revenue and billing analytics
- Support performance indicators
- System health monitoring

### Reporting Features
- Monthly revenue reports
- Customer acquisition analytics
- Server utilization reports
- Support ticket analysis
- System performance metrics

### Data Export
- CSV export for billing data
- JSON export for configuration
- PDF generation for reports
- Database dump for migration

## Data Synchronization

### Real-time Updates
- WebSocket connections for live data
- Event-driven data updates
- Cache invalidation strategies
- Conflict resolution mechanisms

### Data Consistency
- Transactional data operations
- Atomic updates for related data
- Rollback capabilities for failed operations
- Data integrity checks

## Best Practices

### Data Management
- Regular data cleanup and maintenance
- Monitor data growth and storage usage
- Implement data retention policies
- Archive historical data appropriately

### Development Workflow
- Use version control for data changes
- Test data migrations thoroughly
- Document data schema changes
- Validate data integrity regularly

### Monitoring and Alerting
- Monitor database performance
- Alert on data anomalies
- Track data quality metrics
- Monitor backup success rates

---

*Last updated: 2026-05-08*

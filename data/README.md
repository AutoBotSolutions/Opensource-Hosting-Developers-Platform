# HostingCo Data Directory

This directory contains essential data files for the HostingCo system, including seed data, configuration files, sample data, and database migrations.

## 📁 Directory Structure

```
data/
├── README.md                    # This file
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
└── backups/                     # Backup storage (created automatically)
    ├── database/                # Database backups
    ├── files/                   # File backups
    └── logs/                    # Log backups
```

## 🌱 Seed Data

### Users (`seed/users.json`)
Contains sample user accounts for development and testing:
- **Admin Account**: System administrator with full permissions
- **User Account**: Regular customer with hosting services
- **Support Account**: Support staff member with limited permissions

### Servers (`seed/servers.json`)
Sample server configurations including:
- Different hosting plans (Basic, Pro, Enterprise)
- Various server statuses (active, inactive)
- Realistic specifications and statistics
- Location-based deployments

### Invoices (`seed/invoices.json`)
Sample billing data with:
- Different invoice statuses (paid, pending, overdue)
- Various hosting plans and pricing
- Payment method information
- Billing addresses

### Support Tickets (`seed/support-tickets.json`)
Customer support data including:
- Different ticket categories and priorities
- Conversation history
- Assignment information
- Resolution status

## ⚙️ Configuration

### Hosting Plans (`config/hosting-plans.json`)
Complete hosting plan definitions:
- **Basic Plan**: Shared hosting for small projects
- **Pro Plan**: VPS hosting for growing businesses
- **Enterprise Plan**: Dedicated hosting for large applications
- Available locations and add-ons
- Pricing and feature specifications

### System Settings (`config/system-settings.json`)
Comprehensive system configuration:
- General settings (site name, timezone, etc.)
- Billing configuration (tax rates, payment methods)
- Notification preferences
- Security settings
- Backup and monitoring configuration

## 📊 Sample Data

### Dashboard Stats (`sample/dashboard-stats.json`)
Real-time dashboard statistics including:
- User and server metrics
- Revenue and billing information
- Support ticket statistics
- System health indicators
- Recent activity feed

### Analytics Data (`sample/analytics-data.json`)
Comprehensive analytics data:
- Traffic statistics (daily, weekly, monthly)
- Revenue analytics
- Server utilization metrics
- User acquisition and retention
- Support performance metrics

## 🗃️ Database Migrations

### Initial Schema (`migrations/001_initial_schema.sql`)
Core database structure:
- Users and authentication
- Server management
- Billing and invoices
- Support system
- Activity logging

### Performance Indexes (`migrations/002_add_indexes.sql`)
Database optimization:
- Composite indexes for common queries
- Full-text search capabilities
- JSONB indexing for settings
- Partial indexes for filtered queries

## 🔄 Usage

### Development Setup
```bash
# Load seed data into database
npm run db:seed

# Run database migrations
npm run db:migrate

# Reset database (clear and reseed)
npm run db:reset
```

### Configuration Management
```bash
# Load system settings
npm run config:load

# Update configuration
npm run config:update

# Validate configuration
npm run config:validate
```

### Backup Operations
```bash
# Create backup
npm run backup:create

# Restore backup
npm run backup:restore

# List backups
npm run backup:list
```

## 📝 Data Formats

### JSON Schema
All JSON files follow consistent schema:
- Use UUID for IDs
- ISO 8601 date format
- Nested objects for complex data
- Arrays for list data
- Boolean flags for status

### Naming Conventions
- **Files**: kebab-case (e.g., `hosting-plans.json`)
- **JSON Keys**: camelCase (e.g., `hostingPlans`, `userId`)
- **Database**: snake_case (e.g., `user_id`, `created_at`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_PLAN`)

## 🔐 Security Notes

- Passwords are hashed using bcrypt
- Sensitive configuration values use placeholders
- API keys and secrets should be stored in environment variables
- Backup files should be encrypted in production

## 📈 Data Relationships

```
Users (1) ──── (N) Servers
Users (1) ──── (N) Invoices
Users (1) ──── (N) Support Tickets
Users (1) ──── (N) Payment Methods
Users (1) ──── (N) Activity Logs

Support Tickets (1) ──── (N) Messages
```

## 🚀 Production Considerations

- Use environment-specific configuration
- Implement data validation at application level
- Regular backup schedules
- Monitor database performance
- Implement data retention policies

---

*Last updated: 2026-05-08*

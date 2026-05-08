# Database Operations Guide

This guide covers all database operations, schema, and maintenance procedures for the HostingCo system.

## Database Overview

The HostingCo system uses PostgreSQL as the primary database with Redis for caching and session management.

### Database Components
- **PostgreSQL 15+**: Main application database
- **Redis 7+**: Caching and session storage
- **Knex.js**: Database query builder and migration tool

## Database Schema

### Core Tables

#### users
User accounts and authentication data.

```sql
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    permissions JSONB DEFAULT '[]',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### servers
Server hosting information.

```sql
CREATE TABLE servers (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'provisioning',
    ip INET,
    specs JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    statistics JSONB DEFAULT '{}',
    uptime DECIMAL(5,2) DEFAULT 0,
    load DECIMAL(3,2)[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_servers_user_id ON servers(user_id);
CREATE INDEX idx_servers_status ON servers(status);
CREATE INDEX idx_servers_plan ON servers(plan);
CREATE INDEX idx_servers_location ON servers(location);
CREATE INDEX idx_servers_created_at ON servers(created_at);
```

#### invoices
Billing and invoice information.

```sql
CREATE TABLE invoices (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    number VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    due_date TIMESTAMP NOT NULL,
    paid_date TIMESTAMP,
    payment_method JSONB,
    items JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(number);
```

#### support_tickets
Customer support tickets.

```sql
CREATE TABLE support_tickets (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(50),
    assigned_to VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX idx_support_tickets_assigned_to ON support_tickets(assigned_to);
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at);
```

#### ticket_messages
Support ticket messages.

```sql
CREATE TABLE ticket_messages (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL,
    sender VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES support_tickets(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX idx_ticket_messages_timestamp ON ticket_messages(timestamp);
```

#### activity_logs
System activity logging.

```sql
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(100),
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource);
```

#### system_settings
System configuration settings.

```sql
CREATE TABLE system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(50),
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);
```

## Database Operations

### Migration Management

#### Create New Migration
```bash
cd backend
npm run migration:generate -- --name add_new_table
```

#### Run Migrations
```bash
cd backend
npm run migrate
```

#### Rollback Migration
```bash
cd backend
npm run migrate:rollback
```

#### Reset Database
```bash
cd backend
npm run db:reset
```

### Seed Data

#### Run Seeders
```bash
cd backend
npm run seed
```

#### Create New Seeder
```bash
cd backend
npm run seed:generate -- --name initial_data
```

### Database Connection

#### Connection Configuration
```javascript
// backend/src/database/database.ts
const knex = require('knex')({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    directory: './migrations'
  },
  seeds: {
    directory: './seeds'
  }
});
```

#### Connection Testing
```bash
# Test database connection
cd backend
npm run db:test

# Check connection status
npm run db:status
```

## Database Queries

### Common Query Patterns

#### User Operations
```javascript
// Get user by email
const user = await knex('users')
  .where({ email: 'user@example.com' })
  .first();

// Create new user
const userId = await knex('users')
  .insert({
    email: 'newuser@example.com',
    password_hash: hashedPassword,
    name: 'John Doe',
    role: 'user'
  })
  .returning('id');

// Update user
await knex('users')
  .where({ id: userId })
  .update({
    name: 'John Updated',
    updated_at: new Date()
  });
```

#### Server Operations
```javascript
// Get user servers
const servers = await knex('servers')
  .where({ user_id: userId })
  .orderBy('created_at', 'desc');

// Create server
const serverId = await knex('servers')
  .insert({
    user_id: userId,
    name: 'web-server-01',
    plan: 'pro',
    location: 'us-east-1',
    status: 'active',
    specs: {
      cpu: 4,
      ram: '8GB',
      storage: '100GB'
    }
  })
  .returning('id');

// Update server statistics
await knex('servers')
  .where({ id: serverId })
  .update({
    statistics: {
      cpuUsage: 25.5,
      memoryUsage: 60.2,
      diskUsage: 45.8
    },
    updated_at: new Date()
  });
```

#### Billing Operations
```javascript
// Get user invoices
const invoices = await knex('invoices')
  .where({ user_id: userId })
  .orderBy('created_at', 'desc');

// Create invoice
const invoiceId = await knex('invoices')
  .insert({
    user_id: userId,
    number: 'INV-2026-001',
    amount: 99.99,
    tax: 8.00,
    total: 107.99,
    status: 'pending',
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    items: [
      {
        description: 'Pro Plan - Monthly',
        quantity: 1,
        unitPrice: 99.99,
        total: 99.99
      }
    ]
  })
  .returning('id');
```

### Advanced Queries

#### Aggregation Queries
```javascript
// Get dashboard statistics
const stats = await knex('users')
  .select(
    knex.raw('COUNT(*) as total_users'),
    knex.raw('COUNT(CASE WHEN is_active = true THEN 1 END) as active_users'),
    knex.raw('COUNT(CASE WHEN created_at > NOW() - INTERVAL \'30 days\' THEN 1 END) as new_users')
  )
  .first();

// Get revenue statistics
const revenueStats = await knex('invoices')
  .select(
    knex.raw('SUM(total) as total_revenue'),
    knex.raw('SUM(CASE WHEN status = \'paid\' THEN total ELSE 0 END) as paid_revenue'),
    knex.raw('SUM(CASE WHEN status = \'pending\' THEN total ELSE 0 END) as pending_revenue')
  )
  .where('created_at', '>=', knex.raw('NOW() - INTERVAL \'30 days\''))
  .first();
```

#### Join Queries
```javascript
// Get servers with user information
const serversWithUsers = await knex('servers')
  .join('users', 'servers.user_id', 'users.id')
  .select(
    'servers.*',
    'users.name as user_name',
    'users.email as user_email'
  )
  .orderBy('servers.created_at', 'desc');

// Get tickets with user and assignee information
const ticketsWithDetails = await knex('support_tickets')
  .leftJoin('users as creators', 'support_tickets.user_id', 'creators.id')
  .leftJoin('users as assignees', 'support_tickets.assigned_to', 'assignees.id')
  .select(
    'support_tickets.*',
    'creators.name as creator_name',
    'creators.email as creator_email',
    'assignees.name as assignee_name',
    'assignees.email as assignee_email'
  );
```

## Database Maintenance

### Performance Optimization

#### Index Management
```sql
-- Create index for better query performance
CREATE INDEX CONCURRENTLY idx_servers_user_status ON servers(user_id, status);

-- Analyze index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Drop unused index
DROP INDEX CONCURRENTLY idx_unused_index;
```

#### Query Optimization
```sql
-- Analyze slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- View query execution plan
EXPLAIN ANALYZE SELECT * FROM servers WHERE user_id = 'user_123' AND status = 'active';
```

#### Database Statistics
```sql
-- Update table statistics
ANALYZE servers;
ANALYZE users;
ANALYZE invoices;

-- Vacuum and analyze
VACUUM ANALYZE servers;
```

### Backup Procedures

#### Automated Backups
```bash
#!/bin/bash
# backup.sh

DB_NAME="hostingco"
DB_USER="hostingco"
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -h localhost -U $DB_USER -d $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/backup_$DATE.sql

# Remove old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Log backup
echo "Backup completed: backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

#### Restore from Backup
```bash
# Restore from SQL file
psql -h localhost -U hostingco -d hostingco < backup_20260508_030000.sql

# Restore from compressed backup
gunzip -c backup_20260508_030000.sql.gz | psql -h localhost -U hostingco -d hostingco
```

#### Point-in-Time Recovery
```bash
# Enable WAL archiving in postgresql.conf
wal_level = replica
archive_mode = on
archive_command = 'cp %p /backups/wal/%f'

# Restore to specific point
pg_basebackup -h localhost -D /backups/base -U hostingco -v -P -W
```

### Health Monitoring

#### Database Health Checks
```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('hostingco'));

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check connection count
SELECT count(*) FROM pg_stat_activity WHERE datname = 'hostingco';

-- Check long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
ORDER BY duration DESC;
```

#### Performance Metrics
```javascript
// Monitor database performance
const getDatabaseStats = async () => {
  const stats = await knex.raw(`
    SELECT 
      (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections,
      (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
      (SELECT count(*) FROM users WHERE is_active = true) as active_users,
      (SELECT count(*) FROM servers WHERE status = 'active') as active_servers
  `);
  
  return stats[0];
};
```

## 🔒 Database Security

### Security Best Practices

#### User Permissions
```sql
-- Create read-only user
CREATE USER hostingco_readonly WITH PASSWORD 'readonly_password';
GRANT CONNECT ON DATABASE hostingco TO hostingco_readonly;
GRANT USAGE ON SCHEMA public TO hostingco_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hostingco_readonly;

-- Create backup user
CREATE USER hostingco_backup WITH PASSWORD 'backup_password';
GRANT CONNECT ON DATABASE hostingco TO hostingco_backup;
GRANT USAGE ON SCHEMA public TO hostingco_backup;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO hostingco_backup;
```

#### Row-Level Security
```sql
-- Enable RLS on sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY user_isolation ON users
  FOR ALL TO hostingco_app
  USING (id = current_setting('app.current_user_id'));

CREATE POLICY invoice_isolation ON invoices
  FOR ALL TO hostingco_app
  USING (user_id = current_setting('app.current_user_id'));
```

#### Data Encryption
```sql
-- Enable pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
INSERT INTO users (id, email, password_hash, name)
VALUES (
  'user_123',
  'user@example.com',
  crypt('password123', gen_salt('bf')),
  'John Doe'
);

-- Verify password
SELECT (password_hash = crypt('password123', password_hash)) as valid
FROM users WHERE email = 'user@example.com';
```

## 📈 Database Scaling

### Connection Pooling
```javascript
// Configure connection pool
const knex = require('knex')({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: {
    min: 5,
    max: 20,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  }
});
```

### Read Replicas
```javascript
// Configure read replica
const knex = require('knex')({
  client: 'postgresql',
  connection: process.env.DATABASE_URL,
  pool: { min: 2, max: 10 }
});

const knexRead = require('knex')({
  client: 'postgresql',
  connection: process.env.DATABASE_READ_URL,
  pool: { min: 2, max: 10 }
});

// Use read replica for SELECT queries
const getUsers = async () => {
  return await knexRead('users').select('*');
};
```

### Partitioning
```sql
-- Partition large tables by date
CREATE TABLE activity_logs_2026_05 PARTITION OF activity_logs
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

-- Create partitioned table
CREATE TABLE activity_logs (
  id SERIAL,
  user_id VARCHAR(50),
  action VARCHAR(100),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (timestamp);
```

## Database Testing

### Test Database Setup
```bash
# Create test database
createdb hostingco_test

# Run migrations on test database
DATABASE_URL=postgresql://hostingco@localhost:5432/hostingco_test npm run migrate

# Seed test data
DATABASE_URL=postgresql://hostingco@localhost:5432/hostingco_test npm run seed:test
```

### Integration Tests
```javascript
// Test database operations
describe('Database Operations', () => {
  beforeEach(async () => {
    await knex.migrate.rollback();
    await knex.migrate.latest();
    await knex.seed.run();
  });

  it('should create user', async () => {
    const userId = await knex('users')
      .insert({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        name: 'Test User'
      })
      .returning('id');

    expect(userId).toBeDefined();
  });
});
```

## Monitoring and Analytics

### Database Metrics
```javascript
// Collect database metrics
const collectMetrics = async () => {
  const metrics = await knex.raw(`
    SELECT 
      (SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()) as connections,
      (SELECT pg_size_pretty(pg_database_size(current_database()))) as database_size,
      (SELECT sum(xact_commit) FROM pg_stat_database WHERE datname = current_database()) as transactions,
      (SELECT sum(tup_returned) FROM pg_stat_database WHERE datname = current_database()) as tuples_returned,
      (SELECT sum(tup_fetched) FROM pg_stat_database WHERE datname = current_database()) as tuples_fetched
  `);
  
  return metrics[0];
};
```

### Performance Monitoring
```bash
# Monitor database performance with pg_stat_statements
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;

# Monitor index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## Common Issues and Solutions

### Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection limits
SELECT * FROM pg_settings WHERE name = 'max_connections';

# Reset connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'hostingco' AND pid <> pg_backend_pid();
```

### Performance Issues
```sql
-- Identify slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC;

-- Check for missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY n_distinct DESC;
```

### Disk Space Issues
```sql
-- Check table sizes
SELECT schemaname, tablename,
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Clean up old data
DELETE FROM activity_logs WHERE timestamp < NOW() - INTERVAL '90 days';
```

---

*Last updated: $(date)*

-- Additional Indexes for Performance Optimization
-- Created: 2026-01-15
-- Description: Adds additional indexes for improved query performance

-- Composite indexes for common query patterns
CREATE INDEX idx_servers_user_status ON servers(user_id, status);
CREATE INDEX idx_servers_plan_status ON servers(plan, status);
CREATE INDEX idx_invoices_user_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_status_due ON invoices(status, due_date);
CREATE INDEX idx_support_tickets_user_status ON support_tickets(user_id, status);
CREATE INDEX idx_support_tickets_status_priority ON support_tickets(status, priority);

-- Full-text search indexes
CREATE INDEX idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || email || ' ' || COALESCE(company, '')));
CREATE INDEX idx_servers_search ON servers USING gin(to_tsvector('english', name || ' ' || COALESCE(hostname, '')));
CREATE INDEX idx_support_tickets_search ON support_tickets USING gin(to_tsvector('english', subject || ' ' || description));

-- JSONB indexes for settings and statistics
CREATE INDEX idx_users_settings ON users USING gin(settings);
CREATE INDEX idx_servers_settings ON servers USING gin(settings);
CREATE INDEX idx_servers_statistics ON servers USING gin(statistics);
CREATE INDEX idx_activity_logs_details ON activity_logs USING gin(details);

-- Partial indexes for better performance on filtered queries
CREATE INDEX idx_active_users ON users(id) WHERE is_active = true;
CREATE INDEX idx_active_servers ON servers(id) WHERE status = 'active';
CREATE INDEX idx_pending_invoices ON invoices(id) WHERE status = 'pending';
CREATE INDEX idx_open_tickets ON support_tickets(id) WHERE status = 'open';
CREATE INDEX idx_default_payment_methods ON payment_methods(id) WHERE is_default = true;

-- Time-based indexes for analytics queries
CREATE INDEX idx_activity_logs_created_at_desc ON activity_logs(created_at DESC);
CREATE INDEX idx_support_tickets_created_at_desc ON support_tickets(created_at DESC);
CREATE INDEX idx_invoices_created_at_desc ON invoices(created_at DESC);

-- Unique constraints to prevent duplicates
ALTER TABLE payment_methods ADD CONSTRAINT unique_user_default_payment_method UNIQUE (user_id, is_default) DEFERRABLE INITIALLY DEFERRED;
ALTER TABLE servers ADD CONSTRAINT unique_user_server_name UNIQUE (user_id, name) DEFERRABLE INITIALLY DEFERRED;

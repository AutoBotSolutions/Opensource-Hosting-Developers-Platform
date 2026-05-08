# Maintenance Procedures Guide

This comprehensive guide covers all maintenance procedures for the HostingCo system, including routine maintenance, system updates, performance optimization, and preventive care.

## Maintenance Overview

The HostingCo system requires regular maintenance to ensure optimal performance, security, and reliability. This guide provides detailed procedures for all maintenance activities.

### Maintenance Categories
- **Routine Maintenance** - Daily, weekly, and monthly tasks
- **System Updates** - Software patches and version upgrades
- **Performance Optimization** - Database and application tuning
- **Security Maintenance** - Security updates and vulnerability patches
- **Backup Maintenance** - Backup verification and restoration testing
- **Monitoring Maintenance** - Alert system and monitoring tool upkeep

### Automated Maintenance Scripts

The project includes comprehensive automation scripts for all maintenance operations:

```bash
# Health monitoring and checks
./scripts/health-check.sh --detailed --watch

# System cleanup and maintenance
./scripts/clean.sh --deep --cache --logs

# Database maintenance
./scripts/db-migrate.sh production
./scripts/db-reset.sh development --force

# Docker maintenance
./scripts/docker-down.sh --volumes --remove-orphans
./scripts/docker-build.sh production --no-cache

# Complete system maintenance
./scripts/maintenance.sh --all --backup
```

For complete maintenance script documentation, see [Automation Scripts](./automation-scripts.md).

## 📅 Routine Maintenance Schedule

### Daily Maintenance Tasks

#### System Health Checks
```bash
# Use automated health check script (recommended)
./scripts/health-check.sh --detailed

# Or use manual health check:
#!/bin/bash
# daily-health-check.sh

echo "=== Daily Health Check - $(date) ==="

# Check service status
echo "1. Checking service status..."
systemctl is-active postgresql && echo "PostgreSQL: Active" || echo "PostgreSQL: Inactive"
systemctl is-active redis && echo "Redis: Active" || echo "Redis: Inactive"
systemctl is-active nginx && echo "Nginx: Active" || echo "Nginx: Inactive"

# Check application health
echo "2. Checking application health..."
curl -s http://localhost:3003/api/health > /dev/null && echo "Backend API: Healthy" || echo "Backend API: Unhealthy"
curl -s http://localhost:3000 > /dev/null && echo "Frontend: Healthy" || echo "Frontend: Unhealthy"

# Check disk space
echo "3. Checking disk space..."
df -h | grep -E "/(var|home)" | while read line; do
  usage=$(echo $line | awk '{print $5}' | sed 's/%//')
  if [ $usage -gt 80 ]; then
    echo "High disk usage: $line"
  else
    echo "Disk usage OK: $line"
  fi
done

# Check memory usage
echo "4. Checking memory usage..."
memory_usage=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
if (( $(echo "$memory_usage > 80" | bc -l) )); then
  echo "High memory usage: ${memory_usage}%"
else
  echo "Memory usage OK: ${memory_usage}%"
fi

# Check database connections
echo "5. Checking database connections..."
db_connections=$(psql -h localhost -U hostingco -d hostingco -t -c "SELECT count(*) FROM pg_stat_activity;" | tr -d ' ')
if [ $db_connections -gt 80 ]; then
  echo "High database connections: $db_connections"
else
  echo "Database connections OK: $db_connections"
fi

# Check error logs
echo "6. Checking for recent errors..."
error_count=$(tail -1000 /var/log/hostingco/backend/error.log | grep -i error | wc -l)
if [ $error_count -gt 10 ]; then
  echo "High error count: $error_count errors in last 1000 lines"
else
  echo "Error count OK: $error_count errors in last 1000 lines"
fi

echo "=== Daily Health Check Complete ==="
```

#### Log Rotation and Cleanup
```bash
#!/bin/bash
# log-maintenance.sh

echo "=== Log Maintenance - $(date) ==="

# Rotate application logs
echo "1. Rotating application logs..."
logrotate -f /etc/logrotate.d/hostingco

# Clean old logs (keep 30 days)
echo "2. Cleaning old logs..."
find /var/log/hostingco -name "*.log" -mtime +30 -delete
find /var/log/hostingco -name "*.log.*" -mtime +30 -delete

# Clean temporary files
echo "3. Cleaning temporary files..."
find /tmp -name "hostingco_*" -mtime +1 -delete

# Clean uploaded files cache
echo "4. Cleaning upload cache..."
find /var/www/hostingco/uploads/cache -mtime +7 -delete

# Compress large log files
echo "5. Compressing large log files..."
find /var/log/hostingco -name "*.log" -size +100M -exec gzip {} \;

echo "=== Log Maintenance Complete ==="
```

#### Database Maintenance
```bash
#!/bin/bash
# database-maintenance.sh

echo "=== Database Maintenance - $(date) ==="

# Update database statistics
echo "1. Updating database statistics..."
psql -h localhost -U hostingco -d hostingco -c "ANALYZE;"

# Check for long-running queries
echo "2. Checking for long-running queries..."
long_queries=$(psql -h localhost -U hostingco -d hostingco -t -c "
SELECT query, now() - pg_stat_activity.query_start AS duration, pid 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes'
AND state = 'active';
")

if [ ! -z "$long_queries" ]; then
  echo "Long-running queries found:"
  echo "$long_queries"
else
  echo "No long-running queries"
fi

# Check database size
echo "3. Checking database size..."
db_size=$(psql -h localhost -U hostingco -d hostingco -t -c "SELECT pg_size_pretty(pg_database_size('hostingco'));")
echo "Database size: $db_size"

# Check table sizes
echo "4. Checking table sizes..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

echo "=== Database Maintenance Complete ==="
```

### Weekly Maintenance Tasks

#### System Performance Review
```bash
#!/bin/bash
# weekly-performance-review.sh

echo "=== Weekly Performance Review - $(date) ==="

# Generate performance report
echo "1. Generating performance report..."

# CPU usage over the week
echo "CPU Usage (7 days):"
sar -u | grep -E "Average|all" | tail -1

# Memory usage over the week
echo "Memory Usage (7 days):"
sar -r | grep -E "Average|kbmemfree" | tail -1

# Disk I/O over the week
echo "Disk I/O (7 days):"
sar -d | grep -E "Average|dev" | tail -5

# Network statistics
echo "Network Statistics:"
cat /proc/net/dev | grep -E "(eth|en|wl)" | head -3

# Application response times
echo "Application Response Times:"
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/api/health

# Database performance
echo "Database Performance:"
psql -h localhost -U hostingco -d hostingco -c "
SELECT 
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
  (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction') as idle_in_transaction;
"

echo "=== Weekly Performance Review Complete ==="
```

#### Security Updates Check
```bash
#!/bin/bash
# security-updates-check.sh

echo "=== Security Updates Check - $(date) ==="

# Check for system updates
echo "1. Checking for system updates..."
apt list --upgradable 2>/dev/null | grep -i security | wc -l > /tmp/security_updates
security_count=$(cat /tmp/security_updates)
if [ $security_count -gt 0 ]; then
  echo "$security_count security updates available:"
  apt list --upgradable 2>/dev/null | grep -i security
else
  echo "No security updates available"
fi

# Check Node.js vulnerabilities
echo "2. Checking Node.js vulnerabilities..."
cd /home/robbie/Desktop/HostingCo
npm audit --audit-level high 2>/dev/null | grep -c "high\|critical" > /tmp/npm_vulns
npm_vulns=$(cat /tmp/npm_vulns)
if [ $npm_vulns -gt 0 ]; then
  echo "$npm_vulns high/critical vulnerabilities found"
  npm audit --audit-level high
else
  echo "No high/critical vulnerabilities found"
fi

# Check SSL certificate expiry
echo "3. Checking SSL certificate expiry..."
if [ -f /etc/ssl/certs/yourdomain.crt ]; then
  expiry_date=$(openssl x509 -in /etc/ssl/certs/yourdomain.crt -noout -enddate | cut -d= -f2)
  expiry_timestamp=$(date -d "$expiry_date" +%s)
  current_timestamp=$(date +%s)
  days_until_expiry=$(( ($expiry_timestamp - $current_timestamp) / 86400 ))
  
  if [ $days_until_expiry -lt 30 ]; then
    echo "SSL certificate expires in $days_until_expiry days"
  else
    echo "SSL certificate valid for $days_until_expiry days"
  fi
else
  echo "SSL certificate not found"
fi

# Check firewall status
echo "4. Checking firewall status..."
ufw status | grep -E "(Status|active)" || echo "Firewall not configured"

echo "=== Security Updates Check Complete ==="
```

### Monthly Maintenance Tasks

#### Comprehensive System Audit
```bash
#!/bin/bash
# monthly-system-audit.sh

echo "=== Monthly System Audit - $(date) ==="

# System information
echo "1. System Information:"
uname -a
echo "Uptime: $(uptime -p)"
echo "Kernel: $(uname -r)"
echo "Memory: $(free -h | grep Mem)"
echo "Disk: $(df -h /)"

# Service status
echo "2. Service Status:"
systemctl list-units --type=service --state=running | grep -E "(postgresql|redis|nginx|hostingco)"

# Application versions
echo "3. Application Versions:"
node --version
npm --version
psql --version 2>/dev/null || echo "PostgreSQL not in PATH"
redis-cli --version 2>/dev/null || echo "Redis not in PATH"

# Database statistics
echo "4. Database Statistics:"
psql -h localhost -U hostingco -d hostingco -c "
SELECT 
  (SELECT count(*) FROM users) as total_users,
  (SELECT count(*) FROM users WHERE is_active = true) as active_users,
  (SELECT count(*) FROM servers) as total_servers,
  (SELECT count(*) FROM servers WHERE status = 'active') as active_servers,
  (SELECT count(*) FROM support_tickets WHERE created_at > NOW() - INTERVAL '30 days') as tickets_last_30d;
"

# Performance metrics
echo "5. Performance Metrics:"
echo "Load Average: $(uptime | awk -F'load average:' '{print $2}')"
echo "Memory Usage: $(free | grep Mem | awk '{printf("%.1f%%", $3/$2 * 100.0)}')"
echo "Disk Usage: $(df -h / | awk 'NR==2{print $5}')"

# Error summary
echo "6. Error Summary:"
error_count=$(grep -c "ERROR" /var/log/hostingco/backend/error.log 2>/dev/null || echo "0")
echo "Total errors in log: $error_count"

echo "=== Monthly System Audit Complete ==="
```

#### Database Optimization
```bash
#!/bin/bash
# database-optimization.sh

echo "=== Database Optimization - $(date) ==="

# Vacuum and analyze
echo "1. Running VACUUM and ANALYZE..."
psql -h localhost -U hostingco -d hostingco -c "VACUUM ANALYZE;"

# Reindex fragmented tables
echo "2. Checking for fragmented tables..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
       (SELECT count(*) FROM pg_stat_user_indexes WHERE schemaname = pg_tables.schemaname AND tablename = pg_tables.tablename) as index_count
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 5;"

# Update table statistics
echo "3. Updating table statistics..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT 'ANALYZE ' || tablename || ';' FROM pg_tables WHERE schemaname = 'public';
" | psql -h localhost -U hostingco -d hostingco

# Check for unused indexes
echo "4. Checking for unused indexes..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT schemaname, tablename, indexname, 
       pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;"

# Clean up old data
echo "5. Cleaning up old data..."
# Delete old activity logs (keep 90 days)
psql -h localhost -U hostingco -d hostingco -c "DELETE FROM activity_logs WHERE timestamp < NOW() - INTERVAL '90 days';"

# Delete old session data
psql -h localhost -U hostingco -d hostingco -c "DELETE FROM sessions WHERE created_at < NOW() - INTERVAL '7 days';"

echo "=== Database Optimization Complete ==="
```

## System Updates

### Software Update Procedures

#### Application Updates
```bash
#!/bin/bash
# application-update.sh

echo "=== Application Update - $(date) ==="

# Backup current version
echo "1. Creating backup..."
cd /home/robbie/Desktop/HostingCo
tar -czf /backups/hostingco-backup-$(date +%Y%m%d_%H%M%S).tar.gz .

# Check for updates
echo "2. Checking for updates..."
git fetch origin
current_branch=$(git branch --show-current)
upstream_changes=$(git log HEAD..origin/$current_branch --oneline | wc -l)

if [ $upstream_changes -gt 0 ]; then
  echo "Updates available: $upstream_changes changes"
  
  # Stop services
  echo "3. Stopping services..."
  npm run stop:all
  
  # Pull updates
  echo "4. Pulling updates..."
  git pull origin $current_branch
  
  # Install dependencies
  echo "5. Installing dependencies..."
  npm run install:all
  
  # Run database migrations
  echo "6. Running database migrations..."
  cd backend && npm run migrate
  
  # Build applications
  echo "7. Building applications..."
  npm run build
  
  # Start services
  echo "8. Starting services..."
  npm run start:all
  
  # Health check
  echo "9. Performing health check..."
  sleep 10
  curl -s http://localhost:3003/api/health > /dev/null && echo "Update successful" || echo "Update failed"
  
else
  echo "No updates available"
fi

echo "=== Application Update Complete ==="
```

#### System Package Updates
```bash
#!/bin/bash
# system-update.sh

echo "=== System Update - $(date) ==="

# Update package lists
echo "1. Updating package lists..."
apt update

# Check available updates
echo "2. Checking available updates..."
apt list --upgradable

# Install security updates first
echo "3. Installing security updates..."
apt upgrade -y -o Dir::etc::sourceparts="security.list"

# Install other updates
echo "4. Installing other updates..."
apt upgrade -y

# Clean up
echo "5. Cleaning up..."
apt autoremove -y
apt autoclean

echo "=== System Update Complete ==="
```

### Node.js and Dependencies Updates

#### Node.js Version Management
```bash
#!/bin/bash
# nodejs-update.sh

echo "=== Node.js Update - $(date) ==="

# Check current Node.js version
current_version=$(node --version)
echo "Current Node.js version: $current_version"

# Check latest LTS version
latest_lts=$(nvm version-remote --lts | tail -1)
echo "Latest LTS version: $latest_lts"

if [ "$current_version" != "$latest_lts" ]; then
  echo "Node.js update available"
  
  # Stop services
  echo "Stopping services..."
  npm run stop:all
  
  # Install latest LTS
  echo "Installing latest LTS..."
  nvm install $latest_lts
  nvm use $latest_lts
  nvm alias default $latest_lts
  
  # Rebuild native modules
  echo "Rebuilding native modules..."
  npm rebuild
  
  # Restart services
  echo "Restarting services..."
  npm run start:all
  
  echo "Node.js updated to $latest_lts"
else
  echo "Node.js is up to date"
fi

echo "=== Node.js Update Complete ==="
```

#### Dependency Updates
```bash
#!/bin/bash
# dependency-update.sh

echo "=== Dependency Update - $(date) ==="

# Check for outdated packages
echo "1. Checking for outdated packages..."
cd /home/robbie/Desktop/HostingCo
npm outdated

# Update patch versions
echo "2. Updating patch versions..."
npm update

# Check for security vulnerabilities
echo "3. Checking for vulnerabilities..."
npm audit

# Fix vulnerabilities if found
vulns=$(npm audit --json | jq -r '.vulnerabilities | length' 2>/dev/null || echo "0")
if [ "$vulns" -gt 0 ]; then
  echo "4. Fixing vulnerabilities..."
  npm audit fix
fi

# Test application after updates
echo "5. Testing application..."
npm test

echo "=== Dependency Update Complete ==="
```

## Performance Optimization

### Database Performance Tuning

#### PostgreSQL Optimization
```bash
#!/bin/bash
# postgresql-optimization.sh

echo "=== PostgreSQL Optimization - $(date) ==="

# Check current configuration
echo "1. Current PostgreSQL configuration:"
psql -h localhost -U hostingco -d hostingco -c "SHOW shared_buffers;"
psql -h localhost -U hostingco -d hostingco -c "SHOW effective_cache_size;"
psql -h localhost -U hostingco -d hostingco -c "SHOW work_mem;"

# Analyze slow queries
echo "2. Analyzing slow queries..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
WHERE mean_time > 1000
ORDER BY mean_time DESC
LIMIT 10;"

# Check index usage
echo "3. Checking index usage..."
psql -h localhost -U hostingco -d hostingco -c "
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;"

# Optimize configuration based on system resources
echo "4. Optimizing configuration..."
total_memory=$(free -m | awk '/^Mem:/{print $2}')
shared_buffers=$((total_memory / 4))  # 25% of RAM
effective_cache_size=$((total_memory * 3 / 4))  # 75% of RAM

echo "Recommended settings:"
echo "shared_buffers = ${shared_buffers}MB"
echo "effective_cache_size = ${effective_cache_size}MB"
echo "work_mem = 4MB"
echo "maintenance_work_mem = 64MB"

echo "=== PostgreSQL Optimization Complete ==="
```

#### Application Performance Optimization
```bash
#!/bin/bash
# application-optimization.sh

echo "=== Application Performance Optimization - $(date) ==="

# Check Node.js memory usage
echo "1. Node.js memory usage:"
ps aux | grep node | awk '{print $4, $11}' | while read mem cmd; do
  echo "Memory: $mem, Command: $cmd"
done

# Check response times
echo "2. Checking API response times..."
for endpoint in "/api/health" "/api/users" "/api/servers"; do
  echo "Testing $endpoint..."
  curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3003$endpoint"
done

# Check database query performance
echo "3. Database query performance:"
psql -h localhost -U hostingco -d hostingco -c "
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 5;"

# Check for memory leaks
echo "4. Checking for memory leaks..."
node --inspect --heap-prof backend/dist/index.js &
NODE_PID=$!
sleep 30
kill -USR2 $NODE_PID
wait $NODE_PID

echo "=== Application Performance Optimization Complete ==="
```

### Cache Optimization

#### Redis Cache Management
```bash
#!/bin/bash
# redis-optimization.sh

echo "=== Redis Cache Optimization - $(date) ==="

# Check Redis memory usage
echo "1. Redis memory usage:"
redis-cli info memory | grep -E "(used_memory|maxmemory)"

# Check cache hit rate
echo "2. Cache hit rate:"
redis-cli info stats | grep -E "(keyspace_hits|keyspace_misses)"

# Check number of keys
echo "3. Number of keys by database:"
for db in {0..15}; do
  count=$(redis-cli -n $db dbsize 2>/dev/null)
  if [ "$count" != "0" ]; then
    echo "DB$db: $count keys"
  fi
done

# Clean up expired keys
echo "4. Cleaning up expired keys..."
redis-cli --scan --pattern "*:expired:*" | xargs redis-cli del

# Optimize Redis configuration
echo "5. Redis configuration:"
redis-cli config get maxmemory
redis-cli config get maxmemory-policy
redis-cli config get timeout

echo "=== Redis Cache Optimization Complete ==="
```

## 🔒 Security Maintenance

### Security Patch Management

#### Vulnerability Scanning
```bash
#!/bin/bash
# vulnerability-scan.sh

echo "=== Vulnerability Scan - $(date) ==="

# System vulnerability scan
echo "1. System vulnerability scan:"
if command -v lynis >/dev/null 2>&1; then
  lynis audit system --quick
else
  echo "Lynis not installed, skipping system scan"
fi

# Node.js vulnerability scan
echo "2. Node.js vulnerability scan:"
cd /home/robbie/Desktop/HostingCo
npm audit --audit-level high

# Web application security scan
echo "3. Web application security scan:"
if command -v nikto >/dev/null 2>&1; then
  nikto -h http://localhost:3000 -output /tmp/nikto_report.html
else
  echo "Nikto not installed, skipping web scan"
fi

# SSL/TLS security check
echo "4. SSL/TLS security check:"
if command -v testssl.sh >/dev/null 2>&1; then
  testssl.sh --quiet https://localhost:3000
else
  echo "testssl.sh not installed, skipping SSL check"
fi

echo "=== Vulnerability Scan Complete ==="
```

#### Security Configuration Review
```bash
#!/bin/bash
# security-config-review.sh

echo "=== Security Configuration Review - $(date) ==="

# Check file permissions
echo "1. Checking file permissions:"
find /home/robbie/Desktop/HostingCo -type f -perm /o+w -ls
find /home/robbie/Desktop/HostingCo -type f -perm /g+w -ls

# Check user permissions
echo "2. Checking user permissions:"
find /home/robbie/Desktop/HostingCo -type f -user $(whoami) -ls

# Check for world-writable files
echo "3. Checking for world-writable files:"
find /home/robbie/Desktop/HostingCo -type f -perm /o+w -exec ls -la {} \;

# Check SSH configuration
echo "4. SSH configuration:"
if [ -f /etc/ssh/sshd_config ]; then
  grep -E "(PermitRootLogin|PasswordAuthentication|PubkeyAuthentication)" /etc/ssh/sshd_config
else
  echo "SSH config not found"
fi

# Check firewall rules
echo "5. Firewall rules:"
ufw status verbose

echo "=== Security Configuration Review Complete ==="
```

## Monitoring and Alerting

### Monitoring System Maintenance

#### Health Check Automation
```javascript
// health-check-automation.js
const cron = require('node-cron');

class HealthCheckAutomation {
  constructor() {
    this.setupCronJobs();
  }
  
  setupCronJobs() {
    // Every 5 minutes - critical services
    cron.schedule('*/5 * * * *', async () => {
      await this.checkCriticalServices();
    });
    
    // Every hour - detailed checks
    cron.schedule('0 * * * *', async () => {
      await this.performDetailedChecks();
    });
    
    // Daily - comprehensive check
    cron.schedule('0 2 * * *', async () => {
      await this.performComprehensiveCheck();
    });
  }
  
  async checkCriticalServices() {
    const checks = [
      { name: 'Backend API', url: 'http://localhost:3003/api/health' },
      { name: 'Frontend', url: 'http://localhost:3000' },
      { name: 'Database', check: this.checkDatabase },
      { name: 'Redis', check: this.checkRedis }
    ];
    
    for (const check of checks) {
      try {
        if (check.url) {
          const response = await fetch(check.url);
          if (!response.ok) {
            await this.sendAlert(`${check.name} is down`, 'critical');
          }
        } else if (check.check) {
          const result = await check.check();
          if (!result) {
            await this.sendAlert(`${check.name} is down`, 'critical');
          }
        }
      } catch (error) {
        await this.sendAlert(`${check.name} check failed: ${error.message}`, 'critical');
      }
    }
  }
  
  async checkDatabase() {
    try {
      await knex.raw('SELECT 1');
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async checkRedis() {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
  
  async sendAlert(message, severity) {
    // Send to monitoring system
    console.error(`[${severity.toUpperCase()}] ${message}`);
    
    // Send webhook notification
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          severity,
          timestamp: new Date().toISOString(),
          service: 'hostingco-backend'
        })
      });
    }
  }
}

module.exports = HealthCheckAutomation;
```

### Performance Monitoring

#### Metrics Collection
```javascript
// metrics-collection.js
class MetricsCollector {
  constructor() {
    this.setupMetricsCollection();
  }
  
  setupMetricsCollection() {
    // Collect system metrics every minute
    setInterval(async () => {
      await this.collectSystemMetrics();
    }, 60000);
    
    // Collect application metrics every 5 minutes
    setInterval(async () => {
      await this.collectApplicationMetrics();
    }, 300000);
  }
  
  async collectSystemMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      cpu: await this.getCPUUsage(),
      memory: await this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      network: await this.getNetworkUsage()
    };
    
    // Store metrics
    await this.storeMetrics('system', metrics);
    
    // Check thresholds
    await this.checkThresholds(metrics);
  }
  
  async collectApplicationMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      response_time: await this.getAverageResponseTime(),
      error_rate: await this.getErrorRate(),
      active_connections: await this.getActiveConnections(),
      database_connections: await this.getDatabaseConnections()
    };
    
    // Store metrics
    await this.storeMetrics('application', metrics);
  }
  
  async checkThresholds(metrics) {
    const thresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      response_time: 2000,
      error_rate: 5
    };
    
    for (const [metric, value] of Object.entries(metrics)) {
      if (metric !== 'timestamp' && value > thresholds[metric]) {
        await this.sendAlert(`${metric} threshold exceeded: ${value}%`, 'warning');
      }
    }
  }
}
```

## Maintenance Procedures Checklist

### Daily Checklist
- [ ] Run health check script
- [ ] Monitor system resource usage
- [ ] Check error logs for critical issues
- [ ] Verify backup completion
- [ ] Monitor application response times
- [ ] Check database connection counts
- [ ] Review security alerts

### Weekly Checklist
- [ ] Run performance review script
- [ ] Check for system updates
- [ ] Review application logs for patterns
- [ ] Monitor disk space trends
- [ ] Check database performance
- [ ] Review user activity metrics
- [ ] Test backup restoration

### Monthly Checklist
- [ ] Run comprehensive system audit
- [ ] Perform database optimization
- [ ] Update application dependencies
- [ ] Review and update documentation
- [ ] Perform security vulnerability scan
- [ ] Test disaster recovery procedures
- [ ] Review monitoring thresholds
- [ ] Update maintenance schedules

### Quarterly Checklist
- [ ] Comprehensive security audit
- [ ] Performance baseline review
- [ ] Capacity planning assessment
- [ ] Disaster recovery testing
- [ ] System architecture review
- [ ] Update maintenance procedures
- [ ] Review and update monitoring tools
- [ ] Conduct team training review

## Emergency Maintenance

### Emergency Procedures

#### System Outage Response
```bash
#!/bin/bash
# emergency-response.sh

echo "=== Emergency Response - $(date) ==="

# 1. Assess the situation
echo "1. Assessing situation..."
system_status=$(systemctl is-active hostingco-backend)
if [ "$system_status" != "active" ]; then
  echo "Backend service is down"
  
  # 2. Check logs for errors
  echo "2. Checking logs..."
  tail -50 /var/log/hostingco/backend/error.log
  
  # 3. Attempt restart
  echo "3. Attempting restart..."
  systemctl restart hostingco-backend
  
  # 4. Wait and check status
  sleep 10
  system_status=$(systemctl is-active hostingco-backend)
  if [ "$system_status" = "active" ]; then
    echo "Service restarted successfully"
  else
    echo "Service restart failed, escalating..."
    # Send emergency notification
    curl -X POST https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK \
      -H 'Content-type: application/json' \
      --data '{"text":"EMERGENCY: HostingCo backend service down and restart failed"}'
  fi
fi

echo "=== Emergency Response Complete ==="
```

#### Database Emergency Procedures
```bash
#!/bin/bash
# database-emergency.sh

echo "=== Database Emergency Response - $(date) ==="

# Check database status
echo "1. Checking database status..."
if ! pg_isready -h localhost -p 5432 -U hostingco; then
  echo "Database is not responding"
  
  # Check PostgreSQL service
  echo "2. Checking PostgreSQL service..."
  pg_status=$(systemctl is-active postgresql)
  if [ "$pg_status" != "active" ]; then
    echo "Starting PostgreSQL service..."
    systemctl start postgresql
    sleep 5
  fi
  
  # Check for corruption
  echo "3. Checking for database corruption..."
  pg_controldata -D /var/lib/postgresql/15/main
  
  # Attempt recovery if needed
  echo "4. Attempting recovery..."
  pg_ctl -D /var/lib/postgresql/15/main start
  
else
  echo "Database is responding"
fi

echo "=== Database Emergency Response Complete ==="
```

## 📞 Maintenance Support

### When to Contact Support

#### Critical Issues
- System completely down
- Data corruption suspected
- Security breach detected
- Backup failures
- Performance degradation > 50%

#### Support Contact Information
- **Emergency Hotline**: +1-555-EMERGENCY
- **Technical Support**: support@hostingco.com
- **Documentation**: [Troubleshooting Guide](./troubleshooting.md)

### Maintenance Documentation Updates

#### Procedure Updates
- Update procedures when system architecture changes
- Revise checklists based on incident lessons learned
- Document new tools and automation scripts
- Update contact information and escalation procedures

---

*Last updated: $(date)*

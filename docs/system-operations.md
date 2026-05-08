# System Operations Guide

This comprehensive guide covers all system operations for the HostingCo management system, including startup, shutdown, monitoring, maintenance, and troubleshooting procedures.

## System Startup

### Development Environment

#### Quick Start (Verified)
```bash
# 1. Navigate to project root
cd /home/robbie/Desktop/HostingCo

# 2. Install all dependencies (if not already done)
npm run install:all

# 3. Start both frontend and backend servers
npm run dev

# 4. Verify services are running
curl http://localhost:3003/api/health
curl http://localhost:3000
```

#### Individual Service Startup
```bash
# Backend only (port 3003)
npm run dev:backend

# Frontend only (port 3000)
npm run dev:frontend

# Both services concurrently
npm run dev
```

#### Service Status Verification
```bash
# Check if services are running
curl -s http://localhost:3000 > /dev/null && echo "Frontend: RUNNING" || echo "Frontend: STOPPED"
curl -s http://localhost:3003/api/health > /dev/null && echo "Backend: RUNNING" || echo "Backend: STOPPED"

# Check process status
ps aux | grep -E "(node|vite)" | grep -v grep

# Check port usage
netstat -tlnp | grep -E "(3000|3003)"
```

### Production Environment

#### Production Startup
```bash
# 1. Build for production
npm run build

# 2. Start production server
npm start

# 3. Verify production health
curl http://localhost:3003/api/health
```

#### Docker Production
```bash
# Build and start production containers
docker-compose -f docker-compose.prod.yml up -d --build

# Check container status
docker-compose ps

# View logs
docker-compose logs -f
```

## 🛑 System Shutdown

### Graceful Shutdown
```bash
# Stop development servers (Ctrl+C in terminals)
# Or if running in background:
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "node dist/index.js"

# Stop Docker services
docker-compose down

# Verify services stopped
curl -s http://localhost:3003/api/health 2>/dev/null || echo "Backend: STOPPED"
curl -s http://localhost:3000 2>/dev/null || echo "Frontend: STOPPED"
```

### Force Shutdown (Emergency)
```bash
# Kill all Node.js processes (use with caution)
pkill -f node

# Kill specific ports
fuser -k 3000/tcp
fuser -k 3003/tcp

# Docker force stop
docker-compose down --force
docker-compose rm --force
```

## System Monitoring

### Health Checks

#### API Health Endpoint
```bash
# Basic health check
curl http://localhost:3003/api/health

# Detailed health check with response time
time curl -s http://localhost:3003/api/health | jq .

# Continuous monitoring
watch -n 5 'curl -s http://localhost:3003/api/health | jq .data.uptime'
```

#### Service Monitoring
```bash
# Monitor system resources
htop

# Monitor disk usage
df -h

# Monitor memory usage
free -h

# Monitor network connections
netstat -tlnp | grep -E "(3000|3003)"
```

### Log Monitoring

#### Backend Logs
```bash
# View real-time logs
tail -f backend/logs/combined.log

# View error logs
tail -f backend/logs/error.log

# Search logs for errors
grep -i error backend/logs/combined.log

# View recent logs
tail -n 100 backend/logs/combined.log
```

#### Frontend Logs
```bash
# Frontend logs appear in the terminal where npm run dev:frontend is running
# For production builds, check browser console

# Monitor build process
npm run dev:frontend 2>&1 | tee frontend-build.log
```

### Performance Monitoring

#### API Performance
```bash
# Test API response time
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/api/health

# Create curl-format.txt:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n

# Load testing
ab -n 100 -c 10 http://localhost:3003/api/health
```

## Maintenance Operations

### Database Maintenance

#### Database Health
```bash
# Check database connection (if using PostgreSQL)
psql -h localhost -U hostingco -d hostingco -c "SELECT 1;"

# Check database size
psql -h localhost -U hostingco -d hostingco -c "SELECT pg_size_pretty(pg_database_size('hostingco'));"

# Check table sizes
psql -h localhost -U hostingco -d hostingco -c "SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) FROM pg_tables WHERE schemaname NOT IN ('information_schema','pg_catalog') ORDER BY pg_total_relation_size DESC;"
```

#### Database Backup
```bash
# Create database backup
pg_dump -h localhost -U hostingco hostingco > backup_$(date +%Y%m%d_%H%M%S).sql

# Compress backup
gzip backup_*.sql

# Verify backup
gunzip -t backup_*.sql.gz
```

### File System Maintenance

#### Log Rotation
```bash
# Compress old logs
find backend/logs -name "*.log" -mtime +7 -exec gzip {} \;

# Remove old compressed logs
find backend/logs -name "*.log.gz" -mtime +30 -delete

# Check log sizes
du -sh backend/logs/
```

#### Cache Cleanup
```bash
# Clear npm cache
npm cache clean --force

# Clear Node.js modules (if needed)
rm -rf node_modules
rm -rf backend/node_modules
rm -rf frontend/node_modules
rm -rf shared/node_modules
npm run install:all
```

### System Updates

#### Package Updates
```bash
# Check for outdated packages
npm outdated

# Update packages
npm update

# Update specific packages
npm install package@latest

# Audit security vulnerabilities
npm audit
npm audit fix
```

#### System Updates
```bash
# Update Node.js (using nvm)
nvm install --lts
nvm use --lts

# Update npm
npm install -g npm@latest

# Update global packages
npm update -g
```

## Data Operations

### Seed Data Management

#### Load Seed Data
```bash
# The system automatically loads seed data from /data directory
# To manually trigger data loading:

# Check current data
curl http://localhost:3003/api/dashboard/stats

# Verify data integrity
curl http://localhost:3003/api/hosting/plans | jq '.data | length'
```

#### Reset Data
```bash
# Clear and reload all data
npm run db:reset

# Clear specific data types
npm run db:clear:users
npm run db:clear:servers
npm run db:clear:invoices
```

### Configuration Management

#### Load Configuration
```bash
# Configuration is loaded from /data/config/system-settings.json
# Verify current configuration
curl http://localhost:3003/api/settings/system

# Update configuration (admin only)
curl -X PUT http://localhost:3003/api/settings/system \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"general": {"siteName": "Updated HostingCo"}}'
```

## Error Handling

### Common Errors and Solutions

#### Port Already in Use
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3003

# Kill the process
kill -9 <PID>

# Or use different ports
PORT=3004 npm run dev:backend
```

#### Module Not Found
```bash
# Reinstall dependencies
npm run install:all

# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Build shared packages first
cd shared && npm run build && cd ..
```

#### Database Connection Errors
```bash
# Check database status
sudo systemctl status postgresql

# Start database
sudo systemctl start postgresql

# Check connection
psql -h localhost -U postgres -c "SELECT 1;"
```

#### Permission Errors
```bash
# Fix file permissions
chmod +x scripts/*.sh

# Fix directory permissions
chmod -R 755 .

# Fix ownership (if needed)
sudo chown -R $USER:$USER .
```

### Debug Mode

#### Enable Debug Logging
```bash
# Set debug environment variable
export DEBUG=hostingco:*
export NODE_ENV=development

# Run with debug
npm run dev:backend

# Or add to .env file
echo "DEBUG=hostingco:*" >> .env
echo "NODE_ENV=development" >> .env
```

#### Verbose Output
```bash
# Run with verbose logging
npm run dev:backend --verbose

# Enable detailed error logging
export LOG_LEVEL=debug
npm run dev:backend
```

## 📈 Performance Optimization

### Development Performance

#### Hot Reload Optimization
```bash
# Ensure hot reload is working
# Frontend: Vite automatically handles hot reload
# Backend: Nodemon restarts on file changes

# Check Nodemon configuration
cat backend/nodemon.json

# Adjust Nodemon for better performance
echo '{"watch": ["src"], "ext": "ts", "ignore": ["src/**/*.spec.ts"], "exec": "ts-node src/index.ts"}' > backend/nodemon.json
```

#### Build Optimization
```bash
# Build for development (faster)
npm run build:dev

# Build with source maps for debugging
npm run build:dev:sourcemaps

# Clean build cache
npm run clean
npm run build
```

### Production Performance

#### Memory Optimization
```bash
# Monitor memory usage
node --inspect dist/index.js

# Increase memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Enable cluster mode
NODE_ENV=production npm start
```

#### CPU Optimization
```bash
# Enable cluster mode for multiple CPU cores
PM2_HOSTINGCO_ENV=production pm2 start backend/dist/index.js -i max

# Monitor CPU usage
top -p $(pgrep -f "node dist/index.js")
```

## 🔐 Security Operations

### Security Monitoring

#### Check for Vulnerabilities
```bash
# Audit npm packages
npm audit

# Fix vulnerabilities
npm audit fix

# Check for outdated packages with security issues
npm audit --audit-level moderate
```

#### Access Control
```bash
# Review user permissions
curl http://localhost:3003/api/users \
  -H "Authorization: Bearer <admin-token>"

# Check active sessions
curl http://localhost:3003/api/auth/sessions \
  -H "Authorization: Bearer <admin-token>"
```

### Security Maintenance

#### Update Security Packages
```bash
# Update security-related packages
npm update bcrypt
npm update helmet
npm update cors
npm update express-rate-limit
```

#### SSL Certificate Management
```bash
# Check SSL certificate (if using HTTPS)
openssl s_client -connect localhost:443

# Generate self-signed certificate (development)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/private.key -out ssl/certificate.crt
```

## System Checklist

### Daily Checklist
- [ ] Check service health: `curl http://localhost:3003/api/health`
- [ ] Review error logs: `tail -f backend/logs/error.log`
- [ ] Monitor disk usage: `df -h`
- [ ] Check backup status: `ls -la backups/`
- [ ] Review system performance: `htop`

### Weekly Checklist
- [ ] Update packages: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Database maintenance: `VACUUM ANALYZE`
- [ ] Log rotation: `find logs -name "*.log" -mtime +7 -exec gzip {} \;`
- [ ] Performance review: Check response times and resource usage

### Monthly Checklist
- [ ] Full system backup: `pg_dump` + file backup
- [ ] Dependency review: Check for major version updates
- [ ] Security review: Check access logs and user permissions
- [ ] Performance optimization: Review slow queries and bottlenecks
- [ ] Documentation update: Update system documentation

## Emergency Procedures

### System Down
```bash
# 1. Check service status
systemctl status nginx postgresql redis-server

# 2. Restart services
sudo systemctl restart postgresql
sudo systemctl restart redis-server
sudo systemctl restart nginx

# 3. Check logs
sudo journalctl -u postgresql -f
sudo journalctl -u redis-server -f
sudo journalctl -u nginx -f

# 4. Restore from backup if needed
psql -h localhost -U hostingco hostingco < backup_latest.sql
```

### Data Corruption
```bash
# 1. Stop all services
npm stop || pkill -f node

# 2. Backup current data
cp -r data data_backup_$(date +%Y%m%d_%H%M%S)

# 3. Restore from last known good backup
psql -h localhost -U hostingco hostingco < backup_good.sql

# 4. Verify data integrity
curl http://localhost:3003/api/dashboard/stats
```

### Security Breach
```bash
# 1. Change all passwords
# Update admin passwords in database
# Rotate API keys and secrets

# 2. Review access logs
grep -i "failed\|error\|unauthorized" backend/logs/combined.log

# 3. Block suspicious IPs
# Add to firewall rules

# 4. Enable additional logging
export LOG_LEVEL=debug
npm run dev:backend
```

---

*Last updated: 2026-05-08*

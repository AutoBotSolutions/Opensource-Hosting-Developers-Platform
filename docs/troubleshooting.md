# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues and their solutions for the HostingCo system.

## Quick Troubleshooting Checklist

### System Health Check (Verified)
```bash
# Check all services (verified working commands)
curl -s http://localhost:3003/api/health > /dev/null && echo "Backend: OK" || echo "Backend: DOWN"
curl -s http://localhost:3000 > /dev/null && echo "Frontend: OK" || echo "Frontend: DOWN"

# Check processes (actual output shows services running)
ps aux | grep -E "(node|vite)" | grep -v grep

# Check port usage (verified ports 3000 and 3003)
netstat -tlnp | grep -E ":300[03]"
```

### Check Logs (Verified Paths)
```bash
# Backend logs (actual file locations)
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Frontend logs (in development terminal)
# Check the terminal where npm run dev:frontend is running
# Vite outputs logs directly to terminal

# Process monitoring (verified commands)
ps aux | grep -E "(node|vite)" | grep -v grep
lsof -i :3000  # Frontend
lsof -i :3003  # Backend
```

### Port Conflicts
```bash
# Check what's using ports
ss -tlnp | grep -E ":300[03]|:5432|:6379|:80|:443"

# Kill processes if needed
sudo kill -9 <PID>

# Alternative: change ports in .env files
```

## � Verified Issues & Solutions

### Issue: Services Already Running
**Symptom**: When trying to start services, they appear to be already running.

**Verified Commands**:
```bash
# Check current status (verified working)
curl http://localhost:3003/api/health
curl http://localhost:3000

# Check processes (actual output shows)
ps aux | grep -E "(node|vite)" | grep -v grep

# Solution: Services are working, no action needed
# If restart is required:
pkill -f "npm run dev"
pkill -f "vite"
pkill -f "node dist/index.js"
```

### Issue: API Authentication Required
**Symptom**: Getting 401 errors for protected endpoints.

**Verified Solution**:
```bash
# Get authentication token
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hostingco.com","password":"admin123"}'

# Use token in subsequent requests
curl http://localhost:3003/api/dashboard/stats \
  -H "Authorization: Bearer <token>"
```

### Issue: Missing Dependencies
**Symptom**: Module not found errors.

**Verified Solution**:
```bash
# Install all dependencies (verified working)
npm run install:all

# Build shared packages first
cd shared && npm run build && cd ..

# Verify installation
ls node_modules
ls backend/node_modules
ls frontend/node_modules
```

## Backend Issues

### Backend Won't Start

#### Issue: Port Already in Use
```bash
# Error: EADDRINUSE: address already in use :::3003

# Solution 1: Kill existing process
sudo fuser -k 3003/tcp

# Solution 2: Change port
export PORT=3004
npm run dev:backend

# Solution 3: Find and kill process
lsof -ti:3003 | xargs kill -9
```

#### Issue: Database Connection Failed
```bash
# Error: connect ECONNREFUSED 127.0.0.1:5432

# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection string
echo $DATABASE_URL

# Test connection manually
psql -h localhost -U hostingco -d hostingco

# Reset database
cd backend
npm run db:reset
```

#### Issue: TypeScript Compilation Errors
```bash
# Error: TSError: ⨯ Unable to compile TypeScript

# Clear TypeScript cache
rm -rf backend/node_modules/.cache
npm run dev:backend

# Check TypeScript version
npx tsc --version

# Update TypeScript
npm install typescript@latest

# Check for syntax errors
npx tsc --noEmit
```

#### Issue: Module Not Found
```bash
# Error: Cannot find module 'express'

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Check package.json
cat package.json | grep -A 10 "dependencies"

# Install missing module
npm install express
```

### Backend Performance Issues

#### Issue: Slow API Response
```bash
# Check database queries
cd backend
npm run db:slow-queries

# Monitor CPU usage
top -p $(pgrep -f "node.*backend")

# Check memory usage
ps aux | grep node | grep backend

# Restart backend
npm run restart:backend
```

#### Issue: High Memory Usage
```bash
# Check memory usage
node --inspect backend/dist/index.js

# Monitor with PM2
pm2 monit

# Restart to clear memory
pm2 restart backend

# Check for memory leaks
npm run test:memory
```

### Backend API Errors

#### Issue: 500 Internal Server Error
```bash
# Check error logs
tail -f backend/logs/error.log

# Check database connection
npm run db:test

# Validate environment variables
printenv | grep -E "(DATABASE|REDIS|JWT)"

# Test with curl
curl -v http://localhost:3003/api/health
```

#### Issue: Authentication Failed
```bash
# Check JWT secret
echo $JWT_SECRET

# Verify token format
node -e "console.log(require('jsonwebtoken').verify('your-token', 'your-secret'))"

# Reset user password
cd backend
npm run user:reset-password -- --email user@example.com --password newpassword

# Check user status
npm run user:status -- --email user@example.com
```

## Frontend Issues

### Frontend Won't Start

#### Issue: Port Already in Use
```bash
# Error: Port 3000 is already in use

# Kill existing process
sudo fuser -k 3000/tcp

# Change port in vite.config.ts
# server.port = 3001

# Or use environment variable
export PORT=3001
npm run dev:frontend
```

#### Issue: Cannot Connect to Backend
```bash
# Error: Network Error

# Check backend status
curl http://localhost:3003/api/health

# Check API URL in frontend/.env
cat frontend/.env | grep VITE_API_URL

# Update API URL
echo "VITE_API_URL=http://localhost:3003/api" >> frontend/.env

# Restart frontend
npm run dev:frontend
```

#### Issue: Module Resolution Errors
```bash
# Error: Cannot resolve module

# Clear Vite cache
rm -rf frontend/node_modules/.vite
npm run dev:frontend

# Check imports
grep -r "import.*from" frontend/src/

# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Frontend Build Issues

#### Issue: Build Fails
```bash
# Error: Build failed

# Check TypeScript errors
cd frontend
npx tsc --noEmit

# Fix ESLint errors
npm run lint:fix

# Clean build
rm -rf dist
npm run build
```

#### Issue: Production Build Errors
```bash
# Check environment variables
printenv | grep VITE_

# Build for production
npm run build:prod

# Test build locally
npm run preview
```

### Frontend Runtime Errors

#### Issue: White Screen of Death
```bash
# Check browser console
# Open DevTools (F12) and check Console tab

# Check for JavaScript errors
# Look for red error messages

# Clear browser cache
# Ctrl+Shift+R (hard refresh)

# Check network requests
# Go to Network tab and check for failed requests
```

#### Issue: CORS Errors
```bash
# Error: Access-Control-Allow-Origin

# Check backend CORS configuration
grep -A 10 "cors" backend/src/index.ts

# Update CORS settings
# In backend/src/index.ts:
app.use(cors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true
}));

# Restart backend
npm run restart:backend
```

## Database Issues

### PostgreSQL Issues

#### Issue: Connection Refused
```bash
# Error: connect ECONNREFUSED

# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check configuration
sudo -u postgres psql -c "SHOW config_file;"

# Test connection
sudo -u postgres psql -c "\l"
```

#### Issue: Database Doesn't Exist
```bash
# Error: database "hostingco" does not exist

# Create database
sudo -u postgres createdb hostingco

# Create user
sudo -u postgres createuser hostingco
sudo -u postgres psql -c "ALTER USER hostingco PASSWORD 'password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;"

# Run migrations
cd backend
npm run migrate
```

#### Issue: Permission Denied
```bash
# Error: permission denied for database

# Check user permissions
sudo -u postgres psql -c "\du"

# Grant permissions
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;"

# Reset permissions
sudo -u postgres psql -d hostingco -c "GRANT ALL ON SCHEMA public TO hostingco;"
```

#### Issue: Disk Space Full
```bash
# Check disk space
df -h

# Check database size
psql -h localhost -U hostingco -d hostingco -c "SELECT pg_size_pretty(pg_database_size('hostingco'));"

# Clean up old data
psql -h localhost -U hostingco -d hostingco -c "DELETE FROM activity_logs WHERE timestamp < NOW() - INTERVAL '90 days';"

# Vacuum database
psql -h localhost -U hostingco -d hostingco -c "VACUUM ANALYZE;"
```

### Migration Issues

#### Issue: Migration Failed
```bash
# Error: Migration failed

# Check migration status
cd backend
npm run migrate:status

# Rollback migration
npm run migrate:rollback

# Run migration again
npm run migrate

# Check migration file
ls -la backend/migrations/
```

#### Issue: Seed Data Failed
```bash
# Error: Seeding failed

# Check seed files
ls -la backend/seeds/

# Run specific seed
npm run seed:specific -- --file=users.js

# Reset and reseed
npm run db:reset
npm run seed
```

## 🔴 Redis Issues

### Redis Connection Issues

#### Issue: Redis Not Running
```bash
# Error: Redis connection failed

# Check Redis status
sudo systemctl status redis

# Start Redis
sudo systemctl start redis
sudo systemctl enable redis

# Test connection
redis-cli ping
```

#### Issue: Redis Memory Full
```bash
# Check Redis memory usage
redis-cli info memory

# Clear Redis cache
redis-cli flushall

# Check Redis configuration
redis-cli config get maxmemory

# Restart Redis
sudo systemctl restart redis
```

## 🔒 Security Issues

### SSL/TLS Issues

#### Issue: SSL Certificate Error
```bash
# Error: SSL certificate problem

# Check certificate expiration
openssl x509 -in /etc/ssl/certs/yourdomain.crt -noout -dates

# Renew certificate
sudo certbot renew

# Generate new certificate
sudo certbot --nginx -d yourdomain.com

# Check certificate path
ls -la /etc/ssl/certs/
```

#### Issue: Mixed Content
```bash
# Error: Mixed content warning

# Check HTTPS configuration
grep -A 10 "ssl" /etc/nginx/sites-available/hostingco

# Update asset URLs
# Ensure all resources use HTTPS

# Restart Nginx
sudo systemctl reload nginx
```

### Authentication Issues

#### Issue: JWT Token Expired
```bash
# Check token expiration
node -e "
const token = 'your-jwt-token';
const decoded = require('jsonwebtoken').decode(token);
console.log('Expires:', new Date(decoded.exp * 1000));
"

# Generate new token
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Update JWT secret
echo "JWT_SECRET=new-secret-key" >> .env
```

## Performance Issues

### Slow Response Times

#### Issue: Database Slow Queries
```bash
# Check slow queries
psql -h localhost -U hostingco -d hostingco -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Add indexes
psql -h localhost -U hostingco -d hostingco -c "CREATE INDEX CONCURRENTLY idx_table_column ON table(column);"

# Analyze tables
psql -h localhost -U hostingco -d hostingco -c "ANALYZE;"
```

#### Issue: High CPU Usage
```bash
# Check CPU usage
top -p $(pgrep -f "node")

# Monitor with htop
htop

# Check Node.js process
ps aux | grep node

# Restart services
npm run restart:all
```

### Memory Issues

#### Issue: Out of Memory
```bash
# Check memory usage
free -h

# Check Node.js memory
ps aux | grep node | awk '{print $4, $11}'

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev:backend

# Monitor with PM2
pm2 monit
```

## Network Issues

### DNS Issues

#### Issue: Domain Not Resolving
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check /etc/hosts
cat /etc/hosts

# Flush DNS cache
sudo systemctl flush-dns  # macOS
sudo systemctl restart systemd-resolved  # Linux
```

### Firewall Issues

#### Issue: Port Blocked
```bash
# Check firewall status
sudo ufw status

# Allow ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3003/tcp

# Check iptables
sudo iptables -L
```

## Monitoring and Diagnostics

### System Monitoring
```bash
# Check system resources
htop
iotop
nethogs

# Check disk usage
df -h
du -sh /var/log/

# Check network connections
netstat -tulpn
ss -tulpn
```

### Application Monitoring
```bash
# Check application logs
tail -f backend/logs/app.log
tail -f backend/logs/error.log

# Check API health
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/api/health

# Monitor with PM2
pm2 status
pm2 logs
pm2 monit
```

### Database Monitoring
```bash
# Check database connections
psql -h localhost -U hostingco -d hostingco -c "SELECT count(*) FROM pg_stat_activity;"

# Check database size
psql -h localhost -U hostingco -d hostingco -c "SELECT pg_size_pretty(pg_database_size('hostingco'));"

# Check slow queries
psql -h localhost -U hostingco -d hostingco -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;"
```

## Emergency Procedures

### Complete System Recovery
```bash
# 1. Stop all services
npm run stop:all
sudo systemctl stop postgresql redis nginx

# 2. Backup current state
cp -r /var/lib/postgresql /backups/postgres_$(date +%Y%m%d_%H%M%S)
cp -r /var/lib/redis /backups/redis_$(date +%Y%m%d_%H%M%S)

# 3. Restore from backup
psql -h localhost -U hostingco -d hostingco < backup_20260508_030000.sql

# 4. Start services
sudo systemctl start postgresql redis nginx
npm run start:all

# 5. Verify system
curl http://localhost:3003/api/health
curl http://localhost:3000
```

### Data Recovery
```bash
# Restore database from backup
pg_dump -h localhost -U hostingco hostingco > emergency_backup.sql
psql -h localhost -U hostingco -d hostingco < backup_20260508_030000.sql

# Verify data integrity
cd backend
npm run db:verify
```

## 📞 Getting Help

### When to Contact Support
- Issues not resolved by this guide
- System-wide outages
- Data corruption concerns
- Security incidents

### Information to Provide
1. **System Information**:
   ```bash
   uname -a
   node --version
   npm --version
   psql --version
   redis-cli --version
   ```

2. **Error Messages**:
   - Full error output
   - Logs from relevant services
   - Screenshots if applicable

3. **System Status**:
   ```bash
   systemctl status postgresql redis nginx
   curl -s http://localhost:3003/api/health
   ```

4. **Recent Changes**:
   - Recent deployments
   - Configuration changes
   - Updates applied

### Support Channels
- **Email**: support@hostingco.com
- **Documentation**: [System Docs](./README.md)
- **GitHub Issues**: Create issue with full details
- **Emergency**: Emergency hotline for critical issues

## Additional Resources

- [Installation Guide](./installation.md) - Installation procedures
- [Development Guide](./development.md) - Development setup
- [API Reference](./api-reference.md) - API documentation
- [Database Guide](./database.md) - Database operations
- [Security Procedures](./security.md) - Security best practices

---

*Last updated: $(date)*

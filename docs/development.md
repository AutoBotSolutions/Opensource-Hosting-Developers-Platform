# Development Server Procedures

This guide covers all procedures for running and managing the HostingCo development servers.

## Development Server Overview

The HostingCo system consists of multiple development servers:

- **Frontend Server** (Vite/React) - Port 3000
- **Backend API Server** (Node.js/Express) - Port 3003
- **Database Server** (PostgreSQL) - Port 5432
- **Cache Server** (Redis) - Port 6379

## Starting Development Servers

### Method 1: Concurrent Development (Recommended)
```bash
# From project root - starts both frontend and backend
npm run dev

# This runs:
# - npm run dev:backend (port 3003)
# - npm run dev:frontend (port 3000)
```

### Method 2: Individual Servers
```bash
# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Start in separate terminals for independent control
```

### Method 3: Docker Development
```bash
# Start all services with Docker Compose
docker-compose up

# Start specific services
docker-compose up backend frontend

# Development with Docker
docker-compose -f docker-compose.yml up
```

## Server Status Commands

### Check Server Status
```bash
# Check if servers are running
curl -s http://localhost:3000 > /dev/null && echo "Frontend: RUNNING" || echo "Frontend: STOPPED"
curl -s http://localhost:3003/api/health > /dev/null && echo "Backend: RUNNING" || echo "Backend: STOPPED"

# Check database connection (if using local PostgreSQL)
pg_isready -h localhost -p 5432 -U hostingco

# Check Redis connection (if using local Redis)
redis-cli ping
```

### View Server Logs
```bash
# Backend logs (if running with npm)
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Frontend logs (Vite output)
# Logs appear in the terminal where npm run dev:frontend is running

# Docker logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Development Server Configuration

### Backend Development Server
**Port**: 3003 (configurable via `PORT` environment variable)

**Features**:
- Hot reload with Nodemon
- TypeScript compilation with ts-node
- Automatic restart on file changes
- CORS enabled for frontend (localhost:3000)
- Detailed logging

**Environment Variables**:
```env
NODE_ENV=development
PORT=3003
DATABASE_URL=postgresql://hostingco:password@localhost:5432/hostingco
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
JWT_SECRET=dev-secret-key
```

### Frontend Development Server
**Port**: 3000 (configurable via Vite)

**Features**:
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript support
- Proxy to backend API
- Development tools integration

**Configuration** (vite.config.ts):
```typescript
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3003',
        changeOrigin: true
      }
    }
  }
})
```

## Development Workflow

### Daily Development Routine
```bash
# 1. Start development servers
npm run dev

# 2. In separate terminal, watch for changes
npm run test:watch

# 3. Make code changes
# 4. Servers auto-reload
# 5. Test changes in browser
```

### Code Changes and Hot Reload
- **Backend**: Nodemon restarts server on .ts/.js file changes
- **Frontend**: Vite hot-reloads components on .tsx/.ts/.css file changes
- **Shared**: Both servers restart when shared package changes

### Database Changes
```bash
# Create new migration
cd backend
npm run migration:generate -- --name add_new_feature

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:rollback

# Reset database
npm run db:reset
```

## Testing During Development

### Running Tests
```bash
# Run all tests
npm test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend

# Watch mode
npm run test:watch
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## 🐛 Debugging Development Servers

### Backend Debugging
```bash
# Start with Node.js debugger
npm run dev:debug

# Or with VS Code launch configuration
# Use .vscode/launch.json configuration
```

**VS Code Launch Configuration** (.vscode/launch.json):
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/src/index.ts",
      "outFiles": ["${workspaceFolder}/backend/dist/**/*.js"],
      "runtimeArgs": ["-r", "ts-node/register"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Frontend Debugging
- Use browser DevTools (F12)
- React DevTools extension
- Redux DevTools (if using Redux)
- Vite DevTools integration

### Common Debugging Commands
```bash
# Check TypeScript compilation
cd backend && npx tsc --noEmit

# Check ESLint errors
npm run lint

# Fix ESLint errors
npm run lint:fix

# Check package dependencies
npm audit
npm audit fix
```

## Performance Monitoring

### Development Performance
```bash
# Monitor backend performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:3003/api/health

# Monitor frontend build performance
# Vite shows build times in terminal

# Memory usage
node --inspect backend/dist/index.js
```

### Database Performance
```bash
# Check slow queries
psql -h localhost -U hostingco -d hostingco -c "
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;"

# Check database size
psql -h localhost -U hostingco -d hostingco -c "
SELECT pg_size_pretty(pg_database_size('hostingco'));"
```

## Development Tools Integration

### VS Code Extensions (Recommended)
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter
- ESLint
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens
- Docker
- Thunder Client (API testing)

### Git Hooks
```bash
# Install pre-commit hooks
npm run setup:hooks

# Pre-commit runs:
# - ESLint
# - TypeScript compilation check
# - Unit tests
```

### API Testing
```bash
# Use curl for quick API testing
curl -X GET http://localhost:3003/api/health
curl -X POST http://localhost:3003/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Or use API client like Postman/Insomnia
# Import collection from docs/api-collection.json
```

## Common Development Issues

### Port Conflicts
```bash
# Check what's using ports
ss -tlnp | grep -E ":300[03]"

# Kill processes
sudo kill -9 <PID>

# Or change ports in .env files
```

### TypeScript Compilation Errors
```bash
# Clear TypeScript cache
rm -rf backend/node_modules/.cache
npm run dev

# Check TypeScript version
npx tsc --version

# Update TypeScript if needed
npm install typescript@latest
```

### Frontend Build Issues
```bash
# Clear Vite cache
rm -rf frontend/node_modules/.vite
npm run dev:frontend

# Clear all caches
npm run clean
npm install
npm run dev
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql

# Reset database
cd backend
npm run db:reset
```

## 📝 Development Best Practices

### Code Organization
- Keep components small and focused
- Use TypeScript interfaces for all data structures
- Follow naming conventions (camelCase for variables, PascalCase for classes)
- Write meaningful commit messages

### Environment Management
- Use `.env.example` as template
- Never commit `.env` files
- Use different configs for dev/staging/prod
- Document all environment variables

### Testing Strategy
- Write unit tests for utility functions
- Write integration tests for API endpoints
- Test user interactions in frontend
- Maintain good test coverage (>80%)

### Performance Considerations
- Use React.memo for expensive components
- Implement proper caching strategies
- Optimize database queries
- Use lazy loading for large components

## Development Server Maintenance

### Regular Maintenance Tasks
```bash
# Weekly
npm audit fix
npm update

# Monthly
npm outdated
npm install -g npm@latest

# As needed
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Log Management
```bash
# Rotate logs (weekly)
logrotate -f /etc/logrotate.d/hostingco

# Clean old logs
find backend/logs -name "*.log" -mtime +30 -delete
```

### Database Maintenance
```bash
# Vacuum database (weekly)
psql -h localhost -U hostingco -d hostingco -c "VACUUM ANALYZE;"

# Update statistics
psql -h localhost -U hostingco -d hostingco -c "ANALYZE;"
```

## Additional Resources

- [API Reference](./api-reference.md) - Complete API documentation
- [Database Guide](./database.md) - Database operations and schema
- [Testing Guide](./testing.md) - Testing procedures and frameworks
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

---

*Last updated: $(date)*

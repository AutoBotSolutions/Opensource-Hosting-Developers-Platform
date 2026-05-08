# Configuration Guide

This comprehensive guide covers all configuration options for the HostingCo system.

## Configuration Overview

The HostingCo system uses environment variables and configuration files for flexible setup across different environments.

### Configuration Hierarchy
1. **Environment Variables** - Runtime configuration
2. **Configuration Files** - Static configuration
3. **Database Settings** - Dynamic configuration stored in database
4. **Default Values** - Fallback configuration in code

## Environment Variables

### Root Environment (.env)
```env
# Application Environment
NODE_ENV=development                    # development, staging, production
LOG_LEVEL=info                         # error, warn, info, debug

# Database Configuration
DATABASE_URL=postgresql://hostingco:password@localhost:5432/hostingco
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hostingco
DB_USER=hostingco
DB_PASSWORD=password
DB_SSL=false                           # true for production

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false                       # true for 465, false for other ports
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourdomain.com
SMTP_FROM_NAME=HostingCo

# File Upload Configuration
MAX_FILE_SIZE=10485760                  # 10MB in bytes
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpg,jpeg,png,pdf,doc,docx
ENABLE_VIRUS_SCAN=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000            # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
SESSION_TIMEOUT_MS=86400000             # 24 hours
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME_MS=900000                  # 15 minutes

# Monitoring and Analytics
ENABLE_METRICS=true
METRICS_PORT=9090
SENTRY_DSN=your-sentry-dsn
GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX

# Webhook Configuration
WEBHOOK_SECRET=your-webhook-secret
SECURITY_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# Development Only
ENABLE_DEBUG_TOOLS=true
ENABLE_SWAGGER_UI=true
CORS_ORIGIN=http://localhost:3000
```

### Backend Environment (backend/.env)
```env
# Server Configuration
PORT=3003
HOST=localhost

# Database Pool Configuration
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_ACQUIRE_TIMEOUT=30000
DB_POOL_IDLE_TIMEOUT=30000

# API Configuration
API_VERSION=v1
API_PREFIX=/api
ENABLE_API_DOCS=true
ENABLE_GRAPHQL=false

# Authentication
AUTH_STRATEGY=jwt
ENABLE_2FA=false
2FA_ISSUER=HostingCo
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# Session Management
SESSION_STORE=redis
SESSION_SECRET=your-session-secret
SESSION_NAME=hostingco.sid
SESSION_COOKIE_SECURE=false              # true for HTTPS
SESSION_COOKIE_HTTP_ONLY=true

# WebSocket Configuration
WS_ENABLED=true
WS_PORT=3004
WS_PATH=/socket.io
WS_CORS_ORIGIN=http://localhost:3000

# Background Jobs
ENABLE_JOB_QUEUE=true
JOB_CONCURRENCY=5
JOB_RETRY_ATTEMPTS=3
JOB_RETRY_DELAY=5000

# Logging
LOG_FORMAT=json
LOG_FILE_PATH=./logs/app.log
LOG_MAX_SIZE=10m
LOG_MAX_FILES=5
LOG_DATE_PATTERN=YYYY-MM-DD

# Health Checks
HEALTH_CHECK_INTERVAL=30000
HEALTH_CHECK_TIMEOUT=5000
ENABLE_HEALTH_CHECKS=true
```

### Frontend Environment (frontend/.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3003/api
VITE_WS_URL=ws://localhost:3003
VITE_API_TIMEOUT=10000

# Application
VITE_APP_NAME=HostingCo
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Hosting Company Management System

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
VITE_ENABLE_PERFORMANCE_MONITORING=false
VITE_ENABLE_ERROR_REPORTING=false

# Theme and UI
VITE_DEFAULT_THEME=light
VITE_DEFAULT_LANGUAGE=en
VITE_DEFAULT_TIMEZONE=America/New_York
VITE_DEFAULT_CURRENCY=USD

# Map Configuration
VITE_MAP_API_KEY=your-map-api-key
VITE_DEFAULT_LAT=40.7128
VITE_DEFAULT_LNG=-74.0060

# File Upload
VITE_MAX_FILE_SIZE=10485760
VITE_ALLOWED_FILE_TYPES=image/*,application/pdf,.doc,.docx
VITE_CHUNK_SIZE=1048576

# Chart Configuration
VITE_CHART_DEFAULT_TYPE=line
VITE_CHART_ANIMATION=true
VITE_CHART_COLORS=#3B82F6,#10B981,#F59E0B,#EF4444

# Development
VITE_DEV_SERVER_PORT=3000
VITE_DEV_SERVER_HOST=localhost
VITE_DEV_SERVER_HTTPS=false
VITE_DEV_SERVER_OPEN=true
```

## Configuration Files

### Backend Configuration

#### Knex Configuration (knexfile.ts)
```typescript
import type { Knex } from 'knex';

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || '2'),
      max: parseInt(process.env.DB_POOL_MAX || '10'),
      acquireTimeoutMillis: parseInt(process.env.DB_POOL_ACQUIRE_TIMEOUT || '30000'),
      idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000')
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    debug: process.env.NODE_ENV === 'development'
  },

  staging: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 5,
      max: 20,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    debug: false
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL,
    pool: {
      min: 10,
      max: 30,
      acquireTimeoutMillis: 60000,
      idleTimeoutMillis: 30000
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './seeds'
    },
    debug: false,
    acquireConnectionTimeout: 60000
  }
};

export default config;
```

#### Winston Logging Configuration (src/config/logger.ts)
```typescript
import winston from 'winston';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'hostingco-backend' },
  transports: [
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({
      filename: process.env.LOG_FILE_PATH || './logs/app.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

export default logger;
```

#### CORS Configuration (src/config/cors.ts)
```typescript
import cors from 'cors';

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

export default cors(corsOptions);
```

### Frontend Configuration

#### Vite Configuration (vite.config.ts)
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  server: {
    port: parseInt(process.env.VITE_DEV_SERVER_PORT || '3000'),
    host: process.env.VITE_DEV_SERVER_HOST || 'localhost',
    https: process.env.VITE_DEV_SERVER_HTTPS === 'true',
    open: process.env.VITE_DEV_SERVER_OPEN === 'true',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: process.env.VITE_WS_URL?.replace('/socket.io', '') || 'http://localhost:3003',
        changeOrigin: true,
        ws: true
      }
    }
  },
  
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@headlessui/react', '@heroicons/react']
        }
      }
    }
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types')
    }
  },
  
  define: {
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION),
    __APP_NAME__: JSON.stringify(process.env.VITE_APP_NAME)
  }
});
```

#### Tailwind CSS Configuration (tailwind.config.js)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        success: {
          50: '#ecfdf5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
};
```

## Database Configuration

### PostgreSQL Configuration (postgresql.conf)
```ini
# Connection Settings
listen_addresses = '*'
port = 5432
max_connections = 200

# Memory Settings
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# WAL Settings
wal_level = replica
max_wal_size = 1GB
min_wal_size = 80MB
checkpoint_completion_target = 0.9

# Logging Settings
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'all'
log_min_duration_statement = 1000

# Performance Settings
random_page_cost = 1.1
effective_io_concurrency = 200
```

### Redis Configuration (redis.conf)
```ini
# Network
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 300

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# Security
requirepass your-redis-password
auth no

# Logging
loglevel notice
logfile /var/log/redis/redis-server.log
syslog-enabled yes
syslog-ident redis
```

## Nginx Configuration

### Production Nginx Configuration
```nginx
# /etc/nginx/sites-available/hostingco
upstream backend {
    server localhost:3003;
    keepalive 32;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/yourdomain.crt;
    ssl_certificate_key /etc/ssl/private/yourdomain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Frontend
    location / {
        root /var/www/hostingco/frontend/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File Uploads
    location /uploads {
        alias /var/www/hostingco/uploads;
        expires 1M;
        add_header Cache-Control "public";
    }

    # Health Check
    location /health {
        proxy_pass http://backend/api/health;
        access_log off;
    }
}
```

## Docker Configuration

### Docker Compose Configuration (docker-compose.yml)
```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - VITE_API_URL=http://localhost:3003/api
      - VITE_WS_URL=ws://localhost:3003
    depends_on:
      - backend
    networks:
      - hostingco-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://hostingco:password@postgres:5432/hostingco
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - FRONTEND_URL=http://localhost:3000
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/uploads:/app/uploads
    networks:
      - hostingco-network

  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=hostingco
      - POSTGRES_USER=hostingco
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - hostingco-network

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - hostingco-network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - ./frontend/dist:/var/www/hostingco/frontend/dist
    depends_on:
      - frontend
      - backend
    networks:
      - hostingco-network

volumes:
  postgres_data:
  redis_data:

networks:
  hostingco-network:
    driver: bridge
```

### Backend Dockerfile
```dockerfile
# backend/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Create directories
RUN mkdir -p logs uploads && chown -R nodejs:nodejs logs uploads

USER nodejs

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node dist/healthcheck.js

CMD ["node", "dist/index.js"]
```

## Environment-Specific Configurations

### Development Configuration
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_DEBUG_TOOLS=true
ENABLE_SWAGGER_UI=true
CORS_ORIGIN=http://localhost:3000
SESSION_COOKIE_SECURE=false
```

### Staging Configuration
```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_DEBUG_TOOLS=false
ENABLE_SWAGGER_UI=false
CORS_ORIGIN=https://staging.yourdomain.com
SESSION_COOKIE_SECURE=true
```

### Production Configuration
```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_DEBUG_TOOLS=false
ENABLE_SWAGGER_UI=false
CORS_ORIGIN=https://yourdomain.com
SESSION_COOKIE_SECURE=true
DB_SSL=true
```

## Configuration Validation

### Environment Validation Script
```typescript
// backend/src/config/validation.ts
import Joi from 'joi';

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().default(3003),
  DATABASE_URL: Joi.string().required(),
  REDIS_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(32).required(),
  FRONTEND_URL: Joi.string().uri().required(),
  SMTP_HOST: Joi.string().required(),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  MAX_FILE_SIZE: Joi.number().default(10485760),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info')
}).unknown();

export const validateConfig = () => {
  const { error, value } = envSchema.validate(process.env);
  
  if (error) {
    throw new Error(`Configuration validation error: ${error.message}`);
  }
  
  return value;
};
```

### Configuration Health Check
```typescript
// backend/src/config/health.ts
export const checkConfigHealth = async () => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    email: await checkEmail(),
    storage: await checkStorage()
  };
  
  return {
    healthy: Object.values(checks).every(check => check.healthy),
    checks
  };
};

const checkDatabase = async () => {
  try {
    await knex.raw('SELECT 1');
    return { healthy: true, message: 'Database connection successful' };
  } catch (error) {
    return { healthy: false, message: `Database connection failed: ${error.message}` };
  }
};

const checkRedis = async () => {
  try {
    await redis.ping();
    return { healthy: true, message: 'Redis connection successful' };
  } catch (error) {
    return { healthy: false, message: `Redis connection failed: ${error.message}` };
  }
};
```

## Configuration Management

### Dynamic Configuration Updates
```typescript
// backend/src/config/dynamic.ts
export class ConfigManager {
  private static instance: ConfigManager;
  private config: Map<string, any> = new Map();
  
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  async updateConfig(key: string, value: any) {
    this.config.set(key, value);
    
    // Update in database
    await knex('system_settings')
      .insert({ key, value })
      .onConflict('key')
      .merge();
    
    // Notify subscribers
    this.notifySubscribers(key, value);
  }
  
  async getConfig(key: string) {
    // Check memory cache first
    if (this.config.has(key)) {
      return this.config.get(key);
    }
    
    // Load from database
    const setting = await knex('system_settings')
      .where({ key })
      .first();
    
    if (setting) {
      this.config.set(key, setting.value);
      return setting.value;
    }
    
    // Return default value
    return this.getDefaultValue(key);
  }
  
  private getDefaultValue(key: string) {
    const defaults = {
      'site_name': 'HostingCo',
      'default_currency': 'USD',
      'session_timeout': '24h',
      'max_file_size': '10MB'
    };
    
    return defaults[key];
  }
  
  private notifySubscribers(key: string, value: any) {
    // WebSocket notification to connected clients
    this.websocketService.emit('config_updated', { key, value });
  }
}
```

## Configuration Checklist

### Development Setup
- [ ] Copy `.env.example` to `.env`
- [ ] Set `NODE_ENV=development`
- [ ] Configure database connection
- [ ] Configure Redis connection
- [ ] Set JWT secret
- [ ] Configure email settings
- [ ] Set frontend URL
- [ ] Enable debug tools

### Production Setup
- [ ] Set `NODE_ENV=production`
- [ ] Use strong secrets
- [ ] Enable SSL/TLS
- [ ] Configure proper CORS
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Set up log rotation
- [ ] Enable security headers

### Security Configuration
- [ ] Use strong JWT secret (32+ chars)
- [ ] Enable HTTPS only
- [ ] Set secure cookie flags
- [ ] Configure rate limiting
- [ ] Set up IP whitelisting
- [ ] Enable audit logging
- [ ] Configure 2FA
- [ ] Set up security monitoring

---

*Last updated: $(date)*

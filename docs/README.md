# HostingCo System Documentation

Welcome to the HostingCo system documentation. This comprehensive guide covers all aspects of the hosting company management system, from installation to advanced operations.

## Project Overview

HostingCo is a modern, full-stack hosting company management system built with:
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Redis
- **Frontend**: React, TypeScript, TailwindCSS, Vite
- **Shared**: TypeScript types and utilities
- **Features**: User management, server hosting, billing, support tickets, real-time dashboard

## Documentation Structure

### Getting Started
- [Installation & Setup](./installation.md) - Complete installation guide
- [Quick Start](./quick-start.md) - Get the system running in minutes
- [Development Setup](./development.md) - Development environment configuration
- [Development Guide](./development-guide.md) - Comprehensive development guidelines

### System Overview
- [Architecture](./architecture.md) - System architecture and components
- [Configuration](./configuration.md) - System configuration options
- [Database Schema](./database.md) - Database structure and operations

### API Documentation
- [API Reference](./api-reference.md) - Complete REST API documentation
- [Authentication](./authentication.md) - JWT authentication and authorization

### Core Features
- [User Management](./user-management.md) - Managing users and clients
- [Hosting Services](./hosting.md) - Server management and hosting plans
- [Billing Operations](./billing.md) - Billing and subscription management
- [Support System](./support.md) - Customer support tickets and procedures

### Operations & Maintenance
- [Deployment](./deployment.md) - Production deployment procedures
- [Backup & Recovery](./backup-recovery.md) - Data backup and recovery
- [Maintenance Tasks](./maintenance.md) - Regular maintenance procedures
- [Security Procedures](./security.md) - Security best practices

### Development & Testing
- [Testing](./testing.md) - Testing procedures and frameworks
- [Contributing](./contributing.md) - Contribution guidelines
- [Troubleshooting](./troubleshooting.md) - Common issues and solutions

## Quick Access

- **Frontend Panel**: http://localhost:3000
- **Backend API**: http://localhost:3003
- **API Health Check**: http://localhost:3003/api/health

## Quick Script Commands

```bash
# Install all dependencies
npm run install:all

# Initial setup
npm run setup

# Start development servers (both frontend and backend)
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Run tests
npm run test

# Start production server
npm start
```

## System Requirements

- **Node.js**: 18.0.0 or higher (verified: v20.19.2)
- **npm**: 8.0.0 or higher (verified: v9.2.0)
- **PostgreSQL**: 15 or higher (optional for development)
- **Redis**: 7 or higher (optional for development)
- **Docker & Docker Compose**: Optional

## Default Ports

- **Frontend**: 3000 (Currently running)
- **Backend API**: 3003 (Currently running)
- **PostgreSQL**: 5432 (optional)
- **Redis**: 6379 (optional)
- **Nginx**: 80, 443 (production)

## � Current System Status

### Active Services
- **Frontend Server**: Running on http://localhost:3000
- **Backend API**: Running on http://localhost:3003
- **Health Check**: http://localhost:3003/api/health
- **API Endpoints**: All core endpoints functional

### Project Structure
```
HostingCo/
├── backend/          # Node.js/Express API (TypeScript)
├── frontend/         # React SPA (TypeScript + Vite)
├── shared/           # Shared types and utilities
├── data/             # Seed data, config, migrations
├── scripts/          # Automation scripts
├── docs/             # Comprehensive documentation
└── logs/             # Application logs
```

### Recent Updates
- **Data Directory**: Complete seed data, configuration, and migrations
- **Documentation**: Updated API reference, architecture, and deployment guides
- **System Verification**: All services tested and running
- **Database Schema**: Complete PostgreSQL migrations with indexes

## Quick Start (Verified)

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start development servers (both frontend and backend)
npm run dev

# 3. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:3003
# Health Check: http://localhost:3003/api/health
```

## 📁 Data Management

The `/data` directory contains comprehensive system data:

- **Seed Data**: Users, servers, invoices, support tickets
- **Configuration**: Hosting plans, system settings
- **Sample Data**: Dashboard stats, analytics
- **Migrations**: Database schema and performance indexes

See [Data Management Guide](./data-management.md) for complete details.

## Development Commands (Verified)

```bash
# Development
npm run dev              # Start both servers
npm run dev:backend      # Backend only (port 3003)
npm run dev:frontend     # Frontend only (port 3000)

# Building
npm run build            # Build all packages
npm run build:backend    # Backend TypeScript compilation
npm run build:frontend   # Frontend Vite build

# Testing
npm run test             # Run all tests
npm run test:backend     # Backend tests
npm run test:frontend    # Frontend tests

# Production
npm start                # Start production server
```

## 📞 Support

For technical support, please refer to:
- [Troubleshooting Guide](./troubleshooting.md)
- [Data Management Guide](./data-management.md)
- [Development Guide](./development-guide.md)

---

*Last updated: 2026-05-08*

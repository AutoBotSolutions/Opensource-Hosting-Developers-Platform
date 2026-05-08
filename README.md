# HostingCo - Complete Hosting Management System

A modern, full-stack hosting company management system built with TypeScript, React, Node.js, and Docker.

## Features

- **User Management**: Authentication, authorization, and user profiles
- **Hosting Services**: Manage shared hosting, VPS, and dedicated servers
- **Billing System**: Automated invoicing and payment processing
- **Support Ticket System**: Customer support with ticket management
- **Dashboard**: Real-time analytics and monitoring
- **API**: RESTful API with comprehensive documentation
- **Modern UI**: Responsive design with TailwindCSS

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development
- TailwindCSS for styling
- React Query for data fetching
- React Router for navigation
- Lucide React for icons

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL for database
- Redis for caching
- JWT for authentication
- Winston for logging
- Knex.js for database migrations

### Infrastructure
- Docker & Docker Compose
- Nginx for reverse proxy
- Multi-stage builds for optimization

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL (if not using Docker)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YOUR_USERNAME/hostingco-system.git
cd hostingco-system
```

2. Install dependencies:
```bash
npm run install:all
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development servers:
```bash
npm run dev
```

Or use Docker:
```bash
docker-compose up -d
```

## Project Structure

```
HostingCo/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── database/       # Database configuration
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utility functions
│   ├── Dockerfile
│   └── package.json
├── shared/                 # Shared types and utilities
│   └── src/
│       ├── types/          # TypeScript interfaces
│       └── utils/          # Shared utility functions
├── scripts/                # Deployment and utility scripts
├── docs/                   # Documentation
├── docker-compose.yml      # Docker configuration
└── package.json           # Root package.json
```

## Available Scripts

- `npm run dev` - Start development servers (backend + frontend)
- `npm run build` - Build all packages for production
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run install:all` - Install dependencies for all packages

## API Documentation

The API is available at `http://localhost:3001/api` when running in development mode.

### Authentication Endpoints
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### User Endpoints
- `GET /api/users` - List users (admin only)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user profile

### Hosting Endpoints
- `GET /api/hosting` - List hosting plans
- `GET /api/hosting/servers` - List servers
- `POST /api/hosting/servers` - Create new server

### Billing Endpoints
- `GET /api/billing/invoices` - List invoices
- `GET /api/billing/payments` - List payments

### Support Endpoints
- `GET /api/support/tickets` - List support tickets
- `POST /api/support/tickets` - Create support ticket

## Environment Variables

See `.env.example` for a complete list of environment variables.

### Backend Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `DATABASE_URL` - PostgreSQL connection string

## GitHub Deployment

This project is configured for automated deployment using GitHub Actions.

### Site Deployment (GitHub Pages)

The documentation site (`site/`) automatically deploys to GitHub Pages:
- Triggered by pushes to `main` or `develop` branches
- No configuration required - just enable GitHub Pages in repository settings
- Site will be available at `https://YOUR_USERNAME.github.io/hostingco-system`

### Backend Deployment

The backend (`backend/`) uses GitHub Actions for CI/CD:
- Automated testing and building
- Docker image creation
- Deployment to production (configure based on your hosting provider)

**Setup Steps:**
1. Fork or create repository from this code
2. Enable GitHub Pages in repository settings
3. Configure environment variables in GitHub repository secrets
4. Push to `main` branch to trigger deployment

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md).

### Additional Environment Variables
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS
- `REACT_APP_API_URL` - Backend API URL (frontend)

## Docker Deployment

1. Build and start all services:
```bash
docker-compose up -d --build
```

2. View logs:
```bash
docker-compose logs -f
```

3. Stop services:
```bash
docker-compose down
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions, please contact our team or create an issue in the repository.

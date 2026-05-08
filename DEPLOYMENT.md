# HostingCo Deployment Guide

This guide covers deploying the HostingCo system to GitHub and GitHub Pages.

## Project Structure

```
HostingCo/
├── backend/          # Node.js/Express API server
├── frontend/         # React control panel
├── site/            # Static documentation site (GitHub Pages)
├── shared/          # Shared TypeScript types and utilities
├── scripts/         # Setup and utility scripts
└── docs/            # Project documentation
```

## GitHub Repository Setup

### 1. Create GitHub Repository

1. Go to GitHub and create a new repository named `hostingco-system`
2. Choose between public or private based on your needs
3. Do NOT initialize with README, .gitignore, or license (we already have these)

### 2. Initial Push to GitHub

```bash
# Navigate to project directory
cd /home/robbie/Desktop/HostingCo

# Initialize git repository
git init
git add .
git commit -m "Initial commit: Complete HostingCo system"

# Add remote repository
git remote add origin https://github.com/YOUR_USERNAME/hostingco-system.git

# Push to GitHub
git push -u origin main
```

## Environment Configuration

### Backend Environment Variables

Copy the example environment file:
```bash
cp .env.example backend/.env
```

Update the backend `.env` file with your actual values:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: Secure random string
- `SMTP_*`: Email configuration
- `FRONTEND_URL`: Frontend URL

### Site Configuration

The site is static and requires no environment variables for GitHub Pages deployment.

## Deployment Workflows

### Backend Deployment (GitHub Actions)

The backend uses GitHub Actions for automated deployment:

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `backend/`, `shared/`, or workflow files

**Workflow Steps:**
1. **Test**: Linting and unit tests
2. **Build**: TypeScript compilation and Docker image
3. **Deploy**: Deploy to production (only on main branch)

**File:** `.github/workflows/backend-deploy.yml`

### Site Deployment (GitHub Pages)

The documentation site deploys automatically to GitHub Pages:

**Triggers:**
- Push to `main` or `develop` branches
- Changes in `site/` directory

**Workflow Steps:**
1. **Build**: Prepare static files
2. **Deploy**: Publish to GitHub Pages

**File:** `.github/workflows/github-pages-deploy.yml`

## GitHub Pages Setup

### 1. Enable GitHub Pages

1. Go to repository settings
2. Navigate to "Pages" section
3. Set source to "GitHub Actions"
4. The workflow will automatically handle the rest

### 2. Configure Custom Domain (Optional)

1. In repository settings > Pages, add your custom domain
2. Configure DNS records as instructed by GitHub
3. The site will automatically be available at your domain

## Production Deployment

### Backend Production Deployment

The backend deployment workflow creates a Docker image. To complete production deployment:

#### Option 1: Cloud Provider (AWS ECS/Google Cloud Run)

```yaml
# Add to backend-deploy.yml workflow
- name: Deploy to AWS ECS
  uses: aws-actions/amazon-ecs-deploy-task-definition@v1
  with:
    task-definition: your-task-definition
    service: your-service-name
    cluster: your-cluster-name
```

#### Option 2: VPS Deployment

```bash
# On your VPS
docker pull your-registry/hostingco-backend:latest
docker run -d \
  --name hostingco-backend \
  -p 3001:3001 \
  --env-file .env \
  your-registry/hostingco-backend:latest
```

### Database Setup

#### PostgreSQL Setup

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE hostingco;
CREATE USER hostingco WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE hostingco TO hostingco;
\q
```

#### Redis Setup

```bash
# Install Redis
sudo apt install redis-server

# Start Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

## Local Development

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Site Development

```bash
cd site
npm install
npm run build
npm run preview
```

## Monitoring and Maintenance

### Backend Monitoring

- Application logs: `backend/logs/`
- Error tracking: Configure with your preferred service
- Performance monitoring: Set up APM tools

### Site Monitoring

- GitHub Pages provides basic analytics
- Consider Google Analytics for detailed tracking
- Monitor uptime with external services

## Security Considerations

### Backend Security

1. **Environment Variables**: Never commit `.env` files
2. **Database Security**: Use strong passwords and SSL
3. **API Security**: Implement rate limiting and authentication
4. **Dependencies**: Regularly update and audit dependencies

### Site Security

1. **HTTPS**: GitHub Pages automatically provides HTTPS
2. **Content Security Policy**: Consider adding CSP headers
3. **Subresource Integrity**: For external resources

## Troubleshooting

### Common Issues

**Backend Deployment Fails**
- Check environment variables
- Verify database connectivity
- Review GitHub Actions logs

**GitHub Pages Deployment Fails**
- Check build process in workflow
- Verify file paths and structure
- Review GitHub Pages settings

**Database Connection Issues**
- Verify connection string format
- Check firewall settings
- Ensure database is running

## Rollback Procedures

### Backend Rollback

```bash
# Revert to previous commit
git revert <commit-hash>
git push origin main
```

### Site Rollback

GitHub Pages automatically serves the latest successful deployment. To rollback:

1. Revert the changes
2. Push to main branch
3. GitHub Pages will automatically redeploy the previous version

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Check the main project README
4. Open an issue in the GitHub repository

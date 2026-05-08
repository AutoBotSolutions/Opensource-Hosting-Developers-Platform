import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { logger } from './utils/logger';
import { errorHandler } from './utils/errors';
import { rateLimiter } from './middleware/rateLimiter';
import { authRoutes } from './routes/auth';
import { userRoutes } from './routes/users';
import { dashboardRoutes } from './routes/dashboard';
import { hostingRoutes } from './routes/hosting';
import { billingRoutes } from './routes/billing';
import { supportRoutes } from './routes/support';
import { settingsRoutes } from './routes/settings';
import { healthCheck } from './routes/health';
// import { initializeWebSocket } from './services/websocket';

dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimiter);

app.use('/api/health', healthCheck);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hosting', hostingRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/settings', settingsRoutes);

app.use(errorHandler);

// Initialize WebSocket service
// const websocketService = initializeWebSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

export default app;

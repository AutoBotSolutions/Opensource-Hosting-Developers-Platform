import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// Extended Request interface to include user information
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Authentication middleware
export const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) {
        logger.warn('Invalid token attempt:', { error: err.message, ip: req.ip });
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or expired token' 
        });
      }

      req.user = user;
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

// Role-based authorization middleware
export const authorize = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt:', { 
        userRole: req.user.role, 
        requiredRoles: roles,
        ip: req.ip 
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Permission-based authorization middleware
export const requirePermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!req.user.permissions.includes(permission)) {
      logger.warn('Permission denied:', { 
        userId: req.user.id,
        requiredPermission: permission,
        userPermissions: req.user.permissions,
        ip: req.ip 
      });
      return res.status(403).json({ 
        success: false, 
        message: `Permission '${permission}' required` 
      });
    }

    next();
  };
};

// API Key authentication middleware
export const authenticateApiKey = (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return res.status(401).json({ 
        success: false, 
        message: 'API key required' 
      });
    }

    // Simulate API key validation (in production, this would check against database)
    const validApiKeys = {
      'sk_test123456789': { id: '1', name: 'Test API Key', permissions: ['read', 'write'] },
      'sk_prod123456789': { id: '2', name: 'Production API Key', permissions: ['read', 'write', 'delete'] }
    };

    const keyData = validApiKeys[apiKey];
    
    if (!keyData) {
      logger.warn('Invalid API key attempt:', { apiKey: apiKey.substring(0, 8) + '...', ip: req.ip });
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid API key' 
      });
    }

    // Add API key info to request
    (req as any).apiKey = keyData;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'API key authentication error' 
    });
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (!err) {
          req.user = user;
        }
      });
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next(); // Continue without authentication on error
  }
};

// Rate limiting per user
export const userRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(); // Skip if no user
    }

    const userId = req.user.id;
    const now = Date.now();
    const userRequests = requests.get(userId);

    if (!userRequests || now > userRequests.resetTime) {
      requests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userRequests.count >= maxRequests) {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many requests, please try again later' 
      });
    }

    userRequests.count++;
    next();
  };
};

// Generate JWT token
export const generateToken = (user: { id: string; email: string; role: string; permissions: string[] }) => {
  return jwt.sign(
    user,
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Verify token without middleware (for testing)
export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as any;
  } catch (error) {
    return null;
  }
};

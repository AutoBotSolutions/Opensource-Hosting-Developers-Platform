import jwt from 'jsonwebtoken';
import { User, UserSettings } from '../database/models';
import { logger } from '../utils/logger';

// Mock database for demonstration - in production, use actual database
const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@hostingco.com',
    password: '$2b$10$example.hash.here',
    name: 'Admin User',
    role: 'admin',
    permissions: ['all'],
    settings: {
      personal: {
        name: 'Admin User',
        email: 'admin@hostingco.com',
        timezone: 'UTC',
        language: 'en'
      },
      notifications: {
        email: { billing: true, serverAlerts: true, maintenance: true, security: true, marketing: false },
        push: { billing: true, serverAlerts: true, maintenance: true, security: true, marketing: false },
        sms: { billing: false, serverAlerts: false, maintenance: false, security: false, marketing: false }
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: '24h',
        ipWhitelist: [],
        apiKeys: []
      },
      preferences: {
        theme: 'light',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
        currency: 'USD',
        defaultPage: 'dashboard'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  }
];

export class AuthService {
  static async login(email: string, password: string) {
    const user = mockUsers.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    // In production, verify password with bcrypt
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    const isPasswordValid = password === 'admin123'; // Simple check for demo
    
    if (!isPasswordValid) {
      throw new Error('Invalid password');
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
      { expiresIn: '7d' }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token,
      refreshToken
    };
  }

  static async logout(token: string) {
    // In a real implementation, you'd blacklist the token
    // For now, we'll just log the logout
    logger.info('User logged out');
  }

  static async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret') as any;
      const user = mockUsers.find(u => u.id === decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }

      const newToken = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );

      return {
        token: newToken,
        refreshToken
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }
}

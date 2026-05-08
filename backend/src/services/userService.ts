import { User, UserSettings } from '../database/models';
import { logger } from '../utils/logger';

// Mock database for demonstration - in production, use actual database
let mockUsers: User[] = [
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

export class UserService {
  static async findAll() {
    return mockUsers.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }

  static async findById(id: string) {
    const user = mockUsers.find(u => u.id === id);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async findByEmail(email: string) {
    const user = mockUsers.find(u => u.email === email);
    return user;
  }

  static async create(userData: any) {
    // In production, hash password with bcrypt
    // const hashedPassword = await bcrypt.hash(userData.password, 10);
    const hashedPassword = '$2b$10$example.hash.here'; // Mock hash
    
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      password: hashedPassword,
      permissions: userData.permissions || ['read'],
      settings: userData.settings || {
        personal: {
          name: userData.name,
          email: userData.email,
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
    };
    
    mockUsers.push(newUser);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  }

  static async update(id: string, userData: any) {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }

    if (userData.password) {
      // In production, hash password with bcrypt
      // userData.password = await bcrypt.hash(userData.password, 10);
      userData.password = '$2b$10$example.hash.here'; // Mock hash
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      ...userData,
      updatedAt: new Date()
    };
    
    const { password, ...userWithoutPassword } = mockUsers[userIndex];
    return userWithoutPassword;
  }

  static async delete(id: string) {
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    mockUsers.splice(userIndex, 1);
  }

  static async resetLoginAttempts(email: string) {
    const user = mockUsers.find(u => u.email === email);
    if (user) {
      // In production, update login attempts in database
      logger.info(`Reset login attempts for user: ${email}`);
    }
  }
}

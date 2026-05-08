import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { logger } from '../utils/logger';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error) {
      logger.error('Login error:', error);
      res.status(401).json({ error: 'Invalid credentials' });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const userData = req.body;
      const result = await UserService.create(userData);
      res.status(201).json(result);
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(400).json({ error: 'Registration failed' });
    }
  }

  static async logout(req: Request, res: Response) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      await AuthService.logout(token);
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(400).json({ error: 'Logout failed' });
    }
  }

  static async refreshToken(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const result = await AuthService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({ error: 'Token refresh failed' });
    }
  }
}

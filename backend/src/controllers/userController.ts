import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { logger } from '../utils/logger';

export class UserController {
  static async getAll(req: Request, res: Response) {
    try {
      const users = await UserService.findAll();
      res.json(users);
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserService.findById(id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  static async create(req: Request, res: Response) {
    try {
      const userData = req.body;
      const user = await UserService.create(userData);
      res.status(201).json(user);
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(400).json({ error: 'Failed to create user' });
    }
  }

  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await UserService.update(id, userData);
      res.json(user);
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(400).json({ error: 'Failed to update user' });
    }
  }

  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await UserService.delete(id);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(400).json({ error: 'Failed to delete user' });
    }
  }
}

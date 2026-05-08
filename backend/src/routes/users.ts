import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Users list endpoint' });
});

router.get('/:id', (req, res) => {
  res.json({ success: true, message: 'User details endpoint' });
});

export { router as userRoutes };

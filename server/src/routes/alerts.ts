import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/alerts - Get all alerts
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const alerts = await prisma.alert.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ alerts });
});

// GET /api/alerts/:id - Get alert by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid alert ID' });
    return;
  }

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  res.json({ alert });
});

// POST /api/alerts - Create new alert
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, type, msg, time } = req.body;

  if (!userId || !type || !msg || !time) {
    res.status(400).json({ error: 'userId, type, msg, and time are required' });
    return;
  }

  const validTypes = ['critical', 'warning', 'info'];
  if (!validTypes.includes(type)) {
    res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
    return;
  }

  const alert = await prisma.alert.create({
    data: {
      userId: Number(userId),
      type,
      msg,
      time,
    },
  });

  res.status(201).json({ alert });
});

// DELETE /api/alerts/:id - Dismiss alert
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid alert ID' });
    return;
  }

  const alert = await prisma.alert.findUnique({ where: { id } });
  if (!alert) {
    res.status(404).json({ error: 'Alert not found' });
    return;
  }

  await prisma.alert.delete({ where: { id } });
  res.json({ message: 'Alert dismissed successfully' });
});

export default router;

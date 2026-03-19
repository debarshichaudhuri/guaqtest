import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { verifyToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

function toPermissionsArray(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { const p = JSON.parse(raw); return Array.isArray(p) ? p : []; } catch { return []; }
  }
  return [];
}

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  const permissions = toPermissionsArray(user.permissions);

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, permissions },
    secret,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, phone: user.phone, permissions },
  });
});

// POST /api/auth/register (admin-only)
router.post(
  '/register',
  verifyToken,
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password, role, phone, permissions } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'User already exists with this email' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const permsArray = Array.isArray(permissions) ? permissions : [];

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'staff',
        phone: phone || null,
        permissions: permsArray,
      },
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: user.phone,
        permissions: toPermissionsArray(user.permissions),
        createdAt: user.createdAt,
      },
    });
  }
);

// GET /api/auth/me
router.get(
  '/me',
  verifyToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, role: true, phone: true, permissions: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: { ...user, permissions: toPermissionsArray(user.permissions) },
    });
  }
);

export default router;

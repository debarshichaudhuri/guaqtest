import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/staff - Get all staff members
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const staff = await prisma.staffMember.findMany({
    orderBy: { name: 'asc' },
  });
  res.json({ staff });
});

// GET /api/staff/:id - Get staff member by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const member = await prisma.staffMember.findUnique({ where: { id } });
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  res.json({ staff: member });
});

// POST /api/staff - Create new staff member
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, role, email, phone, currentShift, isOnDuty, avatarBg } =
    req.body;

  if (!name || !role || !email || !phone) {
    res.status(400).json({ error: 'name, role, email, and phone are required' });
    return;
  }

  const validShifts = ['Morning', 'Evening', 'Night'];
  if (currentShift && !validShifts.includes(currentShift)) {
    res.status(400).json({ error: `Invalid shift. Must be one of: ${validShifts.join(', ')}` });
    return;
  }

  const existing = await prisma.staffMember.findUnique({ where: { email } });
  if (existing) {
    res.status(409).json({ error: 'Staff member already exists with this email' });
    return;
  }

  const member = await prisma.staffMember.create({
    data: {
      name,
      role,
      email,
      phone,
      currentShift: currentShift || 'Morning',
      isOnDuty: isOnDuty ?? false,
      avatarBg: avatarBg || 'bg-blue-500',
    },
  });

  res.status(201).json({ staff: member });
});

// PATCH /api/staff/:id - Update staff member
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, role, email, phone, currentShift, isOnDuty, avatarBg } =
    req.body;

  const member = await prisma.staffMember.findUnique({ where: { id } });
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  const validShifts = ['Morning', 'Evening', 'Night'];
  if (currentShift && !validShifts.includes(currentShift)) {
    res.status(400).json({ error: `Invalid shift. Must be one of: ${validShifts.join(', ')}` });
    return;
  }

  // Check for email conflict if email is being updated
  if (email && email !== member.email) {
    const emailConflict = await prisma.staffMember.findUnique({
      where: { email },
    });
    if (emailConflict) {
      res.status(409).json({ error: 'Another staff member already has this email' });
      return;
    }
  }

  const updated = await prisma.staffMember.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(role && { role }),
      ...(email && { email }),
      ...(phone && { phone }),
      ...(currentShift && { currentShift }),
      ...(isOnDuty !== undefined && { isOnDuty }),
      ...(avatarBg && { avatarBg }),
    },
  });

  res.json({ staff: updated });
});

// DELETE /api/staff/:id - Delete staff member
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const member = await prisma.staffMember.findUnique({ where: { id } });
  if (!member) {
    res.status(404).json({ error: 'Staff member not found' });
    return;
  }

  await prisma.staffMember.delete({ where: { id } });
  res.json({ message: 'Staff member deleted successfully' });
});

export default router;

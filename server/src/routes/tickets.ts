import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/tickets - Get all tickets
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const tickets = await prisma.ticket.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json({ tickets });
});

// GET /api/tickets/:id - Get ticket by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.json({ ticket });
});

// POST /api/tickets - Create new ticket
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { roomId, guestName, category, description, priority, assignedTo } =
    req.body;

  if (!roomId || !guestName || !category || !description) {
    res.status(400).json({
      error: 'roomId, guestName, category, and description are required',
    });
    return;
  }

  const validCategories = [
    'Housekeeping',
    'Maintenance',
    'F&B',
    'Front Desk',
    'Concierge',
  ];
  if (!validCategories.includes(category)) {
    res.status(400).json({ error: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    return;
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (priority && !validPriorities.includes(priority)) {
    res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    return;
  }

  const ticket = await prisma.ticket.create({
    data: {
      roomId,
      guestName,
      category,
      description,
      priority: priority || 'Medium',
      status: 'New',
      assignedTo: assignedTo || null,
    },
  });

  res.status(201).json({ ticket });
});

// PATCH /api/tickets/:id - Update ticket (status, assignedTo, priority, etc.)
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, assignedTo, priority, description, category } = req.body;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const validStatuses = ['New', 'In Progress', 'Resolved'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const validPriorities = ['Low', 'Medium', 'High', 'Critical'];
  if (priority && !validPriorities.includes(priority)) {
    res.status(400).json({ error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` });
    return;
  }

  const updatedTicket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(status && { status }),
      ...(assignedTo !== undefined && { assignedTo }),
      ...(priority && { priority }),
      ...(description && { description }),
      ...(category && { category }),
    },
  });

  res.json({ ticket: updatedTicket });
});

// DELETE /api/tickets/:id - Delete ticket
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  await prisma.ticket.delete({ where: { id } });
  res.json({ message: 'Ticket deleted successfully' });
});

export default router;

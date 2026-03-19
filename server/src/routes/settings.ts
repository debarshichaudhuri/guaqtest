import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { verifyToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// ─── Review Config ────────────────────────────────────────────────────────────

// GET /api/settings/review-config - Get all review configs
router.get(
  '/review-config',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const configs = await prisma.reviewConfig.findMany();
    res.json({ configs });
  }
);

// PUT /api/settings/review-config - Upsert review config for a platform
router.put(
  '/review-config',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { platform, minRating, prefilledText, autoReplyEnabled, signature } =
      req.body;

    if (!platform) {
      res.status(400).json({ error: 'platform is required' });
      return;
    }

    const config = await prisma.reviewConfig.upsert({
      where: { platform },
      update: {
        ...(minRating !== undefined && { minRating: Number(minRating) }),
        ...(prefilledText !== undefined && { prefilledText }),
        ...(autoReplyEnabled !== undefined && { autoReplyEnabled }),
        ...(signature !== undefined && { signature }),
      },
      create: {
        platform,
        minRating: minRating !== undefined ? Number(minRating) : 4,
        prefilledText: prefilledText || '',
        autoReplyEnabled: autoReplyEnabled ?? false,
        signature: signature || '',
      },
    });

    res.json({ config });
  }
);

// ─── Branding Config ──────────────────────────────────────────────────────────

// GET /api/settings/branding - Get branding config
router.get(
  '/branding',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    let branding = await prisma.brandingConfig.findFirst();

    // Create default if none exists
    if (!branding) {
      branding = await prisma.brandingConfig.create({
        data: {
          hotelName: 'Country Inn & Suites by Radisson',
          appName: 'GuaqAI',
          primaryColor: '#6366f1',
        },
      });
    }

    res.json({ branding });
  }
);

// PUT /api/settings/branding - Update branding config
router.put(
  '/branding',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { hotelName, appName, logoUrl, primaryColor } = req.body;

    let branding = await prisma.brandingConfig.findFirst();

    if (branding) {
      branding = await prisma.brandingConfig.update({
        where: { id: branding.id },
        data: {
          ...(hotelName && { hotelName }),
          ...(appName && { appName }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(primaryColor && { primaryColor }),
        },
      });
    } else {
      branding = await prisma.brandingConfig.create({
        data: {
          hotelName: hotelName || 'Country Inn & Suites by Radisson',
          appName: appName || 'GuaqAI',
          logoUrl: logoUrl || null,
          primaryColor: primaryColor || '#6366f1',
        },
      });
    }

    res.json({ branding });
  }
);

// ─── Affiliate Contacts ───────────────────────────────────────────────────────

// GET /api/settings/affiliates - Get all affiliate contacts
router.get(
  '/affiliates',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const affiliates = await prisma.affiliateContact.findMany({
      orderBy: { category: 'asc' },
    });
    res.json({ affiliates });
  }
);

// POST /api/settings/affiliates - Create affiliate contact
router.post(
  '/affiliates',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { label, number, category } = req.body;

    if (!label || !number || !category) {
      res.status(400).json({ error: 'label, number, and category are required' });
      return;
    }

    const validCategories = ['Transport', 'Medical', 'Services', 'Other'];
    if (!validCategories.includes(category)) {
      res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
      return;
    }

    const affiliate = await prisma.affiliateContact.create({
      data: { label, number, category },
    });

    res.status(201).json({ affiliate });
  }
);

// PATCH /api/settings/affiliates/:id - Update affiliate contact
router.patch(
  '/affiliates/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { label, number, category } = req.body;

    const affiliate = await prisma.affiliateContact.findUnique({
      where: { id },
    });
    if (!affiliate) {
      res.status(404).json({ error: 'Affiliate contact not found' });
      return;
    }

    const validCategories = ['Transport', 'Medical', 'Services', 'Other'];
    if (category && !validCategories.includes(category)) {
      res.status(400).json({
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
      });
      return;
    }

    const updated = await prisma.affiliateContact.update({
      where: { id },
      data: {
        ...(label && { label }),
        ...(number && { number }),
        ...(category && { category }),
      },
    });

    res.json({ affiliate: updated });
  }
);

// DELETE /api/settings/affiliates/:id - Delete affiliate contact
router.delete(
  '/affiliates/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const affiliate = await prisma.affiliateContact.findUnique({
      where: { id },
    });
    if (!affiliate) {
      res.status(404).json({ error: 'Affiliate contact not found' });
      return;
    }

    await prisma.affiliateContact.delete({ where: { id } });
    res.json({ message: 'Affiliate contact deleted successfully' });
  }
);

// ─── System Accounts ──────────────────────────────────────────────────────────

// GET /api/settings/accounts - Get all system accounts (admin only)
router.get(
  '/accounts',
  requireAdmin,
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const accounts = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
        permissions: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ accounts });
  }
);

// POST /api/settings/accounts - Create system account (admin only)
router.post(
  '/accounts',
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { email, password, role, phone, permissions } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'email and password are required' });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'An account already exists with this email' });
      return;
    }

    const validRoles = ['admin', 'staff'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const account = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role || 'staff',
        phone: phone || null,
        permissions: permissions || [],
      },
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
        permissions: true,
        createdAt: true,
      },
    });

    res.status(201).json({ account });
  }
);

// PATCH /api/settings/accounts/:id - Update system account (admin only)
router.patch(
  '/accounts/:id',
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { email, password, role, phone, permissions } = req.body;

    const account = await prisma.user.findUnique({ where: { id } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    // Check email conflict
    if (email && email !== account.email) {
      const conflict = await prisma.user.findUnique({ where: { email } });
      if (conflict) {
        res.status(409).json({ error: 'Another account already uses this email' });
        return;
      }
    }

    const validRoles = ['admin', 'staff'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
      return;
    }

    let passwordHash: string | undefined;
    if (password) {
      passwordHash = await bcrypt.hash(password, 12);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(email && { email }),
        ...(passwordHash && { passwordHash }),
        ...(role && { role }),
        ...(phone !== undefined && { phone }),
        ...(permissions && { permissions }),
      },
      select: {
        id: true,
        email: true,
        role: true,
        phone: true,
        permissions: true,
        createdAt: true,
      },
    });

    res.json({ account: updated });
  }
);

// DELETE /api/settings/accounts/:id - Delete system account (admin only)
router.delete(
  '/accounts/:id',
  requireAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    // Prevent self-deletion
    if (req.user && req.user.id === id) {
      res.status(400).json({ error: 'Cannot delete your own account' });
      return;
    }

    const account = await prisma.user.findUnique({ where: { id } });
    if (!account) {
      res.status(404).json({ error: 'Account not found' });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Account deleted successfully' });
  }
);

// ─── Document Files ───────────────────────────────────────────────────────────

// GET /api/settings/documents - Get all document files
router.get(
  '/documents',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const documents = await prisma.documentFile.findMany({
      orderBy: { uploadDate: 'desc' },
    });
    res.json({ documents });
  }
);

// POST /api/settings/documents - Create document file record
router.post(
  '/documents',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { name, type, size, description } = req.body;

    if (!name || !type || !size || !description) {
      res.status(400).json({
        error: 'name, type, size, and description are required',
      });
      return;
    }

    const document = await prisma.documentFile.create({
      data: { name, type, size, description },
    });

    res.status(201).json({ document });
  }
);

// DELETE /api/settings/documents/:id - Delete document file
router.delete(
  '/documents/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;

    const document = await prisma.documentFile.findUnique({ where: { id } });
    if (!document) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    await prisma.documentFile.delete({ where: { id } });
    res.json({ message: 'Document deleted successfully' });
  }
);

export default router;

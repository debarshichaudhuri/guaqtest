import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { geminiService } from '../services/geminiService';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/reviews - Get all reviews
router.get('/', async (_req: AuthRequest, res: Response): Promise<void> => {
  const reviews = await prisma.review.findMany({
    orderBy: { date: 'desc' },
  });
  res.json({ reviews });
});

// GET /api/reviews/:id - Get review by ID
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  res.json({ review });
});

// PATCH /api/reviews/:id - Update review response and status
router.patch('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { response, status, rating, comment, guestName, platform } = req.body;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  const validStatuses = ['Pending', 'Replied'];
  if (status && !validStatuses.includes(status)) {
    res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    return;
  }

  const updated = await prisma.review.update({
    where: { id },
    data: {
      ...(response !== undefined && { response }),
      ...(status && { status }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(comment && { comment }),
      ...(guestName && { guestName }),
      ...(platform && { platform }),
    },
  });

  res.json({ review: updated });
});

// POST /api/reviews/:id/auto-reply - Generate AI reply for review
router.post(
  '/:id/auto-reply',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const { signature } = req.body;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) {
      res.status(404).json({ error: 'Review not found' });
      return;
    }

    // Get signature from settings if not provided in request
    let replySignature = signature;
    if (!replySignature) {
      const reviewConfig = await prisma.reviewConfig.findFirst({
        where: { platform: review.platform },
      });
      replySignature = reviewConfig?.signature || 'The Management Team';
    }

    const generatedReply = await geminiService.generateReviewReply(
      review.comment,
      review.rating,
      review.guestName,
      replySignature
    );

    // Update the review with the generated reply
    const updated = await prisma.review.update({
      where: { id },
      data: {
        response: generatedReply,
        status: 'Replied',
      },
    });

    res.json({
      review: updated,
      generatedReply,
    });
  }
);

// POST /api/reviews - Create a new review
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const { guestName, rating, date, platform, comment } = req.body;

  if (!guestName || rating === undefined || !date || !platform || !comment) {
    res.status(400).json({
      error: 'guestName, rating, date, platform, and comment are required',
    });
    return;
  }

  const validPlatforms = ['google', 'tripadvisor'];
  if (!validPlatforms.includes(platform)) {
    res.status(400).json({ error: `Invalid platform. Must be one of: ${validPlatforms.join(', ')}` });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' });
    return;
  }

  const review = await prisma.review.create({
    data: {
      guestName,
      rating: Number(rating),
      date,
      platform,
      comment,
      status: 'Pending',
    },
  });

  res.status(201).json({ review });
});

// DELETE /api/reviews/:id - Delete a review
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  await prisma.review.delete({ where: { id } });
  res.json({ message: 'Review deleted successfully' });
});

export default router;

import { Router, Response } from 'express';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { geminiService } from '../services/geminiService';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// POST /api/ai/chat - Generate AI concierge bot response
router.post('/chat', async (req: AuthRequest, res: Response): Promise<void> => {
  const { history, message, stage, documents, affiliates } = req.body;

  if (!message) {
    res.status(400).json({ error: 'message is required' });
    return;
  }

  const conversationHistory = Array.isArray(history) ? history : [];
  const currentStage = stage || 'general';
  const knowledgeDocs = Array.isArray(documents) ? documents : [];
  const affiliateContacts = Array.isArray(affiliates) ? affiliates : [];

  const response = await geminiService.generateBotResponse(
    conversationHistory,
    message,
    currentStage,
    knowledgeDocs,
    affiliateContacts
  );

  res.json({ reply: response });
});

// POST /api/ai/review-reply - Generate AI reply for a review
router.post(
  '/review-reply',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { reviewText, rating, guestName, signature } = req.body;

    if (!reviewText || rating === undefined || !guestName) {
      res.status(400).json({
        error: 'reviewText, rating, and guestName are required',
      });
      return;
    }

    const reply = await geminiService.generateReviewReply(
      reviewText,
      Number(rating),
      guestName,
      signature || 'The Management Team'
    );

    res.json({ reply });
  }
);

// POST /api/ai/help - Generate help answer for platform queries
router.post('/help', async (req: AuthRequest, res: Response): Promise<void> => {
  const { query } = req.body;

  if (!query) {
    res.status(400).json({ error: 'query is required' });
    return;
  }

  const answer = await geminiService.generateHelpAnswer(query);
  res.json({ answer });
});

export default router;

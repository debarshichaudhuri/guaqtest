import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken, AuthRequest } from '../middleware/auth';
import { telegramService } from '../services/telegramService';

const router = Router();

// POST /api/telegram/webhook - Receive Telegram webhook (no auth, public endpoint)
router.post('/webhook', async (req: Request, res: Response): Promise<void> => {
  try {
    const update = req.body;

    // Acknowledge receipt immediately to prevent Telegram retries
    res.status(200).json({ ok: true });

    // Process message asynchronously
    if (update.message && update.message.text) {
      const { chat, from, text } = update.message;
      const chatId = String(chat.id);
      const senderName =
        from
          ? [from.first_name, from.last_name].filter(Boolean).join(' ') ||
            from.username ||
            'Unknown'
          : 'Unknown';

      await telegramService.processIncomingMessage(chatId, senderName, text);
    }
  } catch (error) {
    console.error('Telegram webhook error:', error);
  }
});

// All routes below require authentication
router.use(verifyToken);

// GET /api/telegram/logs - Get all Telegram chat logs
router.get(
  '/logs',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const logs = await prisma.telegramLog.findMany({
      orderBy: { sentAt: 'desc' },
      take: 200,
    });
    res.json({ logs });
  }
);

// GET /api/telegram/logs/:chatId - Get logs for specific chat
router.get(
  '/logs/:chatId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { chatId } = req.params;

    const logs = await prisma.telegramLog.findMany({
      where: { chatId },
      orderBy: { sentAt: 'asc' },
    });

    res.json({ logs });
  }
);

// GET /api/telegram/chats - Get unique chat IDs with latest message
router.get(
  '/chats',
  async (_req: AuthRequest, res: Response): Promise<void> => {
    const logs = await prisma.telegramLog.findMany({
      orderBy: { sentAt: 'desc' },
    });

    const chatMap = new Map<
      string,
      {
        chatId: string;
        senderName: string;
        lastMessage: string;
        lastTime: Date;
        messageCount: number;
      }
    >();

    for (const log of logs) {
      if (!chatMap.has(log.chatId)) {
        chatMap.set(log.chatId, {
          chatId: log.chatId,
          senderName: log.senderName,
          lastMessage: log.message,
          lastTime: log.sentAt,
          messageCount: 1,
        });
      } else {
        chatMap.get(log.chatId)!.messageCount += 1;
      }
    }

    res.json({ chats: Array.from(chatMap.values()) });
  }
);

// POST /api/telegram/send - Send a message to a specific chat (admin initiated)
router.post(
  '/send',
  async (req: AuthRequest, res: Response): Promise<void> => {
    const { chatId, text } = req.body;

    if (!chatId || !text) {
      res.status(400).json({ error: 'chatId and text are required' });
      return;
    }

    await telegramService.sendMessage(String(chatId), text);

    await prisma.telegramLog.create({
      data: {
        chatId: String(chatId),
        senderName: 'Hotel Staff',
        message: text,
        isBot: false,
      },
    });

    res.json({ message: 'Message sent successfully' });
  }
);

export default router;

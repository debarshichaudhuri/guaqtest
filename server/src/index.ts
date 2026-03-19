import 'express-async-errors';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables before importing services
dotenv.config();

import authRoutes from './routes/auth';
import ticketsRoutes from './routes/tickets';
import staffRoutes from './routes/staff';
import reviewsRoutes from './routes/reviews';
import alertsRoutes from './routes/alerts';
import aiRoutes from './routes/ai';
import telegramRoutes from './routes/telegram';
import settingsRoutes from './routes/settings';
import { telegramService } from './services/telegramService';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GuaqAI Server',
    version: '1.0.0',
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketsRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/settings', settingsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as Error & { code?: string; meta?: { field_name?: string } };
    if (prismaErr.code === 'P2002') {
      res.status(409).json({
        error: 'A record with this value already exists',
        field: prismaErr.meta?.field_name,
      });
      return;
    }
    if (prismaErr.code === 'P2025') {
      res.status(404).json({ error: 'Record not found' });
      return;
    }
  }

  res.status(500).json({
    error: 'Internal server error',
    message:
      process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
});

// ─── Server Startup ───────────────────────────────────────────────────────────

async function start(): Promise<void> {
  app.listen(PORT, () => {
    console.log(`\nGuaqAI Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: ${FRONTEND_URL}\n`);
    console.log('Available routes:');
    console.log('  GET  /api/health');
    console.log('  POST /api/auth/login');
    console.log('  POST /api/auth/register');
    console.log('  GET  /api/auth/me');
    console.log('  GET  /api/tickets');
    console.log('  GET  /api/staff');
    console.log('  GET  /api/reviews');
    console.log('  GET  /api/alerts');
    console.log('  POST /api/ai/chat');
    console.log('  POST /api/telegram/webhook');
    console.log('  GET  /api/settings/branding\n');
  });

  // Initialize Telegram webhook if configured
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;

  if (telegramToken && webhookUrl) {
    console.log('Setting up Telegram webhook...');
    await telegramService.setupWebhook(webhookUrl);
  } else {
    if (!telegramToken) {
      console.log('TELEGRAM_BOT_TOKEN not set - Telegram integration disabled');
    }
    if (!webhookUrl) {
      console.log(
        'WEBHOOK_URL not set - Telegram webhook not configured (set WEBHOOK_URL=https://your-domain.com)'
      );
    }
  }
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;

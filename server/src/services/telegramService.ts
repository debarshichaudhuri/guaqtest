import { Telegraf } from 'telegraf';
import type { AffiliateContact, DocumentFile } from '@prisma/client';
import prisma from '../lib/prisma';
import { geminiService } from './geminiService';

interface TelegramConversationMessage {
  sender: string;
  text: string;
}

class TelegramService {
  private bot: Telegraf | null = null;
  private conversationHistory: Map<string, TelegramConversationMessage[]> = new Map();

  private getBot(): Telegraf {
    if (!this.bot) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN environment variable is not set');
      }
      this.bot = new Telegraf(token);
    }
    return this.bot;
  }

  async setupWebhook(webhookUrl: string): Promise<void> {
    try {
      const bot = this.getBot();
      const fullUrl = webhookUrl.endsWith('/api/telegram/webhook')
        ? webhookUrl
        : `${webhookUrl}/api/telegram/webhook`;
      await bot.telegram.setWebhook(fullUrl);
      console.log(`✓ Telegram webhook set to: ${fullUrl}`);
    } catch (error) {
      console.error('Failed to set Telegram webhook:', error);
    }
  }

  async removeWebhook(): Promise<void> {
    try {
      const bot = this.getBot();
      await bot.telegram.deleteWebhook();
      console.log('Telegram webhook removed');
    } catch (error) {
      console.error('Failed to remove Telegram webhook:', error);
    }
  }

  async sendMessage(chatId: number | string, text: string): Promise<void> {
    try {
      const bot = this.getBot();
      await bot.telegram.sendMessage(chatId, text, { parse_mode: 'Markdown' });
    } catch {
      try {
        const bot = this.getBot();
        await bot.telegram.sendMessage(chatId, text);
      } catch (fallbackError) {
        console.error('Failed to send Telegram message:', fallbackError);
        throw new Error('Failed to send Telegram message');
      }
    }
  }

  async processIncomingMessage(
    chatId: number | string,
    senderName: string,
    text: string
  ): Promise<string> {
    const chatIdStr = String(chatId);

    try {
      // Load recent conversation history from DB
      const recentLogs = await prisma.telegramLog.findMany({
        where: { chatId: chatIdStr },
        orderBy: { sentAt: 'asc' },
        take: 20,
      });

      const history: TelegramConversationMessage[] = recentLogs.map((log) => ({
        sender: log.isBot ? 'bot' : 'user',
        text: log.message,
      }));

      // Fetch context data
      const [affiliates, documents] = await Promise.all([
        prisma.affiliateContact.findMany(),
        prisma.documentFile.findMany(),
      ]);

      // Log incoming user message first
      await prisma.telegramLog.create({
        data: {
          chatId: chatIdStr,
          senderName,
          message: text,
          isBot: false,
        },
      });

      // Generate AI response
      const reply = await geminiService.generateBotResponse(
        history,
        text,
        'telegram-chat',
        documents.map((d: DocumentFile) => ({
          id: d.id,
          name: d.name,
          description: d.description,
          type: d.type,
        })),
        affiliates.map((a: AffiliateContact) => ({
          id: a.id,
          label: a.label,
          number: a.number,
          category: a.category,
        }))
      );

      // Log bot reply
      await prisma.telegramLog.create({
        data: {
          chatId: chatIdStr,
          senderName: 'Guaq AI',
          message: reply,
          isBot: true,
        },
      });

      // Send to Telegram
      await this.sendMessage(chatIdStr, reply);

      // Update in-memory cache
      this.conversationHistory.set(chatIdStr, [
        ...history,
        { sender: 'user', text },
        { sender: 'bot', text: reply },
      ].slice(-40));

      return reply;
    } catch (error) {
      console.error(`Error processing Telegram message from ${chatIdStr}:`, error);

      const errorReply =
        "I'm sorry, I'm having trouble processing your request right now. Please contact the front desk for immediate assistance.";

      try {
        await prisma.telegramLog.create({
          data: {
            chatId: chatIdStr,
            senderName: 'Guaq AI',
            message: errorReply,
            isBot: true,
          },
        });
        await this.sendMessage(chatIdStr, errorReply);
      } catch (logError) {
        console.error('Failed to log error response:', logError);
      }

      return errorReply;
    }
  }

  async getBotInfo(): Promise<{ id: number; username: string; firstName: string } | null> {
    try {
      const bot = this.getBot();
      const me = await bot.telegram.getMe();
      return { id: me.id, username: me.username || '', firstName: me.first_name };
    } catch {
      return null;
    }
  }

  clearHistory(chatId: string): void {
    this.conversationHistory.delete(chatId);
  }
}

export const telegramService = new TelegramService();

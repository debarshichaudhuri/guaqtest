import { GoogleGenAI } from '@google/genai';

interface ConversationMessage {
  sender: string;
  text: string;
}

interface DocumentInfo {
  id?: string;
  name?: string;
  description?: string;
  type?: string;
}

interface AffiliateInfo {
  id?: string;
  label?: string;
  number?: string;
  category?: string;
}

class GeminiService {
  private client: GoogleGenAI | null = null;
  private readonly model = 'gemini-2.5-flash';

  private getClient(): GoogleGenAI {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY environment variable is not set');
      }
      this.client = new GoogleGenAI({ apiKey });
    }
    return this.client;
  }

  /**
   * Generate a response for the AI concierge bot
   */
  async generateBotResponse(
    history: ConversationMessage[],
    userMessage: string,
    stage: string,
    documents: DocumentInfo[],
    affiliates: AffiliateInfo[]
  ): Promise<string> {
    try {
      const client = this.getClient();

      // Build document summaries for context
      const docSummaries =
        documents.length > 0
          ? documents
              .map(
                (d) =>
                  `- ${d.name || 'Unnamed'}: ${d.description || 'No description'}`
              )
              .join('\n')
          : 'No documents available.';

      // Build affiliate contacts for context
      const affiliateSummaries =
        affiliates.length > 0
          ? affiliates
              .map(
                (a) =>
                  `- ${a.label || 'Unknown'} (${a.category || 'Other'}): ${a.number || 'N/A'}`
              )
              .join('\n')
          : 'No affiliate contacts available.';

      const systemPrompt = `You are Guaq, an AI Concierge for Country Inn & Suites by Radisson. You help hotel guests with their needs - room service, information, bookings, complaints. Be professional, warm, and concise. Always respond helpfully and in the language the guest uses.

Current stage: ${stage}

Available affiliate contacts:
${affiliateSummaries}

Knowledge base documents:
${docSummaries}

Guidelines:
- Keep responses under 150 words unless detailed information is explicitly requested
- Be empathetic and solution-oriented for complaints
- Provide specific contact numbers from affiliates when relevant
- If you cannot help with something, politely direct the guest to the front desk`;

      // Build conversation history for context
      const historyText =
        history.length > 0
          ? history
              .map(
                (msg) =>
                  `${msg.sender === 'bot' ? 'Assistant' : 'Guest'}: ${msg.text}`
              )
              .join('\n')
          : '';

      const fullPrompt = historyText
        ? `${systemPrompt}\n\nConversation history:\n${historyText}\n\nGuest: ${userMessage}\nAssistant:`
        : `${systemPrompt}\n\nGuest: ${userMessage}\nAssistant:`;

      const response = await client.models.generateContent({
        model: this.model,
        contents: fullPrompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error('No response text received from Gemini');
      }

      return text.trim();
    } catch (error) {
      console.error('Gemini generateBotResponse error:', error);
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error('Failed to generate bot response');
    }
  }

  /**
   * Generate a reply to a guest review
   */
  async generateReviewReply(
    reviewText: string,
    rating: number,
    guestName: string,
    signature: string
  ): Promise<string> {
    try {
      const client = this.getClient();

      const tone =
        rating <= 3 ? 'empathetic and apologetic' : 'warm and celebratory';
      const context =
        rating <= 3
          ? 'Address their concerns sincerely, apologize for any shortcomings, and outline how you will improve.'
          : 'Express genuine gratitude, highlight what made their stay special, and invite them to return.';

      const prompt = `You are the General Manager of Country Inn & Suites by Radisson. Write a personalized ${tone} reply to this ${rating}/5 star review from ${guestName}.

Review: "${reviewText}"

${context}

Requirements:
- Keep it under 150 words
- Be genuine and personal, not generic
- Sign off as: ${signature}
- Do not include any meta-commentary or instructions in your response
- Write only the reply text itself`;

      const response = await client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error('No response text received from Gemini');
      }

      return text.trim();
    } catch (error) {
      console.error('Gemini generateReviewReply error:', error);
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error('Failed to generate review reply');
    }
  }

  /**
   * Generate a help answer for platform-related queries
   */
  async generateHelpAnswer(query: string): Promise<string> {
    try {
      const client = this.getClient();

      const prompt = `You are a support agent for GuaqAI, a hospitality management platform. Answer this question about the platform: "${query}"

The GuaqAI platform includes the following modules:
- Dashboard: Overview with real-time alerts, KPIs (occupancy, satisfaction, revenue), and activity feed
- Live Inbox: Manage incoming guest messages and chat conversations in real-time
- Bot Simulator: Test and preview the AI concierge bot responses before going live
- Service Tickets: Kanban-style board for managing housekeeping, maintenance, F&B, front desk, and concierge requests
- Staff Roster: Manage staff schedules, shifts (Morning/Evening/Night), duty status, and contact information
- Guest Reviews: View and respond to Google and TripAdvisor reviews, with AI-powered auto-reply generation
- Campaigns: Create and manage marketing campaigns for guests
- Analytics: Heatmaps, competitor radar, and performance analytics
- Settings: Configure review settings, branding, affiliate contacts, system accounts, and knowledge base documents
- AI Chat: Powered by Google Gemini for intelligent, context-aware guest interactions
- Telegram Integration: Connect a Telegram bot to handle guest inquiries automatically

Provide a clear, helpful answer in 2-4 sentences. Be specific and actionable.`;

      const response = await client.models.generateContent({
        model: this.model,
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error('No response text received from Gemini');
      }

      return text.trim();
    } catch (error) {
      console.error('Gemini generateHelpAnswer error:', error);
      if (error instanceof Error) {
        throw new Error(`AI service error: ${error.message}`);
      }
      throw new Error('Failed to generate help answer');
    }
  }
}

export const geminiService = new GeminiService();

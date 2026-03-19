
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SimulationStage, DocumentFile, AffiliateContact } from "../types";

/**
 * ==============================================================================
 * 🏗️ ARCHITECTURE & MIGRATION NOTE (NEXT.JS SERVER ACTIONS)
 * ==============================================================================
 * 
 * CURRENT STATE (SPA/Vite):
 * We use `process.env.API_KEY` for the environment.
 * 
 * FUTURE STATE (Next.js App Router):
 * 1. Move logic to `app/actions/ai.ts` ('use server').
 * 2. Use `process.env.API_KEY`.
 * ==============================================================================
 */

// Initialize Gemini Client
const apiKey = (import.meta as any).env?.VITE_API_KEY || (typeof process !== 'undefined' && process.env?.API_KEY);
console.log("DEBUG: Legacy Hospitality Demo API Key Present:", !!apiKey);
const ai = new GoogleGenAI({ apiKey });

/**
 * Base System Instruction for the AI Concierge.
 */
const BASE_INSTRUCTION = `
You are 'Guaq', the AI Concierge for Country Inn & Suites by Radisson, Manipal.
Your tone is professional, warm, luxurious, and helpful. 
You are concise because you are chatting on WhatsApp.

KEY BEHAVIORS:
1. **Welcome**: If the user says "Hi" or "Arrived", welcome them, offer the WiFi password (CountryInn_Guest / 123456).
2. **Pulse Check**: If asked about pulse check, ask for a rating 1-5. 
   - 1-3: Apologize deeply.
   - 4-5: Celebrate and ask for Google Review.
3. **Pre-Arrival**: If stage is PRE_ARRIVAL, say "Greetings from Country Inn! We are excited to welcome you tomorrow. To speed up your check-in, could you please share a photo of your ID card?"
4. **Checkout**: If user mentions "checkout", "leaving", or "bill", acknowledge it and assure them the Front Desk is preparing their folio.
5. **Documents**: Use the provided 'Knowledge Base' to answer specific questions about amenities, menus, or rules.
6. **Contacts**: If a guest asks for a taxi, doctor, or external service, provide the contact from the 'Affiliate Contacts' list.

Do not use markdown formatting like bolding with asterisks too heavily.
`;

const APP_DOCUMENTATION_CONTEXT = `
SYSTEM DOCUMENTATION FOR HELP CENTER AI:
You are the Help Desk Assistant for "GuaqAI", a Hospitality Operations Platform.
Use the following context to answer user questions about how to use the software.

1. **Dashboard**:
   - **Overview**: Shows Active Guests, Sentiment Score (0-5), and Pending Alerts.
   - **Guest Retention**: Table showing VIP/Loyal guests with "Action" buttons to send offers.
   - **Tabs**: Has sub-views for 'Review Automation', 'Dept Performance', and 'Direct Bookings'.

2. **Live Inbox**:
   - Central chat interface for WhatsApp/Telegram.
   - **Features**: Filter by Online/Critical, Assign Staff to chat, "Upsell Co-Pilot" sidebar for offers.
   - **Handover**: Typing in the box overrides the AI Bot.

3. **Bot Simulator**:
   - Tool to test the AI configuration.
   - **Stages**: PRE_ARRIVAL (collects IDs), CHECK_IN (WiFi), PULSE_CHECK (Mid-stay rating), POST_STAY (Review generation), SERVICE_RECOVERY (Apology).
   - **Controls**: Use buttons on the left to trigger these specific stages manually.

4. **Service Tickets**:
   - Kanban board (New, In Progress, Resolved).
   - **Auto-Creation**: The AI Bot automatically creates tickets if a guest chats "Towel", "AC Broken", etc.
   - **Drag & Drop**: Move cards to update status.

5. **Staff Roster**:
   - Manage shifts (Morning/Evening/Night).
   - Toggle "On Duty" status.
   - **RBAC**: Admin can manage all; Staff view is restricted.

6. **Campaigns**:
   - Broadcast marketing messages.
   - **Filters**: Age, Spend, Interests, Location.
   - **Stats**: Tracks Read Rate and Click Rate.

7. **Analytics**:
   - **Overview**: Floor Heatmap (Red rooms = low sentiment).
   - **Competitors**: Radar chart comparing Service, Price, Cleanliness vs 3 competitors.
   - **Food & Bev**: "Menu Engineering" (BCG Matrix) identifies Profitable items. "AI Designer" generates new menu layouts.

8. **Settings**:
   - **Branding**: Change Logo and Hotel Name.
   - **Reviews**: Configure Google/TripAdvisor deep links and Auto-Reply signature.
   - **Knowledge Base**: Upload PDFs (Spa Menu, Rules) for the Bot to read.
   - **Security**: Create Staff accounts and toggle permissions (View/Hide specific pages).

9. **Reviews**:
   - List of Google/TripAdvisor reviews.
   - **Auto-Pilot**: Button to generate and post AI replies to all pending reviews at once.
`;

/**
 * Generates a response for the Chatbot Simulator.
 */
export const generateBotResponse = async (
  history: string[], 
  userMessage: string,
  stage: SimulationStage,
  documents: DocumentFile[] = [],
  affiliates: AffiliateContact[] = []
): Promise<string> => {
  try {
    const modelId = "gemini-2.5-flash"; 

    const docContext = documents.length > 0 
        ? `\n\n[AVAILABLE KNOWLEDGE BASE]:\n${documents.map(d => `- File: ${d.name} (${d.description})`).join('\n')}`
        : "";
    
    const affiliateContext = affiliates.length > 0
        ? `\n\n[AFFILIATE CONTACTS]:\n${affiliates.map(a => `- ${a.category}: ${a.label} (${a.number})`).join('\n')}`
        : "";

    let stageContext = "";
    if (stage === SimulationStage.PULSE_CHECK) {
      stageContext = " [SYSTEM: The user is responding to the 24hr pulse check rating request.]";
    } else if (stage === SimulationStage.SERVICE_RECOVERY) {
      stageContext = " [SYSTEM: The user is unhappy. Empathize deeply.]";
    } else if (stage === SimulationStage.PRE_ARRIVAL) {
        stageContext = " [SYSTEM: You are initiating a pre-arrival check-in conversation.]";
    }

    const finalSystemPrompt = `${BASE_INSTRUCTION}${docContext}${affiliateContext}`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelId,
      contents: [
        { role: 'user', parts: [{ text: `Conversation History:\n${history.join('\n')}\n\nUser: ${userMessage}${stageContext}` }] }
      ],
      config: {
        systemInstruction: finalSystemPrompt,
        temperature: 0.7, 
      }
    });

    return response.text || "I apologize, I'm having trouble connecting to the concierge service right now.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I'm having trouble connecting to the network right now. Please try again in a moment.";
  }
};

/**
 * Generates an automated reply for a Guest Review.
 */
export const generateReviewReply = async (reviewText: string, rating: number, guestName: string, signature: string): Promise<string> => {
    try {
        const prompt = `
        Write a short, professional response to a hotel guest review.
        Guest: ${guestName}
        Rating: ${rating}/5
        Review: "${reviewText}"
        
        Requirements:
        - Be warm and personalized.
        - Address specific points mentioned.
        - If negative, apologize and offer to connect offline.
        - Sign off with: ${signature}
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        return response.text || "Thank you for your feedback.";
    } catch (e) {
        console.error("Auto-reply Error:", e);
        return "Thank you for your review! We look forward to hosting you again.";
    }
}

/**
 * Generates a Help Center answer based on the query.
 */
export const generateHelpAnswer = async (query: string): Promise<string> => {
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: 'user', parts: [{ text: query }] }],
            config: {
                systemInstruction: APP_DOCUMENTATION_CONTEXT,
                temperature: 0.3,
            }
        });
        return response.text || "I couldn't find an answer to that in the documentation.";
    } catch (e) {
        console.error("Help AI Error:", e);
        return "I'm having trouble connecting to the knowledge base.";
    }
};

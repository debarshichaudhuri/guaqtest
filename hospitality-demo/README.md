# GUAQ - AI Hospitality Reputation & Operations System

This project is a high-fidelity prototype of a Hotel Operations Dashboard, featuring an AI Concierge Simulator, Ticket Management, Analytics, and Review Automation.

---

## 🚀 Tech Stack & Architecture

**Current Prototype (Client-Side):**
- **Framework:** Vite + React 18 (SPA)
- **Styling:** Tailwind CSS (Glassmorphism UI)
- **AI:** Google Gemini API (Direct Client Calls via `@google/genai`)
- **Charts:** Recharts
- **Icons:** Lucide React
- **State:** React `useState` (Lifted to `App.tsx`)

**Target Production Architecture (Server-Side):**
- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL (Supabase / Neon / AWS RDS)
- **ORM:** Prisma
- **Auth:** NextAuth.js or Clerk (RBAC: Admin vs Staff)
- **Storage:** AWS S3 (for Knowledge Base PDFs & Branding Assets)
- **AI:** Google Gemini API (Server Actions for security)
- **Background Jobs:** BullMQ / Trigger.dev (for Review Auto-Pilot)

---

## 🛠 Setup & Run (Prototype)

1.  **Environment Variables:**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_google_gemini_api_key_here
    ```
    *Note: Get your key from [Google AI Studio](https://aistudio.google.com/)*

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 🏗 Infrastructure Strategy: The "Low-Code" Backend

The project architecture leverages robust no-code/low-code tools to minimize custom backend code while maximizing capability.

### **1. AI Logic Layer (Dify)**
Instead of writing complex LangChain code in Python/JS, we use **Dify** (Self-hosted via Docker).
*   **Role**: Handles the Chatbot Logic, RAG (Retrieval Augmented Generation), and LLM context window.
*   **Integration**: The Next.js app sends user messages to the Dify API endpoint. Dify returns the AI response.
*   **Benefits**: Visually manage the prompt flow, swap models (Gemini/GPT-4), and manage Knowledge Base uploads without code deployments.

### **2. Business Automation Layer (n8n)**
Instead of writing custom Cron jobs or API glue code, we use **n8n**.
*   **Role**: Handles "Side Effects" and background tasks.
*   **Examples**:
    *   *New Ticket Created* -> n8n Webhook -> Send WhatsApp to Maintenance Staff.
    *   *Checkout Intent Detected* -> n8n Workflow -> Check PMS for outstanding bill -> Generate Payment Link.
*   **Integration**: Dify or Next.js calls n8n webhooks to trigger these actions.

### **3. Infrastructure Stack (Docker Compose)**
See `infrastructure/docker-compose.yml` for the full stack definition including:
*   **Postgres**: Shared database for App, n8n, and Dify.
*   **Redis**: Shared cache queue.
*   **MinIO**: S3-compatible storage for Knowledge Base files (kept on-premise/private).

---

## 🗄 Database Schema (Prisma)

Aligned with existing PostgreSQL structures (`clients`, `whatsapp_log`).

```prisma
// schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// 1. Multi-Tenant Clients (Properties)
model Client {
  client_id         Int      @id @default(autoincrement())
  client_name       String   @db.VarChar(100)
  sector            String   @db.VarChar(50) // e.g., "Hospitality"
  whatsapp_id       String   @unique @db.VarChar(50) // WhatsApp Business API ID
  dify_api_key      String   @db.VarChar(100) // Key to talk to specific Dify Agent
  dashboard_config  Json?    // Branding colors, Logo URL
  is_active         Boolean  @default(true)

  logs              WhatsAppLog[]
  users             User[]
}

// 2. WhatsApp Logs (Chat History)
model WhatsAppLog {
  log_id            Int      @id @default(autoincrement())
  client_id         Int
  client            Client   @relation(fields: [client_id], references: [client_id])
  
  phone             String   @db.VarChar(20)
  direction         String   @db.VarChar(10) // 'IN' or 'OUT'
  message_content   String   @db.Text
  sentiment_score   String?  @db.VarChar(20) // 'Positive', 'Negative'
  timestamp         DateTime @default(now())
}

// 3. Users (Staff/Admin)
model User {
  id            String   @id @default(uuid())
  client_id     Int
  client        Client   @relation(fields: [client_id], references: [client_id])
  
  email         String   @unique
  password_hash String
  name          String
  role          String   // 'admin', 'staff'
  phone         String?
}

// ... Additional models for Tickets, Reviews, etc. (See previous types.ts)
```

## 🔌 API Routes (Next.js App Router)

Implement these routes in `app/api/` to replace the mock functions.

1.  **AI Services**
    *   `POST /api/ai/chat` - Proxy to **Dify API**.
    *   `POST /api/ai/review-reply` - Generates draft reply via Gemini.

2.  **Operations**
    *   `GET /api/tickets` - Fetch filtered tickets.
    *   `POST /api/tickets` - Create new ticket -> Triggers **n8n Webhook**.

3.  **Auth**
    *   `POST /api/auth/login` - Validates against `User` table.

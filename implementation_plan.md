# Implementation Plan: GuaqAI End-to-End Buildout

This document outlines the end-to-end implementation plan to transition the GuaqAI prototype from a mock, client-side application to a fully functional, production-ready full-stack application.

## User Review Required

> [!IMPORTANT]
> Please review the proposed architecture and tech stack choices below. Specifically, confirm if you prefer keeping the frontend as a Vite Single Page Application (SPA), which is what it currently is, or migrating it to Next.js App Router (as originally noted in the README). The plan below assumes keeping Vite for the frontend (to save migration overhead) and building a separate Node.js/Express backend, which perfectly fits the Vercel (Frontend) + Railway (Backend) deployment split you requested.

## Proposed Changes

### 1. Architecture Overview

- **Frontend (Deployed to Vercel)**: React 18 + Vite SPA, Tailwind CSS. We will replace all mock React states with actual API calls using fetch/axios.
- **Backend (Deployed to Railway/Render)**: Node.js + Express.js. This service will handle all database interactions, serve the REST API, and listen for Telegram webhooks.
- **Database (Hosted on Railway/Render)**: PostgreSQL with Prisma ORM.
- **AI Integration**: Google Gemini API via `@google/genai` (Moved to the backend for secure API key access; no keys exposed on the client).
- **Messaging (Replaces WhatsApp)**: Telegram Bot API using webhooks to handle real-time messaging with guests/staff.

---

### 2. Backend Implementation (Railway / Render)

We will initialize a new backend project (e.g., in a `server/` directory or a separate repository based on your preference).

#### [NEW] `server/package.json`
Setup Node.js, Express, Prisma, `@google/genai`, `telegraf` (or `node-telegram-bot-api`), `cors`, and `dotenv`.

#### [NEW] `server/prisma/schema.prisma`
Implement the database schema derived from the existing Types:
- `Client` / `Hotel` configurations.
- `User` (Staff / Admin authentication and RBAC).
- [Ticket](file:///c:/guaqtask/hospitality-demo/App.tsx#200-203) (Service tickets mapped to rooms and staff).
- [Review](file:///c:/guaqtask/hospitality-demo/services/geminiService.ts#146-175) (Guest reviews).
- `TelegramLog` (Replaces `WhatsAppLog` for chat history).

#### [NEW] `server/src/routes/`
- `auth.ts`: Authentication and JWT generation.
- `tickets.ts`: CRUD operations for service tickets.
- `staff.ts`: Fetching and managing staff lists.
- `reviews.ts`: Getting reviews and using Gemini to generate auto-replies.
- `ai.ts`: Routes for backend-to-Gemini interactions (Help Center context, Analytics insights).
- `telegram.ts`: Webhook endpoint for Telegram messages (interacting safely with the Gemini AI Concierge and storing logs).

#### [NEW] `server/src/services/telegramService.ts`
Manage the Telegram bot webhook initialization, message parsing, and sending replies securely triggered by Gemini logic.

#### [NEW] `server/src/services/geminiService.ts`
Migrated logic from the Vite frontend into the node backend, using the backend's environment variable for `API_KEY` to prevent client-side exposure.

---

### 3. Frontend Implementation (Vercel)

We will refactor the existing React web app to consume the new Express backend APIs.

#### [MODIFY] `src/App.tsx`
- Remove all local mock states (`initialStaffList`, `initialTickets`, `initialAlerts`, `initialReviews`, `initialAccounts`).
- Implement Context API or React Query (if acceptable) to fetch global state from the backend upon authentication.
- Update [handleLogin](file:///c:/guaqtask/hospitality-demo/App.tsx#179-183) to call the `/api/auth/login` endpoint.

#### [MODIFY] `src/services/api.ts`
- Create a central Axios/Fetch service layer for making HTTP requests to `process.env.VITE_BACKEND_URL`.

#### [DELETE] `src/services/geminiService.ts`
- Delete the local Gemini service script, as all LLM inferences (Live Simulator, Help Desk, Auto-reply) now route through the secured backend API.

#### [MODIFY] `src/components/LiveSimulator.tsx` & `src/components/Inbox.tsx`
- Refactor the Live Simulator and Inbox to poll (or via WebSockets) the backend for new Telegram messages rather than simulating them purely in React state.

---

### 4. Continuous Integration & Deployment

- **Frontend Deployment (Vercel)**: Link the frontend directory to Vercel. Set `VITE_BACKEND_URL` environment variable.
- **Backend Deployment (Railway / Render)**: Setup a Node application on Railway/Render. Provision a PostgreSQL addon database. 
- **Environment Variables Required**: `DATABASE_URL`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, `FRONTEND_URL` (for CORS).

## Verification Plan

### Automated/Unit Testing
Due to the speed of prototyping, extensive unit tests are currently omitted from the architecture, but we can verify the API:
- Add a basic test script (e.g., using Jest or Supertest) under `server/tests/` to verify critical endpoints (`/api/tickets`, `/api/auth/login`).
- Can be run via: `cd server && npm test`.

### Manual Testing
1. **Frontend to Backend Communication**: Deploy the backend to Railway locally or staging, run Vite locally with `VITE_BACKEND_URL=.../api`, and verify Dashboard loading tickets from DB.
2. **Telegram Bot Flow**: 
   - Add the provisioned Telegram Bot to a chat.
   - Send "Hi" from the Telegram app.
   - Verify the webhook hits the Railway backend, calls Gemini API, and replies back to the Telegram app.
   - Verify the chat transcript appears in the `Inbox` tab of our web Vercel frontend.
3. **Database**: Use Prisma Studio (`npx prisma studio`) to examine that users, tickets, and Telegram chat logs are correctly persisted.

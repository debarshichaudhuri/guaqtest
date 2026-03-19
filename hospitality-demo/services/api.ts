// Central API service - all HTTP requests to backend go through here
// Base URL from VITE_BACKEND_URL env var, fallback to http://localhost:3001/api

import {
  Ticket,
  StaffMember,
  Review,
  Alert,
  SystemAccount,
  ReviewConfig,
  BrandingConfig,
  AffiliateContact,
} from '../types';

const BASE_URL: string =
  (import.meta as any).env?.VITE_BACKEND_URL ?? 'http://localhost:3001/api';

const TOKEN_KEY = 'guaqai_token';

// ── Token helpers ──────────────────────────────────────────────────────────────

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function isConfigured(): boolean {
  return true;
}

// ── Core fetch wrapper ─────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (!skipAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.message) message = body.message;
      else if (body?.error) message = body.error;
    } catch {
      // ignore JSON parse errors – keep the status message
    }
    throw new Error(message);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}

// ── Auth ───────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  permissions: string[];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  return request<LoginResult>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    true
  );
}

export async function getMe(): Promise<AuthUser> {
  const data = await request<{ user: AuthUser }>('/auth/me');
  return data.user;
}

// ── Tickets ────────────────────────────────────────────────────────────────────

export async function getTickets(): Promise<Ticket[]> {
  const data = await request<{ tickets: Ticket[] }>('/tickets');
  return data.tickets;
}

export async function createTicket(
  ticket: Omit<Ticket, 'id' | 'createdAt'>
): Promise<Ticket> {
  const data = await request<{ ticket: Ticket }>('/tickets', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
  return data.ticket;
}

export async function updateTicket(
  id: string,
  data: Partial<Ticket>
): Promise<Ticket> {
  const result = await request<{ ticket: Ticket }>(`/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.ticket;
}

export async function deleteTicket(id: string): Promise<void> {
  return request<void>(`/tickets/${id}`, { method: 'DELETE' });
}

// ── Staff ──────────────────────────────────────────────────────────────────────

export async function getStaff(): Promise<StaffMember[]> {
  const data = await request<{ staff: StaffMember[] }>('/staff');
  return data.staff;
}

export async function createStaff(
  member: Omit<StaffMember, 'id'>
): Promise<StaffMember> {
  const data = await request<{ staff: StaffMember }>('/staff', {
    method: 'POST',
    body: JSON.stringify(member),
  });
  return data.staff;
}

export async function updateStaff(
  id: string,
  data: Partial<StaffMember>
): Promise<StaffMember> {
  const result = await request<{ staff: StaffMember }>(`/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.staff;
}

export async function deleteStaff(id: string): Promise<void> {
  return request<void>(`/staff/${id}`, { method: 'DELETE' });
}

// ── Reviews ────────────────────────────────────────────────────────────────────

export async function getReviews(): Promise<Review[]> {
  const data = await request<{ reviews: Review[] }>('/reviews');
  return data.reviews;
}

export async function updateReview(
  id: string,
  data: Partial<Review>
): Promise<Review> {
  const result = await request<{ review: Review }>(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.review;
}

export async function generateReviewReply(id: string): Promise<{ reply: string }> {
  const data = await request<{ review: Review; generatedReply: string }>(
    `/reviews/${id}/auto-reply`,
    { method: 'POST' }
  );
  return { reply: data.generatedReply };
}

// ── Alerts ─────────────────────────────────────────────────────────────────────

export async function getAlerts(): Promise<Alert[]> {
  const data = await request<{ alerts: Alert[] }>('/alerts');
  return data.alerts;
}

export async function createAlert(alert: Omit<Alert, 'id'>): Promise<Alert> {
  const data = await request<{ alert: Alert }>('/alerts', {
    method: 'POST',
    body: JSON.stringify(alert),
  });
  return data.alert;
}

export async function deleteAlert(id: number): Promise<void> {
  return request<void>(`/alerts/${id}`, { method: 'DELETE' });
}

// ── AI ─────────────────────────────────────────────────────────────────────────

export async function sendBotMessage(
  history: { sender: string; text: string }[],
  message: string,
  stage: string,
  documents: any[],
  affiliates: any[]
): Promise<{ reply: string }> {
  return request<{ reply: string }>('/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ history, message, stage, documents, affiliates }),
  });
}

export async function getHelpAnswer(query: string): Promise<{ answer: string }> {
  return request<{ answer: string }>('/ai/help', {
    method: 'POST',
    body: JSON.stringify({ query }),
  });
}

// ── Telegram ───────────────────────────────────────────────────────────────────

export async function getTelegramLogs(): Promise<any[]> {
  const data = await request<{ logs: any[] }>('/telegram/logs');
  return data.logs;
}

export async function getTelegramLogsByChatId(chatId: number): Promise<any[]> {
  const data = await request<{ logs: any[] }>(`/telegram/logs/${chatId}`);
  return data.logs;
}

// ── Settings ───────────────────────────────────────────────────────────────────

export async function getReviewConfig(): Promise<ReviewConfig> {
  // Backend returns { configs: [...] } — we take the first (google) config as the active one
  const data = await request<{ configs: any[] }>('/settings/review-config');
  const configs = data.configs ?? [];
  const active = configs[0] ?? {
    platform: 'google',
    minRating: 5,
    prefilledText: '',
    autoReplyEnabled: false,
    signature: 'The Management Team',
  };
  return active as ReviewConfig;
}

export async function updateReviewConfig(
  config: ReviewConfig
): Promise<ReviewConfig> {
  const data = await request<{ config: ReviewConfig }>('/settings/review-config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  return data.config;
}

export async function getBranding(): Promise<BrandingConfig> {
  const data = await request<{ branding: BrandingConfig }>('/settings/branding');
  return data.branding;
}

export async function updateBranding(
  config: BrandingConfig
): Promise<BrandingConfig> {
  const data = await request<{ branding: BrandingConfig }>('/settings/branding', {
    method: 'PUT',
    body: JSON.stringify(config),
  });
  return data.branding;
}

export async function getAffiliates(): Promise<AffiliateContact[]> {
  const data = await request<{ affiliates: AffiliateContact[] }>('/settings/affiliates');
  return data.affiliates;
}

export async function createAffiliate(
  affiliate: Omit<AffiliateContact, 'id'>
): Promise<AffiliateContact> {
  const data = await request<{ affiliate: AffiliateContact }>('/settings/affiliates', {
    method: 'POST',
    body: JSON.stringify(affiliate),
  });
  return data.affiliate;
}

export async function deleteAffiliate(id: string): Promise<void> {
  return request<void>(`/settings/affiliates/${id}`, { method: 'DELETE' });
}

export async function getAccounts(): Promise<SystemAccount[]> {
  const data = await request<{ accounts: SystemAccount[] }>('/settings/accounts');
  return data.accounts;
}

export async function createAccount(account: {
  email: string;
  password: string;
  role: string;
  permissions: string[];
}): Promise<SystemAccount> {
  const data = await request<{ account: SystemAccount }>('/settings/accounts', {
    method: 'POST',
    body: JSON.stringify(account),
  });
  return data.account;
}

export async function updateAccount(
  id: string,
  data: Partial<SystemAccount>
): Promise<SystemAccount> {
  const result = await request<{ account: SystemAccount }>(`/settings/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.account;
}

export async function deleteAccount(id: string): Promise<void> {
  return request<void>(`/settings/accounts/${id}`, { method: 'DELETE' });
}

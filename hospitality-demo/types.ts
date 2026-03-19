
/**
 * Data Models & Interfaces
 * 
 * This file defines the shape of data used across the application.
 * In the Next.js migration, these interfaces should align closely with the Prisma Schema (DB Models).
 */

export enum ChatSender {
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system'
}

/**
 * Represents a single message in the chat history.
 * DB Mapping: `whatsapp_log` table.
 */
export interface Message {
  id: string; // Maps to log_id
  sender: ChatSender;
  text: string; // Maps to message_content
  timestamp: Date;
  isMedia?: boolean;
  mediaUrl?: string;
  status?: 'sent' | 'delivered' | 'read';
  sentimentScore?: string; // e.g. "Positive", "Negative"
}

/**
 * Represents a Client (Hotel Property).
 * DB Mapping: `clients` table.
 */
export interface Client {
    client_id: number;
    client_name: string;
    sector: string;
    whatsapp_id: string;
    dify_api_key: string;
    dashboard_config: Record<string, any>; // JSONB
    is_active: boolean;
}

/**
 * Represents the detailed profile of a hotel guest.
 * DB Mapping: `Guest` table.
 */
export interface GuestProfile {
  id: number;
  name: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  phone: string;
  status: 'Checked In' | 'Checked Out' | 'Upcoming';
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  lastRating?: number;
  tags: string[]; // e.g., ["VIP", "Spa Lover"]
  loyaltyScore: number; // 0-100
  predictedNextVisit?: string;
}

export interface DepartmentStat {
  name: string;
  complaints: number;
  compliments: number;
  resolutionTime: number; // in minutes
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Active' | 'Draft' | 'Sent' | 'Scheduled';
  audienceSize: number;
  content: string;
  sentDate?: string;
  readRate?: number;
  clickRate?: number;
  revenue?: number;
}

export enum SimulationStage {
  IDLE = 'IDLE',
  PRE_ARRIVAL = 'PRE_ARRIVAL',
  CHECK_IN = 'CHECK_IN',
  PULSE_CHECK = 'PULSE_CHECK',
  POST_STAY = 'POST_STAY', 
  SERVICE_RECOVERY = 'SERVICE_RECOVERY',
  BOOKING = 'BOOKING'
}

export type ReviewPlatform = 'google' | 'tripadvisor';

export interface ReviewConfig {
  platform: ReviewPlatform;
  minRating: number;
  prefilledText: string;
  autoReplyEnabled: boolean;
  signature: string;
}

/**
 * Represents a Guest Review.
 * DB Mapping: `Review` table.
 * Note: `response` field is populated by the AI Auto-Pilot.
 */
export interface Review {
    id: string;
    guestName: string;
    rating: number; // 1-5
    date: string;
    platform: ReviewPlatform;
    comment: string;
    response?: string;
    status: 'Pending' | 'Replied';
}

/**
 * Represents a file in the Knowledge Base (e.g., PDF, Image).
 * DB Mapping: `Document` table.
 * In Production: 'id' maps to the S3 Object Key or DB ID.
 */
export interface DocumentFile {
    id: string;
    name: string;
    type: string;
    size: string;
    description: string; // Used for AI Context (RAG)
    uploadDate: Date;
}

export interface AffiliateContact {
    id: string;
    label: string;
    number: string;
    category: 'Transport' | 'Medical' | 'Services' | 'Other';
}

export interface BrandingConfig {
    hotelName: string;
    appName: string;
    logoUrl?: string; // Data URL or S3 URL
    primaryColor: string;
}

export type UserRole = 'admin' | 'staff';

export enum View {
  DASHBOARD = 'dashboard',
  SIMULATOR = 'simulator',
  INBOX = 'inbox',
  CAMPAIGNS = 'campaigns',
  SETTINGS = 'settings',
  ANALYTICS = 'analytics',
  TICKETS = 'tickets',
  STAFF = 'staff',
  REVIEWS = 'reviews',
  HELP = 'help'
}

// Map Views to User-Friendly Names for Permissions UI
export const ViewLabels: Record<View, string> = {
    [View.DASHBOARD]: 'Overview Dashboard',
    [View.INBOX]: 'Live Inbox',
    [View.SIMULATOR]: 'Bot Simulator',
    [View.TICKETS]: 'Service Tickets',
    [View.REVIEWS]: 'Guest Reviews',
    [View.STAFF]: 'Staff Roster',
    [View.CAMPAIGNS]: 'Campaigns',
    [View.ANALYTICS]: 'Analytics',
    [View.SETTINGS]: 'Settings',
    [View.HELP]: 'Help Center'
};

export interface CampaignFilter {
  ageRange: [number, number];
  minSpend: number;
  interests: string[];
  location: 'all' | 'local' | 'outstation' | 'international';
}

export enum DashboardTab {
  OVERVIEW = 'overview',
  REVIEWS = 'reviews',
  PERFORMANCE = 'performance',
  BOOKINGS = 'bookings'
}

export type TimeRange = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface AnalyticsData {
    retention: { stage: string; count: number }[];
    spending: { name: string; value: number; color: string }[];
    sentiment: { month: string; positive: number; negative: number }[];
    demographics: { region: string; value: number }[];
}

// Ticket System Types
export type TicketStatus = 'New' | 'In Progress' | 'Resolved';
export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';
export type TicketCategory = 'Housekeeping' | 'Maintenance' | 'F&B' | 'Front Desk' | 'Concierge';

/**
 * Represents an operational Service Ticket.
 * DB Mapping: `Ticket` table.
 */
export interface Ticket {
  id: string;
  roomId: string; // or Area name like "Rooftop Restaurant"
  guestName: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  assignedTo?: string; // Staff ID (Foreign Key)
}

export interface Alert {
    id: number;
    userId: number; // Linked to chat user or room
    type: 'critical' | 'warning' | 'info';
    msg: string;
    time: string;
}

// Analytics New Types
export interface CompetitorData {
  name: string;
  adr: number; // Average Daily Rate
  rating: number;
  occupancy: number;
  amenities: { name: string; score: number }[]; // Radar chart data
}

export interface FloorPlanNode {
  id: string;
  name: string;
  type: 'room' | 'amenity' | 'service';
  floor: number;
  sentimentScore: number; // 0-100
  issues: number;
}

// Staff & Roster Types
export type ShiftType = 'Morning' | 'Evening' | 'Night';
export type StaffRole = 'Manager' | 'Front Desk' | 'Housekeeping' | 'Maintenance' | 'Chef' | 'Bell Boy' | 'Valet' | 'Security';

/**
 * Represents a Staff Member (User) in the Roster.
 * DB Mapping: `User` table.
 */
export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  email: string;
  phone: string;
  currentShift: ShiftType;
  isOnDuty: boolean;
  avatarBg: string;
}

/**
 * Represents a System User Account with credentials and permissions.
 * DB Mapping: `User` table (Separate from Staff Roster for Auth purposes).
 */
export interface SystemAccount {
    id: string;
    email: string;
    role: UserRole;
    phone?: string;
    permissions: View[]; // List of Views this user can access
}

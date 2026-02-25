
export enum Channel {
  EMAIL = 'email',
  WHATSAPP = 'whatsapp',
  WEB_FORM = 'web_form'
}

export enum TicketStatus {
  OPEN = 'open',
  PROCESSING = 'processing',
  RESOLVED = 'resolved',
  ESCALATED = 'escalated',
  AWAITING_HUMAN = 'awaiting_human'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface Message {
  id: string;
  conversation_id: string;
  channel: Channel;
  direction: 'inbound' | 'outbound';
  role: 'customer' | 'agent' | 'system';
  content: string;
  created_at: string;
  sentiment_score?: number;
}

export interface Ticket {
  id: string;
  conversation_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  source_channel: Channel;
  subject: string;
  category: string;
  priority: Priority;
  status: TicketStatus;
  created_at: string;
  resolved_at?: string;
  resolution_notes?: string;
  ai_suggestions?: string[];
  messages: Message[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  metadata: Record<string, any>;
}

export interface Analytics {
  total_tickets: number;
  resolved_count: number;
  escalated_count: number;
  avg_sentiment: number;
  channel_distribution: Record<Channel, number>;
}

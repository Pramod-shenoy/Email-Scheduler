export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  googleId: string;
}

export interface EmailJobData {
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: Date;
  delayBetweenEmails: number;
  hourlyLimit: number;
  userId: string;
}

export interface EmailSendData {
  email: string;
  subject: string;
  body: string;
  emailJobId: string;
  emailSendId: string;
  attachments?: any[];
}

export interface RateLimitInfo {
  currentHour: string;
  emailsSentThisHour: number;
  maxEmailsPerHour: number;
  canSend: boolean;
  nextAvailableSlot?: Date;
}

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface ScheduleEmailRequest {
  subject: string;
  body: string;
  recipients: string[];
  scheduledAt: string;
  delayBetweenEmails?: number;
  hourlyLimit?: number;
}

import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: User;
}
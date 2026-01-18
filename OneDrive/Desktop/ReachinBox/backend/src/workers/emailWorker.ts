// Simple email worker for development (no BullMQ required)
import { emailService } from '../services/emailService';
import { rateLimitService } from '../services/rateLimitService';
import { prisma } from '../index';

const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '5');
const EMAIL_DELAY_MS = parseInt(process.env.EMAIL_DELAY_MS || '2000');

export async function startEmailWorker() {
  console.log(`🔄 Simple email worker started (development mode)`);
  console.log(`⚠️ Using in-memory job processing instead of BullMQ`);
  
  // Mock worker for development
  return {
    on: (event: string, callback: Function) => {
      // Mock event handler
    }
  };
}
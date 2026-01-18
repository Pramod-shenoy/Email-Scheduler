import redis from '../config/redis';
import { RateLimitInfo } from '../types';

class RateLimitService {
  private readonly maxEmailsPerHour: number;

  constructor() {
    this.maxEmailsPerHour = parseInt(process.env.MAX_EMAILS_PER_HOUR || '200');
  }

  /**
   * Get current hour window key (e.g., "2024-01-17-14")
   */
  private getCurrentHourKey(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    return `${year}-${month}-${day}-${hour}`;
  }

  /**
   * Get Redis key for email count tracking
   */
  private getCountKey(hourKey: string): string {
    return `email_count:${hourKey}`;
  }

  /**
   * Check if we can send an email in the current hour
   */
  async checkRateLimit(): Promise<RateLimitInfo> {
    const currentHour = this.getCurrentHourKey();
    const countKey = this.getCountKey(currentHour);
    
    const currentCount = await redis.get(countKey);
    const emailsSentThisHour = currentCount ? parseInt(currentCount) : 0;
    
    const canSend = emailsSentThisHour < this.maxEmailsPerHour;
    
    let nextAvailableSlot: Date | undefined;
    if (!canSend) {
      // Calculate next hour
      const now = new Date();
      nextAvailableSlot = new Date(now);
      nextAvailableSlot.setHours(now.getHours() + 1, 0, 0, 0);
    }

    return {
      currentHour,
      emailsSentThisHour,
      maxEmailsPerHour: this.maxEmailsPerHour,
      canSend,
      nextAvailableSlot,
    };
  }

  /**
   * Increment email count for current hour
   */
  async incrementEmailCount(): Promise<number> {
    const currentHour = this.getCurrentHourKey();
    const countKey = this.getCountKey(currentHour);
    
    // Use Redis pipeline for atomic operations
    const pipeline = redis.pipeline();
    pipeline.incr(countKey);
    pipeline.expire(countKey, 3600); // Expire after 1 hour
    
    const results = await pipeline.exec();
    const newCount = results?.[0]?.[1] as number;
    
    return newCount || 1;
  }

  /**
   * Get next available time slot considering rate limits
   */
  async getNextAvailableSlot(): Promise<Date> {
    const rateLimitInfo = await this.checkRateLimit();
    
    if (rateLimitInfo.canSend) {
      return new Date(); // Can send immediately
    }
    
    return rateLimitInfo.nextAvailableSlot || new Date(Date.now() + 3600000); // Next hour
  }

  /**
   * Calculate delay for a batch of emails considering rate limits
   */
  async calculateEmailDelays(
    emailCount: number, 
    delayBetweenEmails: number,
    startTime: Date = new Date()
  ): Promise<Date[]> {
    const delays: Date[] = [];
    let currentTime = new Date(startTime);
    
    for (let i = 0; i < emailCount; i++) {
      // Check if we need to move to next hour due to rate limits
      const currentHour = new Date(currentTime);
      const hourKey = `${currentHour.getFullYear()}-${String(currentHour.getMonth() + 1).padStart(2, '0')}-${String(currentHour.getDate()).padStart(2, '0')}-${String(currentHour.getHours()).padStart(2, '0')}`;
      const countKey = this.getCountKey(hourKey);
      const currentHourCount = await redis.get(countKey);
      const emailsInCurrentHour = currentHourCount ? parseInt(currentHourCount) : 0;
      
      // If we would exceed the hourly limit, move to next hour
      if (emailsInCurrentHour >= this.maxEmailsPerHour) {
        const nextHour = new Date(currentTime);
        nextHour.setHours(currentTime.getHours() + 1, 0, 0, 0);
        currentTime = nextHour;
      }
      
      delays.push(new Date(currentTime));
      
      // Add delay between emails
      currentTime = new Date(currentTime.getTime() + delayBetweenEmails);
    }
    
    return delays;
  }

  /**
   * Get current rate limit statistics
   */
  async getStats(): Promise<{ [hourKey: string]: number }> {
    const stats: { [hourKey: string]: number } = {};
    
    // Get stats for last 24 hours
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() - (i * 3600000));
      const year = hour.getFullYear();
      const month = String(hour.getMonth() + 1).padStart(2, '0');
      const day = String(hour.getDate()).padStart(2, '0');
      const hourStr = String(hour.getHours()).padStart(2, '0');
      const hourKey = `${year}-${month}-${day}-${hourStr}`;
      const countKey = this.getCountKey(hourKey);
      const count = await redis.get(countKey);
      stats[hourKey] = count ? parseInt(count) : 0;
    }
    
    return stats;
  }
}

export const rateLimitService = new RateLimitService();
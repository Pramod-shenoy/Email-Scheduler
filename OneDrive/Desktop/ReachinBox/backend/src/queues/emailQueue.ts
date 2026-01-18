// Simple in-memory job queue for development (no Redis required)
import { EmailSendData } from '../types';
import { prisma } from '../index';

interface Job {
  id: string;
  data: EmailSendData;
  delay: number;
  remove: () => Promise<void>;
}

class SimpleEmailQueue {
  private jobs: Job[] = [];
  private processing = false;

  async add(name: string, data: EmailSendData, options?: { delay?: number; jobId?: string }) {
    const job: Job = {
      id: options?.jobId || `job-${Date.now()}-${Math.random()}`,
      data,
      delay: options?.delay || 0,
      remove: async () => {
        const index = this.jobs.findIndex(j => j.id === job.id);
        if (index > -1) this.jobs.splice(index, 1);
      },
    };

    if (job.delay > 0) {
      setTimeout(() => {
        this.jobs.push(job);
        this.processJobs();
      }, job.delay);
    } else {
      this.jobs.push(job);
      this.processJobs();
    }

    console.log(`📧 Email job ${job.id} queued`);
    return job;
  }

  private async processJobs() {
    if (this.processing || this.jobs.length === 0) return;

    this.processing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift()!;
      console.log(`🔄 Processing job ${job.id}`);

      try {
        // Simulate sending email (1 sec delay)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update EmailSend status to SENT
        await prisma.emailSend.update({
          where: {
            id: job.data.emailSendId
          },
          data: {
            status: 'SENT',
            sentAt: new Date()
          }
        });

        // Update EmailJob stats (increment sent, assuming 1 recipient per queue job)
        const updatedJob = await prisma.emailJob.update({
          where: { id: job.data.emailJobId },
          data: {
            sentEmails: { increment: 1 }
          }
        });

        // Check if job is complete
        if (updatedJob.sentEmails + updatedJob.failedEmails >= updatedJob.totalEmails) {
          await prisma.emailJob.update({
            where: { id: job.data.emailJobId },
            data: { status: 'COMPLETED' }
          });
        }

        console.log(`✅ Job ${job.id} completed`);
      } catch (error) {
        console.error(`❌ Job ${job.id} failed:`, error);

        // Update to FAILED
        await prisma.emailSend.update({
          where: {
            id: job.data.emailSendId
          },
          data: {
            status: 'FAILED',
            error: (error as Error).message
          }
        });

        await prisma.emailJob.update({
          where: { id: job.data.emailJobId },
          data: {
            failedEmails: { increment: 1 }
          }
        });
      }
    }

    this.processing = false;
  }

  async getJobCounts() {
    return {
      waiting: this.jobs.length,
      active: this.processing ? 1 : 0,
      completed: 0,
      failed: 0,
      delayed: 0,
    };
  }

  async getJobs(types: string[]) {
    return this.jobs;
  }

  // Mock event methods for compatibility
  on(event: string, callback: Function) {
    // Mock implementation
  }
}

export const emailQueue = new SimpleEmailQueue();

console.log('⚠️ Using simple in-memory email queue for development');
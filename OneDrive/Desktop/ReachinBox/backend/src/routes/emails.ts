import { Router } from 'express';
import multer from 'multer';
import Papa from 'papaparse';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { emailQueue } from '../queues/emailQueue';
import { rateLimitService } from '../services/rateLimitService';
import { prisma } from '../index';
import { AuthenticatedRequest, ScheduleEmailRequest } from '../types';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation schemas
const scheduleEmailSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  recipients: z.array(z.string().email()).min(1, 'At least one recipient is required'),
  scheduledAt: z.string().datetime(),
  delayBetweenEmails: z.number().min(1000).optional().default(2000),
  hourlyLimit: z.number().min(1).optional().default(200),
});

// Schedule new emails
router.post('/schedule', authenticateToken, upload.array('attachments'), async (req: AuthenticatedRequest, res) => {
  try {
    // Parse recipients if string (FormData)
    let recipients: string | string[] = req.body.recipients;
    if (typeof recipients === 'string') {
      try {
        recipients = JSON.parse(recipients);
      } catch (e) {
        // Handle single email case or array like string
        recipients = [recipients];
      }
    }

    // Parse other numeric fields
    const delayBetweenEmails = req.body.delayBetweenEmails ? Number(req.body.delayBetweenEmails) : 2000;
    const hourlyLimit = req.body.hourlyLimit ? Number(req.body.hourlyLimit) : 200;

    const validatedData = scheduleEmailSchema.parse({
      ...req.body,
      recipients,
      delayBetweenEmails,
      hourlyLimit
    });

    const userId = req.user!.id;

    const scheduledAt = new Date(validatedData.scheduledAt);

    // Validate scheduled time is in the future
    // Relaxed validation: Allow past times for "instant" send
    /*
    if (scheduledAt <= new Date()) {
      return res.status(400).json({ error: 'Scheduled time must be in the future' });
    }
    */

    // Process attachments
    // Use type assertion to handle multer files attached to request
    const files = (req as any).files as Express.Multer.File[] || [];

    const attachments = files.map((f: any) => ({
      originalname: f.originalname,
      mimetype: f.mimetype,
      size: f.size,
      buffer: f.buffer.toString('base64')
    }));

    // Create email job in database
    const emailJob = await prisma.emailJob.create({
      data: {
        subject: validatedData.subject,
        body: validatedData.body,
        recipients: JSON.stringify(validatedData.recipients),
        scheduledAt,
        delayBetweenEmails: validatedData.delayBetweenEmails,
        hourlyLimit: validatedData.hourlyLimit,
        totalEmails: validatedData.recipients.length,
        attachments: JSON.stringify(attachments),
        userId,
      },
    });

    // Create individual email send records
    const emailSends = await Promise.all(
      validatedData.recipients.map(email =>
        prisma.emailSend.create({
          data: {
            email,
            emailJobId: emailJob.id,
          },
        })
      )
    );

    // Calculate delays (mock logic for demo)
    const emailDelays = validatedData.recipients.map((_, i) =>
      new Date(Date.now() + (i * delayBetweenEmails))
    );

    // Schedule jobs in BullMQ
    const bullJobs = await Promise.all(
      validatedData.recipients.map((email, index) =>
        emailQueue.add(
          'send-email',
          {
            email,
            subject: validatedData.subject,
            body: validatedData.body,
            emailJobId: emailJob.id,
            emailSendId: emailSends[index].id,
            attachments // Pass attachments to worker
          },
          {
            delay: Math.max(0, scheduledAt.getTime() - Date.now()) + (index * validatedData.delayBetweenEmails),
            jobId: `${emailJob.id}-${index}`,
          }
        )
      )
    );

    // Update job with Bull job ID (using first job as reference)
    await prisma.emailJob.update({
      where: { id: emailJob.id },
      data: { bullJobId: bullJobs[0].id },
    });

    res.status(201).json({
      message: 'Emails scheduled successfully',
      jobId: emailJob.id,
      totalEmails: validatedData.recipients.length,
      scheduledAt,
    });
  } catch (error) {
    console.error('Schedule email error:', error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }

    res.status(500).json({ error: 'Failed to schedule emails' });
  }
});

// Parse CSV file for email addresses
router.post('/parse-csv', authenticateToken, upload.single('file'), (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');

    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const emails: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // Extract emails from all columns
        results.data.forEach((row: any) => {
          Object.values(row).forEach((value: any) => {
            if (typeof value === 'string' && emailRegex.test(value.trim())) {
              const email = value.trim().toLowerCase();
              if (!emails.includes(email)) {
                emails.push(email);
              }
            }
          });
        });

        res.json({
          totalRows: results.data.length,
          emailsFound: emails.length,
          emails: emails.slice(0, 100), // Return first 100 for preview
          hasMore: emails.length > 100,
        });
      },
      error: (error: Error) => {
        console.error('CSV parse error:', error);
        res.status(400).json({ error: 'Failed to parse CSV file' });
      },
    });
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ error: 'Failed to process CSV file' });
  }
});

// Get scheduled emails
router.get('/scheduled', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const statuses = (req.query.statuses as string) || '';
    const offset = (page - 1) * limit;

    let statusFilter: any = { in: ['SCHEDULED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED'] };

    if (statuses) {
      statusFilter = { in: statuses.split(',') };
    } else if (status) {
      statusFilter = { equals: status };
    }

    const whereClause: any = {
      userId,
      status: statusFilter,
    };

    if (search) {
      whereClause.OR = [
        { subject: { contains: search } }, // Case insensitive by default in some DBs, or use mode: 'insensitive' if postgres
        { recipients: { contains: search } },
      ];
    }

    const [emailJobs, total] = await Promise.all([
      prisma.emailJob.findMany({
        where: whereClause,
        include: {
          emailSends: {
            select: {
              status: true,
            },
          },
        },
        orderBy: { scheduledAt: 'asc' },
        skip: offset,
        take: limit,
      }),
      prisma.emailJob.count({
        where: whereClause,
      }),
    ]);

    const formattedJobs = emailJobs.map(job => ({
      id: job.id,
      subject: job.subject,
      totalEmails: job.totalEmails,
      sentEmails: job.sentEmails,
      failedEmails: job.failedEmails,
      scheduledAt: job.scheduledAt,
      status: job.status,
      createdAt: job.createdAt,
      recipients: job.recipients,
    }));

    res.json({
      jobs: formattedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get scheduled emails error:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled emails' });
  }
});

// Get sent emails
router.get('/sent', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const status = (req.query.status as string) || '';
    const offset = (page - 1) * limit;

    const whereClause: any = {
      emailJob: {
        userId,
      },
      status: status ? { equals: status } : { in: ['SENT', 'FAILED'] },
    };

    if (search) {
      whereClause.OR = [
        { email: { contains: search } },
        { emailJob: { subject: { contains: search } } },
      ];
    }

    const [emailSends, total] = await Promise.all([
      prisma.emailSend.findMany({
        where: whereClause,
        include: {
          emailJob: {
            select: {
              subject: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.emailSend.count({
        where: whereClause,
      }),
    ]);

    const formattedSends = emailSends.map(send => ({
      id: send.id,
      email: send.email,
      subject: send.emailJob.subject,
      status: send.status,
      sentAt: send.sentAt,
      error: send.error,
    }));

    res.json({
      emails: formattedSends,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get sent emails error:', error);
    res.status(500).json({ error: 'Failed to fetch sent emails' });
  }
});

// Get queue statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.id;

    const [queueStats, rateLimitStats, scheduledCount, sentCount] = await Promise.all([
      emailQueue.getJobCounts(),
      rateLimitService.getStats(),
      prisma.emailJob.count({
        where: {
          userId,
          status: { in: ['SCHEDULED', 'PROCESSING'] },
        },
      }),
      prisma.emailSend.count({
        where: {
          emailJob: { userId },
          status: 'SENT',
        },
      }),
    ]);

    res.json({
      queue: queueStats,
      rateLimit: rateLimitStats,
      counts: {
        scheduled: scheduledCount,
        sent: sentCount,
      },
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Cancel scheduled job
router.delete('/:jobId', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { jobId } = req.params;
    const userId = req.user!.id;

    // Find the job
    const emailJob = await prisma.emailJob.findFirst({
      where: {
        id: jobId,
        userId,
        status: {
          in: ['SCHEDULED', 'PROCESSING'],
        },
      },
    });

    if (!emailJob) {
      return res.status(404).json({ error: 'Job not found or cannot be cancelled' });
    }

    // Cancel Bull jobs
    if (emailJob.bullJobId) {
      try {
        const jobs = await emailQueue.getJobs(['waiting', 'delayed']);
        const jobsToCancel = jobs.filter(job =>
          job.data.emailJobId === emailJob.id
        );

        await Promise.all(jobsToCancel.map(job => job.remove()));
      } catch (error) {
        console.error('Error cancelling Bull jobs:', error);
      }
    }

    // Update job status
    await prisma.emailJob.update({
      where: { id: jobId },
      data: { status: 'CANCELLED' },
    });

    res.json({ message: 'Job cancelled successfully' });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({ error: 'Failed to cancel job' });
  }
});

// Get single email job details
router.get('/job/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const emailJob = await prisma.emailJob.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!emailJob) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json(emailJob);
  } catch (error) {
    console.error('Get email job error:', error);
    res.status(500).json({ error: 'Failed to fetch email job' });
  }
});

// Get single sent email details
router.get('/send/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const emailSend = await prisma.emailSend.findFirst({
      where: {
        id,
        emailJob: {
          userId,
        },
      },
      include: {
        emailJob: true, // Include job to get body and attachments
      },
    });

    if (!emailSend) {
      return res.status(404).json({ error: 'Email not found' });
    }

    res.json(emailSend);
  } catch (error) {
    console.error('Get email send error:', error);
    res.status(500).json({ error: 'Failed to fetch email' });
  }
});

export { router as emailRoutes };
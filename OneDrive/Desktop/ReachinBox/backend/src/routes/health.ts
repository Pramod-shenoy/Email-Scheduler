import { Router } from 'express';
import { prisma } from '../index';
import redis from '../config/redis';
import { emailService } from '../services/emailService';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const checks = {
      database: false,
      redis: false,
      smtp: false,
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks.database = true;
    } catch (error) {
      console.error('Database health check failed:', error);
    }

    // Check Redis
    try {
      await redis.ping();
      checks.redis = true;
    } catch (error) {
      console.error('Redis health check failed:', error);
    }

    // Check SMTP
    try {
      checks.smtp = await emailService.verifyConnection();
    } catch (error) {
      console.error('SMTP health check failed:', error);
    }

    const isHealthy = checks.database && checks.redis && checks.smtp;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export { router as healthRoutes };
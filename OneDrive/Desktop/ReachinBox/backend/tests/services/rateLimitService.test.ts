import { rateLimitService } from '../../src/services/rateLimitService';

// Mock Redis
jest.mock('../../src/config/redis', () => ({
  get: jest.fn(),
  incr: jest.fn(),
  expire: jest.fn(),
  pipeline: jest.fn(() => ({
    incr: jest.fn(),
    expire: jest.fn(),
    exec: jest.fn().mockResolvedValue([[null, 1]]),
  })),
}));

describe('RateLimitService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkRateLimit', () => {
    it('should allow sending when under limit', async () => {
      const redis = require('../../src/config/redis');
      redis.get.mockResolvedValue('50'); // 50 emails sent this hour

      const result = await rateLimitService.checkRateLimit();

      expect(result.canSend).toBe(true);
      expect(result.emailsSentThisHour).toBe(50);
      expect(result.maxEmailsPerHour).toBe(200);
    });

    it('should deny sending when at limit', async () => {
      const redis = require('../../src/config/redis');
      redis.get.mockResolvedValue('200'); // 200 emails sent this hour (at limit)

      const result = await rateLimitService.checkRateLimit();

      expect(result.canSend).toBe(false);
      expect(result.emailsSentThisHour).toBe(200);
      expect(result.nextAvailableSlot).toBeDefined();
    });
  });

  describe('incrementEmailCount', () => {
    it('should increment email count', async () => {
      const result = await rateLimitService.incrementEmailCount();

      expect(result).toBe(1);
    });
  });
});
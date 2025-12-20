import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
import { prismaMock } from './helpers';

// Mock services
vi.mock('../src/services/ledger', () => ({
  createLedgerEntry: vi.fn().mockResolvedValue(true),
}));
vi.mock('../src/services/knock', () => ({
  notifyUser: vi.fn().mockResolvedValue(true),
}));
vi.mock('../src/services/ably', () => ({
  publishEvent: vi.fn().mockResolvedValue(true),
}));

describe('Billing Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockUser = {
    id: 'user1',
    email: 'fan@test.com',
    role: 'FAN',
    passwordHash: 'x',
    createdAt: new Date(),
    creator: null,
  };

  const token = signToken({ userId: mockUser.id });

  describe('POST /billing/subscribe', () => {
    it('should create a subscription', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.creatorProfile.findUnique.mockResolvedValue({
        id: 'creator1',
        userId: 'user2',
        status: 'APPROVED',
        isDisabled: false,
      } as any);

      prismaMock.subscription.upsert.mockResolvedValue({
        id: 'sub1',
        fanId: 'user1',
        creatorId: 'creator1',
        status: 'ACTIVE',
      } as any);

      const res = await request(app)
        .post('/billing/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send({ creatorId: 'creator1' });

      expect(res.status).toBe(200);
      expect(res.body.subscription).toHaveProperty('status', 'ACTIVE');
    });
  });
});

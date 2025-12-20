import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
import { notifyUser } from '../src/services/knock';
import { createLedgerEntry } from '../src/services/ledger';
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

    it('should create ledger entry and notify creator on subscription', async () => {
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

      await request(app)
        .post('/billing/subscribe')
        .set('Authorization', `Bearer ${token}`)
        .send({ creatorId: 'creator1' });

      expect(createLedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
        type: 'SUBSCRIPTION',
        amountCents: 1200,
        fanId: 'user1',
        creatorId: 'creator1',
      }));

      expect(notifyUser).toHaveBeenCalledWith('user2', 'subscription.new', expect.anything());
    });
  });

  describe('POST /billing/unlock', () => {
    it('should unlock PPV post', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.post.findUnique.mockResolvedValue({
        id: 'post1',
        creatorId: 'creator1',
        priceType: 'PPV',
        priceCents: 100,
        creator: { userId: 'user2' },
      } as any);

      prismaMock.ppvUnlock.findUnique.mockResolvedValue(null); // No existing unlock

      prismaMock.ppvUnlock.create.mockResolvedValue({
        id: 'unlock1',
        fanId: 'user1',
        postId: 'post1',
        priceCents: 100,
      } as any);

      const res = await request(app)
        .post('/billing/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({ postId: 'post1' });

      expect(res.status).toBe(200);
      expect(res.body.unlock).toHaveProperty('id', 'unlock1');
    });

    it('should create ledger entry and notify creator on PPV unlock', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.post.findUnique.mockResolvedValue({
        id: 'post1',
        creatorId: 'creator1',
        priceType: 'PPV',
        priceCents: 100,
        creator: { userId: 'user2' },
      } as any);

      prismaMock.ppvUnlock.findUnique.mockResolvedValue(null);

      prismaMock.ppvUnlock.create.mockResolvedValue({
        id: 'unlock1',
        fanId: 'user1',
        postId: 'post1',
        priceCents: 100,
      } as any);

      await request(app)
        .post('/billing/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({ postId: 'post1' });

      expect(createLedgerEntry).toHaveBeenCalledWith(expect.objectContaining({
        type: 'PPV',
        amountCents: 100,
        fanId: 'user1',
        creatorId: 'creator1',
        postId: 'post1',
      }));

      expect(notifyUser).toHaveBeenCalledWith('user2', 'ppv.unlock', expect.anything());
    });

    it('should fail to unlock non-PPV post', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.post.findUnique.mockResolvedValue({
        id: 'post1',
        creatorId: 'creator1',
        priceType: 'SUBSCRIBER', // Not PPV
        priceCents: 0,
        creator: { userId: 'user2' },
      } as any);

      const res = await request(app)
        .post('/billing/unlock')
        .set('Authorization', `Bearer ${token}`)
        .send({ postId: 'post1' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/post is not ppv/i);
    });
  });
});

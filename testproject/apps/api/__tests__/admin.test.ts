import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
import { notifyUser } from '../src/services/knock';
import { prismaMock } from './helpers';

// Mock services
vi.mock('../src/services/knock', () => ({
  notifyUser: vi.fn().mockResolvedValue(true),
}));

describe('Admin Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const adminUser = {
    id: 'admin1',
    email: 'admin@test.com',
    role: 'ADMIN',
    passwordHash: 'x',
    createdAt: new Date(),
    creator: null,
  };

  const fanUser = {
    id: 'fan1',
    email: 'fan@test.com',
    role: 'FAN',
    passwordHash: 'x',
    createdAt: new Date(),
    creator: null,
  };

  const adminToken = signToken({ userId: adminUser.id });
  const fanToken = signToken({ userId: fanUser.id });

  describe('GET /admin/creators', () => {
    it('should allow admin to access', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.creatorProfile.findMany.mockResolvedValue([]);

      const res = await request(app)
        .get('/admin/creators')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should deny non-admin', async () => {
      prismaMock.user.findUnique.mockResolvedValue(fanUser as any);

      const res = await request(app)
        .get('/admin/creators')
        .set('Authorization', `Bearer ${fanToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /admin/creators/:id/approve', () => {
    it('should approve creator and notify', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.creatorProfile.update.mockResolvedValue({
        id: 'creator1',
        userId: 'user2',
        status: 'APPROVED',
      } as any);

      const res = await request(app)
        .post('/admin/creators/creator1/approve')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.creator.status).toBe('APPROVED');
      expect(notifyUser).toHaveBeenCalledWith('user2', 'creator.approved', expect.anything());
    });
  });

  describe('POST /admin/creators/:id/reject', () => {
    it('should reject creator and notify', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.creatorProfile.update.mockResolvedValue({
        id: 'creator1',
        userId: 'user2',
        status: 'REJECTED',
      } as any);

      const res = await request(app)
        .post('/admin/creators/creator1/reject')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.creator.status).toBe('REJECTED');
      expect(notifyUser).toHaveBeenCalledWith('user2', 'creator.rejected', expect.anything());
    });
  });

  describe('POST /admin/creators/:id/disable', () => {
    it('should disable creator', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.creatorProfile.update.mockResolvedValue({
        id: 'creator1',
        isDisabled: true,
      } as any);

      const res = await request(app)
        .post('/admin/creators/creator1/disable')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.creator.isDisabled).toBe(true);
    });
  });

  describe('POST /admin/posts/:id/disable', () => {
    it('should disable post', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.post.update.mockResolvedValue({
        id: 'post1',
        isDisabled: true,
      } as any);

      const res = await request(app)
        .post('/admin/posts/post1/disable')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.post.isDisabled).toBe(true);
    });
  });

  describe('GET /admin/transactions', () => {
    it('should return ledger entries', async () => {
      prismaMock.user.findUnique.mockResolvedValue(adminUser as any);
      prismaMock.ledgerEntry.findMany.mockResolvedValue([
        { id: 'tx1', amountCents: 1000 } as any
      ]);

      const res = await request(app)
        .get('/admin/transactions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.entries).toHaveLength(1);
    });
  });
});

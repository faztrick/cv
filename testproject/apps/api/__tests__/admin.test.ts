import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
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
});

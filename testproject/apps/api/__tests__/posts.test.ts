import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
import { prismaMock } from './helpers';

describe('Posts Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockCreator = {
    id: 'creator1',
    userId: 'user1',
    displayName: 'Creator 1',
    status: 'APPROVED',
    isDisabled: false,
  };

  const mockPost = {
    id: 'post1',
    creatorId: 'creator1',
    title: 'Test Post',
    body: 'Content',
    priceType: 'FREE',
    priceCents: 0,
    isDisabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    creator: mockCreator,
    media: [{ id: 'media1', mimeType: 'image/png' }],
  };

  const mockUser = {
    id: 'user2',
    email: 'fan@test.com',
    role: 'FAN',
    creator: null,
  };

  describe('GET /posts', () => {
    it('should return FREE posts with media for unauthenticated users', async () => {
      prismaMock.post.findMany.mockResolvedValue([mockPost as any]);

      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(1);
      expect(res.body.posts[0].entitled).toBe(true);
      expect(res.body.posts[0].media).toHaveLength(1);
    });

    it('should hide media for SUBSCRIBER posts for unauthenticated users', async () => {
      const subPost = { ...mockPost, priceType: 'SUBSCRIBER', media: [{ id: 'media1', mimeType: 'image/png' }] };
      prismaMock.post.findMany.mockResolvedValue([subPost as any]);

      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts[0].entitled).toBe(false);
      expect(res.body.posts[0].media).toHaveLength(0);
    });

    it('should return SUBSCRIBER posts with media for subscribed users', async () => {
      const subPost = { ...mockPost, priceType: 'SUBSCRIBER', media: [{ id: 'media1', mimeType: 'image/png' }] };
      prismaMock.post.findMany.mockResolvedValue([subPost as any]);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findMany.mockResolvedValue([{ creatorId: 'creator1', status: 'ACTIVE' } as any]);
      prismaMock.ppvUnlock.findMany.mockResolvedValue([]);

      const token = signToken({ userId: mockUser.id });
      const res = await request(app).get('/posts').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.posts[0].entitled).toBe(true);
      expect(res.body.posts[0].media).toHaveLength(1);
    });

    it('should hide media for PPV posts for non-purchasers', async () => {
      const ppvPost = { ...mockPost, priceType: 'PPV', priceCents: 100, media: [{ id: 'media1', mimeType: 'image/png' }] };
      prismaMock.post.findMany.mockResolvedValue([ppvPost as any]);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.ppvUnlock.findMany.mockResolvedValue([]);

      const token = signToken({ userId: mockUser.id });
      const res = await request(app).get('/posts').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.posts[0].entitled).toBe(false);
      expect(res.body.posts[0].media).toHaveLength(0);
    });

    it('should return PPV posts with media for purchasers', async () => {
      const ppvPost = { ...mockPost, priceType: 'PPV', priceCents: 100, media: [{ id: 'media1', mimeType: 'image/png' }] };
      prismaMock.post.findMany.mockResolvedValue([ppvPost as any]);
      prismaMock.user.findUnique.mockResolvedValue(mockUser as any);
      prismaMock.subscription.findMany.mockResolvedValue([]);
      prismaMock.ppvUnlock.findMany.mockResolvedValue([{ postId: 'post1' } as any]);

      const token = signToken({ userId: mockUser.id });
      const res = await request(app).get('/posts').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.posts[0].entitled).toBe(true);
      expect(res.body.posts[0].media).toHaveLength(1);
    });

    it('should not return disabled posts', async () => {
      prismaMock.post.findMany.mockResolvedValue([]);

      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);
      expect(res.body.posts).toHaveLength(0);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ isDisabled: false })
      }));
    });

    it('should not return posts from disabled creators', async () => {
      prismaMock.post.findMany.mockResolvedValue([]);

      const res = await request(app).get('/posts');

      expect(res.status).toBe(200);

      expect(prismaMock.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ creator: { isDisabled: false } })
      }));
    });
  });
});

import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
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
  });
});

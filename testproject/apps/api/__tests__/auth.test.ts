import bcrypt from 'bcryptjs';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app } from '../src/index';
import { signToken } from '../src/lib/auth';
import { prismaMock } from './helpers';

describe('Auth Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new fan', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({
        id: '1',
        email: 'fan@test.com',
        passwordHash: 'hashed_password',
        role: 'FAN',
        createdAt: new Date(),
        creator: null,
      } as any);

      const res = await request(app).post('/auth/register').send({
        email: 'fan@test.com',
        password: 'password',
        role: 'FAN',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'fan@test.com');
      expect(res.body.user).toHaveProperty('role', 'FAN');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should register a new creator (and create a pending creator profile)', async () => {
      prismaMock.user.findUnique
        .mockResolvedValueOnce(null) // email uniqueness check
        .mockResolvedValueOnce({
          id: '2',
          email: 'creator@test.com',
          passwordHash: 'hashed_password',
          role: 'CREATOR',
          createdAt: new Date(),
          creator: {
            id: 'c1',
            userId: '2',
            displayName: 'creator',
            bio: null,
            status: 'PENDING',
            isDisabled: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        } as any); // refreshed user after profile creation

      prismaMock.user.create.mockResolvedValueOnce({
        id: '2',
        email: 'creator@test.com',
        passwordHash: 'hashed_password',
        role: 'CREATOR',
        createdAt: new Date(),
        creator: null,
      } as any);

      prismaMock.creatorProfile.create.mockResolvedValueOnce({
        id: 'c1',
        userId: '2',
        displayName: 'creator',
        bio: null,
        status: 'PENDING',
        isDisabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app).post('/auth/register').send({
        email: 'creator@test.com',
        password: 'password',
        role: 'CREATOR',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('role', 'CREATOR');
      expect(res.body.user.creator).toHaveProperty('status', 'PENDING');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'fan@test.com',
        passwordHash: hashedPassword,
        role: 'FAN',
        createdAt: new Date(),
        creator: null,
      } as any);

      const res = await request(app).post('/auth/login').send({
        email: 'fan@test.com',
        password: 'password',
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should fail with invalid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password', 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: '1',
        email: 'fan@test.com',
        passwordHash: hashedPassword,
        role: 'FAN',
        createdAt: new Date(),
        creator: null,
      } as any);

      const res = await request(app).post('/auth/login').send({
        email: 'fan@test.com',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with a valid token', async () => {
      const token = signToken({ userId: 'u1' });
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        email: 'fan@test.com',
        passwordHash: 'x',
        role: 'FAN',
        createdAt: new Date(),
        creator: null,
      } as any);

      const res = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('id', 'u1');
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid token', async () => {
      const res = await request(app).get('/auth/me').set('Authorization', 'Bearer invalid.token');
      expect(res.status).toBe(401);
    });
  });
});

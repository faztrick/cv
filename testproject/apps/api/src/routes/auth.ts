import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { signToken } from '../lib/auth';
import { requireAuth, AuthRequest } from '../middleware/auth';
import type { Role } from '@prisma/client';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['FAN', 'CREATOR']).optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

function sanitizeUser(user: any) {
  const { passwordHash, ...safe } = user;
  return safe;
}

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { email, password, role } = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const userRole = (role ?? 'FAN') as Role;
  let user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role: userRole
    },
    include: { creator: true }
  });

  if (userRole === 'CREATOR') {
    await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: email.split('@')[0],
        status: 'PENDING'
      }
    });
    const refreshed = await prisma.user.findUnique({
      where: { id: user.id },
      include: { creator: true }
    });
    if (refreshed) {
      user = refreshed;
    }
  }

  const token = signToken({ userId: user.id });
  return res.json({ token, user: sanitizeUser(user) });
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email }, include: { creator: true } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = signToken({ userId: user.id });
  return res.json({ token, user: sanitizeUser(user) });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.json({ user: sanitizeUser(req.user) });
});

export default router;

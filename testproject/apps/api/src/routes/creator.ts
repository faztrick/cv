import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

const applySchema = z.object({
  displayName: z.string().min(2),
  bio: z.string().optional()
});

router.post('/apply', requireAuth, async (req: AuthRequest, res) => {
  const parsed = applySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { displayName, bio } = parsed.data;
  const user = req.user!;

  const existing = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  if (existing) {
    return res.json({ creator: existing });
  }

  const creator = await prisma.creatorProfile.create({
    data: {
      userId: user.id,
      displayName,
      bio,
      status: 'PENDING'
    }
  });

  if (user.role !== 'CREATOR') {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'CREATOR' }
    });
  }

  return res.json({ creator });
});

router.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = req.user!;
  const creator = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  return res.json({ creator });
});

export default router;

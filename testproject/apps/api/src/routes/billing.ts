import { Router } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';
import { createLedgerEntry } from '../services/ledger';
import { notifyUser } from '../services/knock';
import { publishEvent } from '../services/ably';

const router = Router();

const subscribeSchema = z.object({
  creatorId: z.string().min(1)
});

const unlockSchema = z.object({
  postId: z.string().min(1)
});

const subscriptionPrice = Number(process.env.SUBSCRIPTION_PRICE_CENTS ?? 1200);

router.post('/subscribe', requireAuth, async (req: AuthRequest, res) => {
  const parsed = subscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { creatorId } = parsed.data;
  const creator = await prisma.creatorProfile.findUnique({ where: { id: creatorId } });
  if (!creator || creator.isDisabled || creator.status !== 'APPROVED') {
    return res.status(404).json({ error: 'Creator not found' });
  }

  const subscription = await prisma.subscription.upsert({
    where: { fanId_creatorId: { fanId: req.user!.id, creatorId } },
    update: { status: 'ACTIVE' },
    create: {
      fanId: req.user!.id,
      creatorId,
      status: 'ACTIVE'
    }
  });

  await createLedgerEntry({
    type: 'SUBSCRIPTION',
    amountCents: subscriptionPrice,
    fanId: req.user!.id,
    creatorId,
    metadata: { provider: 'mock-ccbill' }
  });

  await notifyUser(creator.userId, 'subscription.new', {
    fanId: req.user!.id,
    creatorId
  });

  await publishEvent('posts', 'subscription.created', {
    fanId: req.user!.id,
    creatorId
  });

  return res.json({ subscription });
});

router.post('/unlock', requireAuth, async (req: AuthRequest, res) => {
  const parsed = unlockSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { postId } = parsed.data;
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { creator: true }
  });
  if (!post || post.isDisabled || post.creator.isDisabled) {
    return res.status(404).json({ error: 'Post not found' });
  }
  if (post.priceType !== 'PPV') {
    return res.status(400).json({ error: 'Post is not PPV' });
  }

  const existing = await prisma.ppvUnlock.findUnique({
    where: { fanId_postId: { fanId: req.user!.id, postId } }
  });
  if (existing) {
    return res.json({ unlock: existing });
  }

  const unlock = await prisma.ppvUnlock.create({
    data: {
      fanId: req.user!.id,
      postId
    }
  });

  await createLedgerEntry({
    type: 'PPV',
    amountCents: post.priceCents,
    fanId: req.user!.id,
    creatorId: post.creatorId,
    postId: post.id,
    metadata: { provider: 'mock-ccbill' }
  });

  await notifyUser(post.creator.userId, 'ppv.unlock', {
    fanId: req.user!.id,
    postId: post.id
  });

  await publishEvent('posts', 'ppv.unlocked', {
    fanId: req.user!.id,
    postId: post.id
  });

  return res.json({ unlock });
});

export default router;

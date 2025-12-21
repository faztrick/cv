import crypto from 'crypto';
import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { AuthRequest, optionalAuth, requireApprovedCreator, requireAuth } from '../middleware/auth';
import { publishEvent } from '../services/ably';
import { uploadFile } from '../services/storage';

const router = Router();

// Use memory storage so we can write to Cloud Storage (or local fallback) ourselves.
const upload = multer({ storage: multer.memoryStorage() });

const createSchema = z.object({
  title: z.string().min(2),
  body: z.string().min(2),
  priceType: z.enum(['FREE', 'SUBSCRIBER', 'PPV']).default('SUBSCRIBER'),
  priceCents: z.coerce.number().int().min(0).default(0)
});

router.get('/', optionalAuth, async (req: AuthRequest, res) => {
  const user = req.user ?? null;
  const posts = await prisma.post.findMany({
    where: { isDisabled: false, creator: { isDisabled: false } },
    include: { media: true, creator: true },
    orderBy: { createdAt: 'desc' }
  });

  let subscriptionCreatorIds = new Set<string>();
  let unlockedPostIds = new Set<string>();
  if (user) {
    const [subs, unlocks] = await Promise.all([
      prisma.subscription.findMany({
        where: { fanId: user.id, status: 'ACTIVE' },
        select: { creatorId: true }
      }),
      prisma.ppvUnlock.findMany({
        where: { fanId: user.id },
        select: { postId: true }
      })
    ]);
    subscriptionCreatorIds = new Set(subs.map((s) => s.creatorId));
    unlockedPostIds = new Set(unlocks.map((u) => u.postId));
  }

  const response = posts.map((post) => {
    const isOwner = !!(user?.creator?.id === post.creatorId || user?.role === 'ADMIN');
    const entitled = Boolean(
      isOwner
        || post.priceType === 'FREE'
        || (user && post.priceType === 'SUBSCRIBER' && subscriptionCreatorIds.has(post.creatorId))
        || (user && post.priceType === 'PPV' && unlockedPostIds.has(post.id))
    );

    return {
      id: post.id,
      title: post.title,
      body: post.body,
      priceType: post.priceType,
      priceCents: post.priceCents,
      createdAt: post.createdAt,
      creator: {
        id: post.creator.id,
        displayName: post.creator.displayName,
        status: post.creator.status
      },
      entitled,
      media: entitled
        ? post.media.map((asset) => ({
            id: asset.id,
            mimeType: asset.mimeType
          }))
        : []
    };
  });

  return res.json({ posts: response });
});

router.get('/:id', optionalAuth, async (req: AuthRequest, res) => {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { media: true, creator: true }
  });
  if (!post || post.isDisabled || post.creator.isDisabled) {
    return res.status(404).json({ error: 'Not found' });
  }

  const user = req.user ?? null;
  let entitled = false;
  if (user) {
    if (user.role === 'ADMIN' || user.creator?.id === post.creatorId) {
      entitled = true;
    } else if (post.priceType === 'FREE') {
      entitled = true;
    } else if (post.priceType === 'SUBSCRIBER') {
      const sub = await prisma.subscription.findUnique({
        where: { fanId_creatorId: { fanId: user.id, creatorId: post.creatorId } }
      });
      entitled = sub?.status === 'ACTIVE';
    } else if (post.priceType === 'PPV') {
      const unlock = await prisma.ppvUnlock.findUnique({
        where: { fanId_postId: { fanId: user.id, postId: post.id } }
      });
      entitled = !!unlock;
    }
  } else if (post.priceType === 'FREE') {
    entitled = true;
  }

  return res.json({
    post: {
      id: post.id,
      title: post.title,
      body: post.body,
      priceType: post.priceType,
      priceCents: post.priceCents,
      createdAt: post.createdAt,
      creator: {
        id: post.creator.id,
        displayName: post.creator.displayName,
        status: post.creator.status
      },
      entitled,
      media: entitled
        ? post.media.map((asset) => ({
            id: asset.id,
            mimeType: asset.mimeType
          }))
        : []
    }
  });
});

router.post('/', requireAuth, requireApprovedCreator, upload.single('media'), async (req: AuthRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
  }
  const { title, body, priceType, priceCents } = parsed.data;
  const creator = req.user!.creator!;

  const post = await prisma.post.create({
    data: {
      creatorId: creator.id,
      title,
      body,
      priceType,
      priceCents
    }
  });

  if (req.file) {
    const storageKey = crypto.randomUUID();
    await uploadFile(storageKey, req.file.buffer, req.file.mimetype);

    await prisma.mediaAsset.create({
      data: {
        postId: post.id,
        storageKey,
        mimeType: req.file.mimetype
      }
    });
  }

  await publishEvent('posts', 'post.created', {
    postId: post.id,
    creatorId: creator.id,
    title: post.title
  });

  return res.status(201).json({ postId: post.id });
});

export default router;

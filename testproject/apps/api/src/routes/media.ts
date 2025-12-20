import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma';
import { verifyToken } from '../lib/auth';

const router = Router();
const uploadsDir = path.join(process.cwd(), 'uploads');

router.get('/:id', async (req, res) => {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: req.params.id },
    include: { post: { include: { creator: true } } }
  });
  if (!asset || asset.post.isDisabled || asset.post.creator.isDisabled) {
    return res.status(404).json({ error: 'Not found' });
  }

  let userId: string | null = null;
  const tokenFromHeader = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice('Bearer '.length)
    : null;
  const token = (req.query.token as string | undefined) ?? tokenFromHeader;
  if (token) {
    try {
      const payload = verifyToken(token);
      userId = payload.userId;
    } catch {
      userId = null;
    }
  }

  let entitled = asset.post.priceType === 'FREE';
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { creator: true }
    });
    if (user) {
      if (user.role === 'ADMIN' || user.creator?.id === asset.post.creatorId) {
        entitled = true;
      } else if (asset.post.priceType === 'SUBSCRIBER') {
        const sub = await prisma.subscription.findUnique({
          where: { fanId_creatorId: { fanId: user.id, creatorId: asset.post.creatorId } }
        });
        entitled = sub?.status === 'ACTIVE';
      } else if (asset.post.priceType === 'PPV') {
        const unlock = await prisma.ppvUnlock.findUnique({
          where: { fanId_postId: { fanId: user.id, postId: asset.post.id } }
        });
        entitled = !!unlock;
      }
    }
  }

  if (!entitled) {
    return res.status(403).json({ error: 'Not entitled' });
  }

  const filePath = path.join(uploadsDir, asset.storageKey);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Missing file' });
  }

  res.setHeader('Content-Type', asset.mimeType);
  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

export default router;

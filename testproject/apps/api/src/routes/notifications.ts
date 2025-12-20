import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, async (req: AuthRequest, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ notifications });
});

router.post('/:id/read', requireAuth, async (req: AuthRequest, res) => {
  const updated = await prisma.notification.update({
    where: { id: req.params.id },
    data: { readAt: new Date() }
  });
  return res.json({ notification: updated });
});

export default router;

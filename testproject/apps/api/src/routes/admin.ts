import { Router } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest, requireAuth, requireRole } from '../middleware/auth';
import { notifyUser } from '../services/knock';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    include: { creator: true }
  });
  return res.json({ users: users.map(({ passwordHash, ...rest }) => rest) });
});

router.get('/creators', async (_req, res) => {
  const creators = await prisma.creatorProfile.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });
  return res.json({
    creators: creators.map((creator) => ({
      id: creator.id,
      displayName: creator.displayName,
      status: creator.status,
      isDisabled: creator.isDisabled,
      user: { id: creator.user.id, email: creator.user.email }
    }))
  });
});

router.post('/creators/:id/approve', async (req: AuthRequest, res) => {
  const creator = await prisma.creatorProfile.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' }
  });
  await prisma.adminAction.create({
    data: {
      adminId: req.user!.id,
      action: 'approve_creator',
      targetType: 'creator',
      targetId: creator.id
    }
  });
  await notifyUser(creator.userId, 'creator.approved', { creatorId: creator.id });
  return res.json({ creator });
});

router.post('/creators/:id/reject', async (req: AuthRequest, res) => {
  const creator = await prisma.creatorProfile.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED' }
  });
  await prisma.adminAction.create({
    data: {
      adminId: req.user!.id,
      action: 'reject_creator',
      targetType: 'creator',
      targetId: creator.id
    }
  });
  await notifyUser(creator.userId, 'creator.rejected', { creatorId: creator.id });
  return res.json({ creator });
});

router.post('/creators/:id/disable', async (req: AuthRequest, res) => {
  const creator = await prisma.creatorProfile.update({
    where: { id: req.params.id },
    data: { isDisabled: true }
  });
  await prisma.adminAction.create({
    data: {
      adminId: req.user!.id,
      action: 'disable_creator',
      targetType: 'creator',
      targetId: creator.id
    }
  });
  return res.json({ creator });
});

router.post('/posts/:id/disable', async (req: AuthRequest, res) => {
  const post = await prisma.post.update({
    where: { id: req.params.id },
    data: { isDisabled: true }
  });
  await prisma.adminAction.create({
    data: {
      adminId: req.user!.id,
      action: 'disable_post',
      targetType: 'post',
      targetId: post.id
    }
  });
  return res.json({ post });
});

router.get('/transactions', async (_req, res) => {
  const entries = await prisma.ledgerEntry.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return res.json({ entries });
});

export default router;

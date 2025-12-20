import type { NextFunction, Response } from 'express';
import prisma from '../lib/prisma';
import { verifyToken } from '../lib/auth';
import type { User, CreatorProfile } from '@prisma/client';
import type { Request } from 'express';

export type AuthUser = User & { creator: CreatorProfile | null };

export interface AuthRequest extends Request {
  user?: AuthUser;
}

function getToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length);
  }
  return null;
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    return next();
  }
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { creator: true }
    });
    if (user) {
      req.user = user;
    }
  } catch {
    // ignore invalid token
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = getToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { creator: true }
    });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

export function requireRole(...roles: Array<User['role']>) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

export function requireApprovedCreator(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!req.user.creator) {
    return res.status(403).json({ error: 'Creator profile required' });
  }
  if (req.user.creator.isDisabled) {
    return res.status(403).json({ error: 'Creator disabled' });
  }
  if (req.user.creator.status !== 'APPROVED') {
    return res.status(403).json({ error: 'Creator not approved' });
  }
  return next();
}

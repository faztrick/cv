import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

export async function notifyUser(userId: string, type: string, payload: Prisma.InputJsonValue) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      payload
    }
  });
}

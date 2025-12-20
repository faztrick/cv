import prisma from '../lib/prisma';

export async function notifyUser(userId: string, type: string, payload: Record<string, unknown>) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      payload
    }
  });
}

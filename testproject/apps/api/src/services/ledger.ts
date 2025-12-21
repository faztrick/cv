import { Prisma, type LedgerType } from '@prisma/client';
import prisma from '../lib/prisma';

export async function createLedgerEntry(input: {
  type: LedgerType;
  amountCents: number;
  fanId?: string | null;
  creatorId?: string | null;
  postId?: string | null;
  metadata?: Prisma.InputJsonValue | null;
}) {
  return prisma.ledgerEntry.create({
    data: {
      type: input.type,
      amountCents: input.amountCents,
      fanId: input.fanId ?? null,
      creatorId: input.creatorId ?? null,
      postId: input.postId ?? null,
      metadata: input.metadata ?? undefined
    }
  });
}

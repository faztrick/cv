import { PrismaClient } from '@prisma/client';
import { DeepMockProxy } from 'vitest-mock-extended';
import prisma from '../src/lib/prisma';

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

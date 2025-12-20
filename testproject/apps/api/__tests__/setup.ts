import { PrismaClient } from '@prisma/client';
import { vi } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';

vi.mock('../src/lib/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

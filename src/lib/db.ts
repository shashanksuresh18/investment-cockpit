import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

function getDbUrl(): string {
  const raw =
    process.env.DATABASE_URL ??
    `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;
  return raw.startsWith('file:') ? raw : `file:${raw}`;
}

function createPrismaClient(): PrismaClient {
  const url = getDbUrl();
  const adapter = new PrismaLibSql({ url });
  return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

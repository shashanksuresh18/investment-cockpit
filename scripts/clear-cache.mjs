import { PrismaLibSql } from '@prisma/adapter-libsql';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const url = `file:${dbPath}`;

const adapter = new PrismaLibSql({ url });
const prisma = new PrismaClient({ adapter });

const pattern = process.argv[2] ?? '';

try {
  const result = await prisma.cockpitCache.deleteMany({
    where: pattern ? { companyId: { contains: pattern } } : {},
  });
  console.log(`Deleted ${result.count} cache row(s)${pattern ? ` matching "${pattern}"` : ' (all)'}`);
} finally {
  await prisma.$disconnect();
}

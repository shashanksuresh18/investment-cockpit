import path from 'path';
import { defineConfig } from 'prisma/config';

const dbUrl =
  process.env.DATABASE_URL ??
  `file:${path.join(process.cwd(), 'prisma', 'dev.db')}`;

export default defineConfig({
  schema: './prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
});

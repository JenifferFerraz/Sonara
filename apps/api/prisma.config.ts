import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join('src', 'database', 'prisma'),
  migrations: { path: path.join('src', 'database', 'prisma', 'migrations') },
});

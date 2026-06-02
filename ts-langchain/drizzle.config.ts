import type { Config } from 'drizzle-kit';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

export default {
  schema: './src/lib/db/schema',
  dialect: 'postgresql',
  out: './src/lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;

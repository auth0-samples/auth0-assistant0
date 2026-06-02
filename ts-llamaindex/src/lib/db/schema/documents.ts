import { sql } from 'drizzle-orm';
import { text, varchar, timestamp, pgTable, customType } from 'drizzle-orm/pg-core';
import { createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

import { nanoid } from '@/utils/nano-id';

const bytea = customType<{ data: Buffer; default: false }>({
  dataType() {
    return 'bytea';
  },
});

export const documents = pgTable('documents', {
  id: varchar('id', { length: 191 })
    .primaryKey()
    .$defaultFn(() => nanoid()),
  content: bytea('content').notNull(),
  fileName: varchar('file_name', { length: 300 }).notNull(),
  fileType: varchar('file_type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at')
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at')
    .notNull()
    .default(sql`now()`),
  userId: varchar('user_id', { length: 191 }).notNull(),
  userEmail: varchar('user_email', { length: 191 }).notNull(),
  sharedWith: varchar('shared_with', { length: 300 }).array(),
});

export const documentSchema = createSelectSchema(documents).extend({});

// Schema for documents - used to validate API requests
export const insertDocumentSchema = documentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  userEmail: true,
});

// Type for documents - used to type API request params and within Components
export type DocumentParams = z.infer<typeof documentSchema>;
export type NewDocumentParams = z.infer<typeof insertDocumentSchema>;

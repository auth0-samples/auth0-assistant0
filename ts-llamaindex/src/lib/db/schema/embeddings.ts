import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core';

import { documents } from './documents';
import { nanoid } from '@/utils/nano-id';

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    documentId: varchar('document_id', { length: 191 }).references(() => documents.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    fileName: varchar('file_name', { length: 300 }).notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull(),
  },
  (table) => [index('embeddingIndex').using('hnsw', table.embedding.op('vector_cosine_ops'))],
);

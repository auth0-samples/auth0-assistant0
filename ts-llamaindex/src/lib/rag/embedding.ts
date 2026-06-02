import { OpenAIEmbedding } from '@llamaindex/openai';
import { SentenceSplitter } from 'llamaindex';
import { desc, gt, sql, cosineDistance } from 'drizzle-orm';

import { db } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/embeddings';

const embeddingModel = new OpenAIEmbedding({
  model: 'text-embedding-3-small',
});

export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[]; content: string }>> => {
  const splitter = new SentenceSplitter({
    chunkSize: 100,
    chunkOverlap: 10,
    separator: '\n',
  });

  const chunks = splitter.splitText(value);
  const embeddings = await embeddingModel.getTextEmbeddings(chunks);

  return embeddings.map((embedding, i) => ({ content: chunks[i], embedding }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const embedding = await embeddingModel.getTextEmbedding(input);
  return embedding;
};

export const findRelevantContent = async (userQuery: string, limit = 4) => {
  const userQueryEmbedded = await generateEmbedding(userQuery);
  const similarity = sql<number>`1 - (${cosineDistance(embeddings.embedding, userQueryEmbedded)})`;
  const similarGuides = await db
    .select({ content: embeddings.content, similarity, documentId: embeddings.documentId })
    .from(embeddings)
    .where(gt(similarity, 0.5))
    .orderBy((t: any) => desc(t.similarity))
    .limit(limit);
  return similarGuides;
};

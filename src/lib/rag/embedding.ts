import { OpenAIEmbeddings } from '@langchain/openai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { desc, gt, sql, cosineDistance } from 'drizzle-orm';
import { PGVectorStore, DistanceStrategy } from '@langchain/community/vectorstores/pgvector';
import { Pool, PoolConfig } from 'pg';
import { URL } from 'url';

import { db } from '@/lib/db';
import { embeddings } from '@/lib/db/schema/embeddings';

const embeddingModel = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

export const generateEmbeddings = async (value: string): Promise<Array<{ embedding: number[]; content: string }>> => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 10,
  });

  const chunks = await splitter.createDocuments([value]);
  const embeddings = await embeddingModel.embedDocuments(chunks.map((chunk) => chunk.pageContent));

  return embeddings.map((embedding, i) => ({ content: chunks[i].pageContent, embedding }));
};

export const generateEmbedding = async (value: string): Promise<number[]> => {
  const input = value.replaceAll('\\n', ' ');
  const embedding = await embeddingModel.embedQuery(input);
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

const DATABASE_URL = process.env.DATABASE_URL!;
const dbUrl = new URL(DATABASE_URL);

const poolConfig: PoolConfig = {
  user: dbUrl.username,
  password: dbUrl.password,
  host: dbUrl.hostname,
  port: Number(dbUrl.port),
  database: dbUrl.pathname.substring(1),
};

const pool = new Pool(poolConfig);

// Embedding config
const config = {
  pool,
  tableName: 'embeddings',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'embedding',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
  distanceStrategy: 'cosine' as DistanceStrategy,
};

let vectorStore: PGVectorStore | null = null;

const storeClientPropertyName = `__prevent-name-collision__vector_store`;
type GlobalThisWithVectorStoreClient = typeof globalThis & {
  [storeClientPropertyName]: any;
};

export const getVectorStore = async () => {
  if (vectorStore) {
    return vectorStore;
  }

  if (process.env.NODE_ENV === 'production') {
    vectorStore = await PGVectorStore.initialize(embeddingModel, config);
  } else {
    const newGlobalThis = globalThis as GlobalThisWithVectorStoreClient;
    if (!newGlobalThis[storeClientPropertyName]) {
      newGlobalThis[storeClientPropertyName] = await PGVectorStore.initialize(embeddingModel, config);
    }
    vectorStore = newGlobalThis[storeClientPropertyName];
  }

  return vectorStore;
};

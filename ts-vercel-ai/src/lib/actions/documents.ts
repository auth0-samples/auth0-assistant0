'use server';
import { desc, eq, arrayContains, or } from 'drizzle-orm';

import {
  NewDocumentParams,
  insertDocumentSchema,
  documents as documentsTable,
  DocumentParams,
} from '@/lib/db/schema/documents';
import { db } from '@/lib/db';
import { generateEmbeddings } from '@/lib/rag/embedding';
import { embeddings as embeddingsTable } from '@/lib/db/schema/embeddings';
import { addRelation, deleteRelation } from '@/lib/fga/fga';
import { auth0 } from '@/lib/auth0';

export const createDocument = async (input: NewDocumentParams, text: string) => {
  const session = await auth0.getSession();
  const user = session?.user!;
  const { content, fileName, fileType, sharedWith } = insertDocumentSchema.parse(input);

  const [document] = await db
    .insert(documentsTable)
    .values({ content, fileName, fileType, userId: user.sub, userEmail: user.email!, sharedWith })
    .returning();

  const embeddings = await generateEmbeddings(text);

  if (embeddings.length > 0) {
    await db.insert(embeddingsTable).values(
      embeddings.map((embedding) => ({
        fileName,
        documentId: document.id,
        ...embedding,
      })),
    );

    // write the relationship tuples to FGA
    await addRelation(user.email!, document.id);
  }

  return true;
};

export async function getDocumentsForUser(): Promise<Omit<DocumentParams, 'content'>[]> {
  const session = await auth0.getSession();
  const user = session?.user!;
  try {
    const userDocuments = await db
      .select({
        id: documentsTable.id,
        fileName: documentsTable.fileName,
        fileType: documentsTable.fileType,
        createdAt: documentsTable.createdAt,
        updatedAt: documentsTable.updatedAt,
        sharedWith: documentsTable.sharedWith,
        userId: documentsTable.userId,
        userEmail: documentsTable.userEmail,
      })
      .from(documentsTable)
      .where(or(eq(documentsTable.userId, user.sub), arrayContains(documentsTable.sharedWith, [user.email!])))
      .orderBy(desc(documentsTable.createdAt)); // Show newest first

    return userDocuments;
  } catch (error) {
    console.error('Error fetching documents for user:', error);
    return []; // Return empty array on error or handle appropriately
  }
}

export async function getDocumentContent(documentId: string): Promise<Buffer | null> {
  try {
    const document = await db
      .select({ content: documentsTable.content })
      .from(documentsTable)
      .where(eq(documentsTable.id, documentId));
    return document[0]?.content ?? null;
  } catch (error) {
    console.error('Error fetching document content:', error);
    return null;
  }
}

export async function shareDocument(documentId: string, sharedWith: string[]) {
  // get current shared with and merge
  const currentSharedWith = await db
    .select({ sharedWith: documentsTable.sharedWith })
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId));
  const mergedSharedWith = [...currentSharedWith[0]?.sharedWith, ...sharedWith];
  await db.update(documentsTable).set({ sharedWith: mergedSharedWith }).where(eq(documentsTable.id, documentId));
  // write the relationship tuples to FGA
  for (const user of sharedWith) {
    await addRelation(user, documentId, 'viewer');
  }
}

export async function deleteDocument(documentId: string) {
  const session = await auth0.getSession();
  const user = session?.user!;
  // delete the relationship tuples from FGA
  await deleteRelation(user.email!, documentId);
  const currentSharedWith = await db
    .select({ sharedWith: documentsTable.sharedWith })
    .from(documentsTable)
    .where(eq(documentsTable.id, documentId));
  // delete the relationship tuples from FGA
  for (const sUser of currentSharedWith[0]?.sharedWith) {
    await deleteRelation(sUser, documentId, 'viewer');
  }

  // delete the document from the database
  await db.delete(documentsTable).where(eq(documentsTable.id, documentId));
}

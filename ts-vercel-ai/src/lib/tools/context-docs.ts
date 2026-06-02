import { tool } from 'ai';
import { z } from 'zod';
import { FGAFilter } from '@auth0/ai';

import { findRelevantContent } from '@/lib/rag/embedding';
import { auth0 } from '../auth0';

export type DocumentWithScore = {
  content: string;
  documentId: string;
  similarity: number;
};

export const getContextDocumentsTool = tool({
  description:
    'Use the tool when user asks for documents or projects or anything that is stored in the knowledge base.',
  inputSchema: z.object({
    question: z.string().describe('the users question'),
  }),
  execute: async ({ question }) => {
    const session = await auth0.getSession();
    const user = session?.user;

    if (!user) {
      return 'There is no user logged in.';
    }

    const retriever = FGAFilter.create({
      buildQuery: (doc: DocumentWithScore) => ({
        user: `user:${user?.email}`,
        object: `doc:${doc.documentId}`,
        relation: 'can_view',
      }),
    });

    const documents = await findRelevantContent(question, 25);
    // filter docs based on FGA authorization
    const context = await retriever.filter(documents);
    return context;
  },
});

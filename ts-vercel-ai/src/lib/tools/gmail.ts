import { tool } from 'ai';
import { z } from 'zod';
import { GmailCreateDraft, GmailSearch } from '@langchain/community/tools/gmail';

import { getAccessToken, withGoogleConnection } from '../auth0-ai';

// Provide the access token to the Gmail tools
const gmailParams = {
  credentials: {
    accessToken: getAccessToken,
  },
};

const gmailSearch = new GmailSearch(gmailParams);

export const gmailSearchTool = withGoogleConnection(
  tool({
    description: gmailSearch.description,
    inputSchema: z.object({
      query: z.string(),
      maxResults: z.number().optional(),
      resource: z.enum(['messages', 'threads']).optional(),
    }),
    execute: async (args) => {
      const result = await gmailSearch._call(args);
      return result;
    },
  }),
);

const gmailDraft = new GmailCreateDraft(gmailParams);

export const gmailDraftTool = withGoogleConnection(
  tool({
    description: gmailDraft.description,
    inputSchema: z.object({
      message: z.string(),
      to: z.array(z.string()),
      subject: z.string(),
      cc: z.array(z.string()).optional(),
      bcc: z.array(z.string()).optional(),
    }),
    execute: async (args) => {
      const result = await gmailDraft._call(args);
      return result;
    },
  }),
);

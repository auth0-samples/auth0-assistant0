import { tool } from 'ai';
import { z } from 'zod';
import { SerpAPI } from '@langchain/community/tools/serpapi';

const serpApi = new SerpAPI();

// Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
export const serpApiTool = tool({
  description: serpApi.description,
  inputSchema: z.object({
    q: z.string(),
  }),
  execute: async ({ q }) => {
    return await serpApi._call(q);
  },
});

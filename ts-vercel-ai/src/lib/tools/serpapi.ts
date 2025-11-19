import { tool } from 'ai';
import { z } from 'zod';
import { SerpAPI } from '@langchain/community/tools/serpapi';

let toolInstance = null;

if (process.env.SERPAPI_API_KEY) {
  const serpApi = new SerpAPI();

  // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
  toolInstance = tool({
    description: serpApi.description,
    inputSchema: z.object({
      q: z.string(),
    }),
    execute: async ({ q }) => {
      return await serpApi._call(q);
    },
  });
}
export const serpApiTool = toolInstance;

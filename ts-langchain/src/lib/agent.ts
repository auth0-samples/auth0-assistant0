import { createReactAgent, ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { InMemoryStore, MemorySaver } from '@langchain/langgraph';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { GmailCreateDraft, GmailSearch } from '@langchain/community/tools/gmail';

import { withCalendar, withGmailRead, withGmailWrite, withAsyncAuthorization } from './auth0-ai';
import { getUserInfoTool } from './tools/user-info';
import { shopOnlineTool } from './tools/shop-online';
import { getContextDocumentsTool } from './tools/context-docs';
import { getCalendarEventsTool, createCalendarEventsTool } from './tools/google-calender';

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks. The current date and time is ${date}.`;

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
});

// Provide the access token to the Gmail tools
const gmailParams = {
  credentials: {
    accessToken: async () => {
      const { getAccessToken } = await import('./auth0-ai');
      return getAccessToken();
    },
  },
};

const tools = [
  new Calculator(),
  withGmailRead(new GmailSearch(gmailParams)),
  withGmailWrite(new GmailCreateDraft(gmailParams)),
  withCalendar(getCalendarEventsTool),
  withCalendar(createCalendarEventsTool),
  getUserInfoTool,
  withAsyncAuthorization(shopOnlineTool),
  getContextDocumentsTool,
];
// Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
if (process.env.SERPAPI_API_KEY) {
  tools.push(new SerpAPI());
}

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

/**
 * Use a prebuilt LangGraph agent.
 */
export const agent = createReactAgent({
  llm,
  tools: new ToolNode(tools, {
    // Error handler must be disabled in order to trigger interruptions from within tools.
    handleToolErrors: false,
  }),
  // Modify the stock prompt in the prebuilt agent.
  prompt: AGENT_SYSTEM_TEMPLATE,
  store,
  checkpointer,
});

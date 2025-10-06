import { createReactAgent, ToolNode } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';
import { InMemoryStore, MemorySaver } from '@langchain/langgraph';
import { Calculator } from '@langchain/community/tools/calculator';
import { SerpAPI } from '@langchain/community/tools/serpapi';
import { GmailCreateDraft, GmailSearch } from '@langchain/community/tools/gmail';
import { GoogleCalendarCreateTool, GoogleCalendarViewTool } from '@langchain/community/tools/google_calendar';

import { getAccessToken, withGoogleConnection, withAsyncAuthorization } from './auth0-ai';
import { getUserInfoTool } from './tools/user-info';
import { shopOnlineTool } from './tools/shop-online';
import { getContextDocumentsTool } from './tools/context-docs';
import { getCalendarEventsTool } from './tools/google-calender';

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks. Today is ${date}.`;

const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0,
});

// Provide the access token to the Gmail tools
const gmailParams = {
  credentials: {
    accessToken: getAccessToken,
  },
};

const googleCalendarParams = {
  credentials: { accessToken: getAccessToken, calendarId: 'primary' },
  model: llm,
};
const tools = [
  new Calculator(),
  // Requires process.env.SERPAPI_API_KEY to be set: https://serpapi.com/
  new SerpAPI(),
  withGoogleConnection(new GmailSearch(gmailParams)),
  withGoogleConnection(new GmailCreateDraft(gmailParams)),
  withGoogleConnection(new GoogleCalendarCreateTool(googleCalendarParams)),
  withGoogleConnection(new GoogleCalendarViewTool(googleCalendarParams)),
  withGoogleConnection(getCalendarEventsTool),
  getUserInfoTool,
  withAsyncAuthorization(shopOnlineTool),
  getContextDocumentsTool,
];

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

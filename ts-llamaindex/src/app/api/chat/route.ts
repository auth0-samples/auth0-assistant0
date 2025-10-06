import { NextRequest } from 'next/server';
import { createDataStreamResponse, LlamaIndexAdapter, Message, ToolExecutionError } from 'ai';
import { openai, OpenAIAgent } from '@llamaindex/openai';
import { ChatMessage } from 'llamaindex';
import { setAIContext } from '@auth0/ai-llamaindex';
import { withInterruptions } from '@auth0/ai-llamaindex/interrupts';
import { errorSerializer } from '@auth0/ai-vercel/interrupts';

import { serpApiTool } from '@/lib/tools/serpapi';
import { getUserInfoTool } from '@/lib/tools/user-info';
import { gmailDraftTool, gmailSearchTool } from '@/lib/tools/gmail';
import { getCalendarEventsTool } from '@/lib/tools/google-calender';
import { shopOnlineTool } from '@/lib/tools/shop-online';
import { getContextDocumentsTool } from '@/lib/tools/context-docs';

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks. Today is ${date}.`;

// Initialize agent once
let assistant: any = null;

async function initializeAgent(sanitizedMessages: Message[] = []) {
  if (assistant) return assistant;

  try {
    const tools = [
      serpApiTool,
      getUserInfoTool,
      gmailSearchTool,
      gmailDraftTool,
      getCalendarEventsTool,
      shopOnlineTool,
      getContextDocumentsTool,
    ];

    const assistant = new OpenAIAgent({
      llm: openai({ model: 'gpt-4.1' }),
      systemPrompt: AGENT_SYSTEM_TEMPLATE,
      tools,
      chatHistory: sanitizedMessages as ChatMessage[],
      verbose: true,
    });

    return assistant;
  } catch (error) {
    console.error('Failed to initialize agent:', error);
    throw error;
  }
}

/**
 * This handler initializes and calls an tool calling agent.
 */
export async function POST(req: NextRequest) {
  const { id, messages }: { id: string; messages: Message[] } = await req.json();

  const sanitizedMessages = sanitizeMessages(messages);

  setAIContext({ threadID: id });

  return createDataStreamResponse({
    execute: withInterruptions(
      async (dataStream) => {
        const assistant = await initializeAgent(sanitizedMessages);
        const stream = await assistant.chat({
          message: sanitizedMessages[sanitizedMessages.length - 1].content,
          stream: true,
        });

        LlamaIndexAdapter.mergeIntoDataStream(stream as any, { dataStream });
      },
      {
        messages: sanitizedMessages,
        errorType: ToolExecutionError,
      },
    ),
    onError: errorSerializer((err: any) => {
      console.log(err);
      return `An error occurred! ${err.message}`;
    }),
  });
}

// Remove incomplete tool calls in messages
const sanitizeMessages = (messages: Message[]) => {
  return messages.filter(
    (message) =>
      !(
        message.role === 'assistant' &&
        message.toolInvocations &&
        message.toolInvocations.length > 0 &&
        message.content === ''
      ),
  );
};

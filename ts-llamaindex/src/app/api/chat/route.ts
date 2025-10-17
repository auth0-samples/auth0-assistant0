import { NextRequest } from 'next/server';
import { createUIMessageStream, createUIMessageStreamResponse, AISDKError, UIMessage } from 'ai';
import { toUIMessageStream } from '@ai-sdk/llamaindex';
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

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. 
You have access to a set of tools. When using tools, you MUST provide valid JSON arguments. Always format tool call arguments as proper JSON objects.
For example, when calling shop_online tool, format like this:
{"product": "iPhone", "qty": 1, "priceLimit": 1000}
Use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks. Today is ${date}.`;

// Convert UIMessage array to ChatMessage array for LlamaIndex
function convertUIMessagesToChatMessages(messages: UIMessage[]): ChatMessage[] {
  return messages.map((message) => {
    // Extract text content from UIMessage
    let content = '';
    if (Array.isArray((message as any).parts)) {
      content = (message as any).parts
        .map((part: any) => {
          if (typeof part === 'string') return part;
          if (typeof part?.text === 'string') return part.text;
          if (typeof part?.content === 'string') return part.content;
          return '';
        })
        .join('');
    } else {
      content = (message as any).content ?? '';
    }

    return {
      role: message.role === 'user' ? 'user' : 'assistant',
      content,
    } as ChatMessage;
  });
}

// Get the text content from the latest message
function getLatestMessageText(messages: UIMessage[]): string {
  const lastMessage = messages[messages.length - 1];
  if (Array.isArray((lastMessage as any).parts)) {
    return (lastMessage as any).parts
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (typeof part?.text === 'string') return part.text;
        if (typeof part?.content === 'string') return part.content;
        return '';
      })
      .join('');
  }
  return (lastMessage as any).content ?? '';
}

// Initialize agent once
let assistant: any = null;

async function initializeAgent(messages: UIMessage[] = []) {
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
      chatHistory: convertUIMessagesToChatMessages(messages),
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
  const { id, messages }: { id: string; messages: UIMessage[] } = await req.json();


  setAIContext({ threadID: id });

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: withInterruptions(
      async ({ writer }) => {
        const assistant = await initializeAgent(messages);
        const stream = await assistant.chat({
          message: getLatestMessageText(messages),
          stream: true,
        });

        writer.merge(toUIMessageStream(stream));
      },
      {
        messages: messages,
        errorType: AISDKError,
      },
    ),
    onError: errorSerializer((err: any) => {
      console.log(err);
      return `An error occurred! ${err.message}`;
    }),
  });

  return createUIMessageStreamResponse({ stream });
}
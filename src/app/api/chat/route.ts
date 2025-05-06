import { NextRequest } from 'next/server';
import { streamText, Message, createDataStreamResponse, DataStreamWriter } from 'ai';
import { openai } from '@ai-sdk/openai';
import { setAIContext } from '@auth0/ai-vercel';
import { errorSerializer, withInterruptions } from '@auth0/ai-vercel/interrupts';

import { withGoogleConnection } from '@/lib/auth0-ai';
import { serpApiTool } from '@/lib/tools/serpapi';
import { gmailDraftTool, gmailSearchTool } from '@/lib/tools/gmail';
import { checkUsersCalendarTool } from '@/lib/tools/google-calender';

export const runtime = 'nodejs';

const AGENT_SYSTEM_TEMPLATE = `You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. You have access to a set of tools, use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks.`;

/**
 * This handler initializes and calls an tool calling agent.
 */
export async function POST(req: NextRequest) {
  const { id, messages }: { id: string; messages: Array<Message>; selectedChatModel: string } = await req.json();

  setAIContext({ threadID: id });

  const tools = {
    serpApiTool,
    gmailSearch: withGoogleConnection(gmailSearchTool),
    gmailDraft: withGoogleConnection(gmailDraftTool),
    checkUsersCalendar: withGoogleConnection(checkUsersCalendarTool),
  };

  return createDataStreamResponse({
    execute: withInterruptions(
      async (dataStream: DataStreamWriter) => {
        const result = streamText({
          model: openai('gpt-4o-mini'),
          system: AGENT_SYSTEM_TEMPLATE,
          messages,
          maxSteps: 5,
          tools,
        });

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      {
        messages,
        tools,
      },
    ),
    onError: errorSerializer((err: unknown) => {
      console.log(err);
      return 'Oops, an error occured!';
    }),
  });
}

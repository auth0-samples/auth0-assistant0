'use client';

import { useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { toast } from 'sonner';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { ArrowDown, ArrowUpIcon, LoaderCircle } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useStream } from '@langchain/langgraph-sdk/react';
import { type Message } from '@langchain/langgraph-sdk';

import { TokenVaultInterruptHandler } from '@/components/auth0-ai/TokenVault/TokenVaultInterruptHandler';
import { ChatMessageBubble } from '@/components/chat-message-bubble';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

function ChatMessages(props: {
  messages: Message[];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m, i) => {
        return <ChatMessageBubble key={m.id} message={m} aiEmoji={props.aiEmoji} allMessages={props.messages}/>;
      })}
    </div>
  );
}

function ScrollToBottom(props: { className?: string }) {
  const { isAtBottom, scrollToBottom } = useStickToBottomContext();

  if (isAtBottom) return null;
  return (
    <Button variant="outline" className={props.className} onClick={() => scrollToBottom()}>
      <ArrowDown className="w-4 h-4" />
      <span>Scroll to bottom</span>
    </Button>
  );
}

function ChatInput(props: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  loading?: boolean;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.stopPropagation();
        e.preventDefault();
        props.onSubmit(e);
      }}
      className={cn('flex w-full flex-col', props.className)}
    >
      <div className="border border-input bg-background rounded-lg flex flex-col gap-2 max-w-[768px] w-full mx-auto">
        <input
          value={props.value}
          placeholder={props.placeholder}
          onChange={props.onChange}
          className="border-none outline-none bg-transparent p-4"
          autoFocus
        />

        <div className="flex justify-between ml-4 mr-2 mb-2">
          <div className="flex gap-3">{props.children}</div>

          <Button
            className="rounded-full p-1.5 h-fit border dark:border-zinc-600"
            type="submit"
            disabled={props.loading}
          >
            {props.loading ? <LoaderCircle className="animate-spin" /> : <ArrowUpIcon size={14} />}
          </Button>
        </div>
      </div>
    </form>
  );
}

function StickyToBottomContent(props: {
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  const context = useStickToBottomContext();

  // scrollRef will also switch between overflow: unset to overflow: auto
  return (
    <div
      ref={context.scrollRef}
      style={{ width: '100%', height: '100%' }}
      className={cn('grid grid-rows-[1fr,auto]', props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const [threadId, setThreadId] = useQueryState('threadId');
  const [input, setInput] = useState('');
  const chat = useStream({
    apiUrl: props.endpoint,
    assistantId: 'agent',
    threadId,

    onThreadId: setThreadId,
    onError: (e: any) => {
      console.error('Error: ', e);
      toast.error(`Error while processing your request`, { description: e.message });
    },
  });

  function isChatLoading(): boolean {
    return chat.isLoading;
  }

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isChatLoading()) return;
    chat.submit(
      { messages: [{ type: 'human', content: input }] },
      {
        optimisticValues: (prev) => ({
          messages: [...((prev?.messages as []) ?? []), { type: 'human', content: input, id: 'temp' }],
        }),
      },
    );
    setInput('');
  }

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          chat.messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <>
              <ChatMessages
                aiEmoji={props.emoji}
                messages={chat.messages}
                emptyStateComponent={props.emptyStateComponent}
              />
              <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
                <TokenVaultInterruptHandler interrupt={chat.interrupt} onFinish={() => chat.submit(null)} />
              </div>
            </>
          )
        }
        footer={
          <div className="sticky bottom-8 px-2">
            <ScrollToBottom className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4" />
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onSubmit={sendMessage}
              loading={isChatLoading()}
              placeholder={props.placeholder ?? 'What can I help you with?'}
            ></ChatInput>
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
}

import { type UIMessage, DefaultChatTransport, generateId } from "ai";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect, useMemo, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { ArrowDown, ArrowUpIcon, LoaderCircle } from "lucide-react";
import { useQueryState } from "nuqs";
import { useInterruptions } from "@auth0/ai-vercel/react";

import { ChatMessageBubble } from "@/components/chat-message-bubble";
import { TokenVaultInterruptHandler } from "@/components/TokenVaultInterruptHandler";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function ChatMessages(props: {
  messages: UIMessage[];
  emptyStateComponent: ReactNode;
  aiEmoji?: string;
  className?: string;
}) {
  return (
    <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
      {props.messages.map((m) => {
        return <ChatMessageBubble key={m.id} message={m} aiEmoji={props.aiEmoji} />;
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
      className={cn("flex w-full flex-col", props.className)}
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

  return (
    <div
      ref={context.scrollRef}
      style={{ width: "100%", height: "100%" }}
      className={cn("grid grid-rows-[1fr,auto]", props.className)}
    >
      <div ref={context.contentRef} className={props.contentClassName}>
        {props.content}
      </div>

      {props.footer}
    </div>
  );
}

/**
 * Inner chat component with hooks. Mounted after thread messages are loaded.
 */
function ChatWindowInner(props: {
  endpoint: string;
  chatId: string;
  initialMessages: UIMessage[];
  onThreadId: (id: string) => void;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const { messages, sendMessage, status, toolInterrupt } = useInterruptions((handler) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useChat({
      id: props.chatId,
      messages: props.initialMessages,
      transport: new DefaultChatTransport({
        api: props.endpoint,
        credentials: "include",
      }),
      generateId,
      onError: handler((e: Error) => {
        console.error("Error: ", e);
        toast.error(`Error while processing your request`, { description: e.message });
      }),
    }),
  );

  const [input, setInput] = useState("");

  const isChatLoading = status === "streaming";

  // Persist thread ID to URL after first assistant response
  useEffect(() => {
    if (messages.some((m) => m.role === "assistant")) {
      props.onThreadId(props.chatId);
    }
  }, [messages, props.chatId, props.onThreadId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!input.trim() || isChatLoading) return;
    await sendMessage({ text: input });
    setInput("");
  }

  return (
    <StickToBottom>
      <StickyToBottomContent
        className="absolute inset-0"
        contentClassName="py-8 px-2"
        content={
          messages.length === 0 ? (
            <div>{props.emptyStateComponent}</div>
          ) : (
            <>
              <ChatMessages
                aiEmoji={props.emoji}
                messages={messages}
                emptyStateComponent={props.emptyStateComponent}
              />
              <div className="flex flex-col max-w-[768px] mx-auto pb-12 w-full">
                <TokenVaultInterruptHandler
                  interrupt={toolInterrupt}
                  auth={{
                    connectPath: "/api/auth/connect",
                    returnTo: new URL("/close", window.location.origin).toString(),
                  }}
                />
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
              onSubmit={onSubmit}
              loading={isChatLoading}
              placeholder={props.placeholder ?? "What can I help you with?"}
            ></ChatInput>
          </div>
        }
      ></StickyToBottomContent>
    </StickToBottom>
  );
}

/**
 * Outer wrapper that handles thread loading before mounting the chat hooks.
 */
export function ChatWindow(props: {
  endpoint: string;
  emptyStateComponent: ReactNode;
  placeholder?: string;
  emoji?: string;
}) {
  const [threadId, setThreadId] = useQueryState("threadId");
  const chatId = useMemo(() => threadId || generateId(), [threadId]);
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(!threadId);

  useEffect(() => {
    if (threadId) {
      fetch(`/api/agent/threads/${threadId}`, { credentials: "include" })
        .then((r) => r.json())
        .then((data) => {
          setInitialMessages(data.messages || []);
          setReady(true);
        })
        .catch(() => setReady(true));
    }
  }, [threadId]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoaderCircle className="animate-spin w-6 h-6 text-muted-foreground" />
      </div>
    );
  }

  return (
    <ChatWindowInner
      key={chatId}
      endpoint={props.endpoint}
      chatId={chatId}
      initialMessages={initialMessages}
      onThreadId={setThreadId}
      emptyStateComponent={props.emptyStateComponent}
      placeholder={props.placeholder}
      emoji={props.emoji}
    />
  );
}

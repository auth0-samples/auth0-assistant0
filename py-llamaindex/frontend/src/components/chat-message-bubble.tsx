import { type Message } from "@langchain/langgraph-sdk";

import { cn } from "@/lib/utils";
import { MemoizedMarkdown } from "./memoize-markdown";

export function ChatMessageBubble(props: {
  message: Message;
  aiEmoji?: string;
}) {
  return ["human", "ai"].includes(props.message.type) &&
    props.message.content.length > 0 ? (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
        props.message.type === "human"
          ? "bg-secondary text-secondary-foreground px-4 py-2"
          : null,
        props.message.type === "human" ? "ml-auto" : "mr-auto",
      )}
    >
      {props.message.type === "ai" && (
        <div className="mr-4 mt-1 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {props.aiEmoji}
        </div>
      )}
      <div className="chat-message-bubble whitespace-pre-wrap flex flex-col prose dark:prose-invert max-w-none">
        <MemoizedMarkdown
          content={props.message.content as string}
          id={props.message.id ?? ""}
        />
      </div>
    </div>
  ) : null;
}

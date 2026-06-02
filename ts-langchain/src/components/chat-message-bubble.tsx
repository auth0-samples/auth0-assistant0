import { type Message, type AIMessage } from '@langchain/langgraph-sdk';
import { Loader2, CheckCircle } from 'lucide-react';

import { cn } from '@/utils/cn';
import { MemoizedMarkdown } from './memoized-markdown';

function ToolCallDisplay({ 
  toolCall, 
  isRunning,
  messageContent 
}: { 
  toolCall: NonNullable<AIMessage['tool_calls']>[0]; 
  isRunning: boolean;
  messageContent?: string;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        {isRunning ? (
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
        ) : (
          <CheckCircle className="w-4 h-4 text-green-500" />
        )}
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {isRunning ? `Calling ${toolCall.name}...` : `Called ${toolCall.name}`}
        </span>
      </div>

      {/* Show tool arguments/input */}
      {toolCall.args && Object.keys(toolCall.args).length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Input:</div>
          <div className="bg-white dark:bg-gray-900 rounded px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-700">
            {JSON.stringify(toolCall.args, null, 2)}
          </div>
        </div>
      )}
      
      {/* Show tool result/output */}
      {messageContent && !isRunning && (
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Output:</div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded px-3 py-2 text-xs border border-green-200 dark:border-green-800">
            <span className="text-green-800 dark:text-green-200">
              {messageContent}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatMessageBubble(props: { message: Message; aiEmoji?: string; allMessages?: Message[] }) {
  const toolCalls = props.message.type === 'ai' ? props.message.tool_calls || [] : [];
  
  // Get message content as string
  const getMessageContent = (message: Message): string => {
    if (typeof message.content === 'string') {
      return message.content;
    }
    if (Array.isArray(message.content)) {
      return message.content
        .map(part => {
          if (typeof part === 'string') return part;
          if (typeof part === 'object' && 'text' in part) return part.text;
          return '';
        })
        .join('');
    }
    return '';
  };

  const content = getMessageContent(props.message);
  const hasContent = content.length > 0;
  const hasToolCalls = toolCalls.length > 0;
  
  // Check if tool calls have corresponding tool result messages
  const hasToolResults = hasToolCalls && props.allMessages && toolCalls.some(toolCall => 
    props.allMessages!.some(msg => 
      msg.type === 'tool' && 
      'tool_call_id' in msg && 
      msg.tool_call_id === toolCall.id
    )
  );
  
  // Simple logic: Running = tool calls exist but no tool result messages yet
  const isRunning = hasToolCalls && !hasToolResults;
  
  // Get tool result content for display
  const getToolResultContent = () => {
    if (!hasToolCalls || !props.allMessages) return '';
    
    for (const toolCall of toolCalls) {
      const toolResult = props.allMessages.find(msg => 
        msg.type === 'tool' && 
        'tool_call_id' in msg && 
        msg.tool_call_id === toolCall.id
      );
      if (toolResult) {
        return getMessageContent(toolResult);
      }
    }
    return '';
  };
  
  const toolResultContent = getToolResultContent();
  
  // Show tool calls if we have any
  const shouldShowToolCalls = hasToolCalls;
  
  if (!(['human', 'ai'].includes(props.message.type) && (hasContent || shouldShowToolCalls))) {
    return null;
  }

  return (
    <div
      className={cn(
        `rounded-[24px] max-w-[80%] mb-8 flex`,
        props.message.type === 'human' ? 'bg-secondary text-secondary-foreground px-4 py-2' : null,
        props.message.type === 'human' ? 'ml-auto' : 'mr-auto',
      )}
    >
      {props.message.type === 'ai' && (
        <div className="mr-4 mt-1 border bg-secondary -mt-2 rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {props.aiEmoji}
        </div>
      )}
      <div className="chat-message-bubble whitespace-pre-wrap flex flex-col prose dark:prose-invert max-w-none">
        {shouldShowToolCalls && (
          <div className="space-y-2 mb-3 not-prose">
            {toolCalls.map((toolCall) => (
              <ToolCallDisplay
                key={toolCall.id}
                toolCall={toolCall}
                isRunning={isRunning}
                messageContent={toolResultContent}
              />
            ))}
          </div>
        )}
        {hasContent && (
          <MemoizedMarkdown content={content} id={props.message.id ?? ''} />
        )}
      </div>
    </div>
  );
}
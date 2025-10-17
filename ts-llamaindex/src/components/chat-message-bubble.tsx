import { type UIMessage } from 'ai';
import { MemoizedMarkdown } from './memoized-markdown';
import { cn } from '@/utils/cn';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

function uiMessageToText(message: UIMessage): string {
  if (Array.isArray((message as any).parts)) {
    return (message as any).parts
      .map((p: any) => {
        if (typeof p === 'string') return p;
        if (typeof p?.text === 'string') return p.text;
        if (typeof p?.content === 'string') return p.content;
        return '';
      })
      .join('');
  }
  return (message as any).content ?? '';
}

function getToolCallsFromMessage(message: UIMessage): Array<{
  toolCallId: string;
  toolName: string;
  args: any;
  result?: any;
  status: 'pending' | 'complete' | 'error';
}> {
  const parts = (message as any).parts;
  if (!Array.isArray(parts)) return [];

  const toolCalls: Array<{
    toolCallId: string;
    toolName: string;
    args: any;
    result?: any;
    status: 'pending' | 'complete' | 'error';
  }> = [];

  parts.forEach((part: any) => {
    // Check if this part is a tool call (starts with "tool-")
    if (part?.type && part.type.startsWith('tool-') && part.toolCallId) {
      const toolName = part.type.replace('tool-', '');
      
      // Determine status based on available information
      let status: 'pending' | 'complete' | 'error' = 'pending';
      if (part.state === 'output-available' || part.output !== undefined) {
        status = 'complete';
      } else if (part.state === 'error' || part.isError) {
        status = 'error';
      }
      
      toolCalls.push({
        toolCallId: part.toolCallId,
        toolName,
        args: part.input || part.args || {},
        result: part.output || part.result,
        status
      });
    }
  });

  return toolCalls;
}

function ToolCallDisplay({ toolCall }: { 
  toolCall: {
    toolCallId: string;
    toolName: string;
    args: any;
    result?: any;
    status: 'pending' | 'complete' | 'error';
  }
}) {
  const { toolName, args, result, status } = toolCall;

  return (
    <div className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
      <div className="flex items-center gap-2 mb-2">
        {status === 'pending' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        {status === 'complete' && <CheckCircle className="w-4 h-4 text-green-500" />}
        {status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
        <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
          {status === 'pending' && `Calling ${toolName}...`}
          {status === 'complete' && `Called ${toolName}`}
          {status === 'error' && `Error calling ${toolName}`}
        </span>
      </div>

      {/* Show tool arguments/input */}
      {args && Object.keys(args).length > 0 && (
        <div className="mb-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Input:</div>
          <div className="bg-white dark:bg-gray-900 rounded px-3 py-2 text-xs font-mono border border-gray-200 dark:border-gray-700">
            {Object.entries(args).map(([key, value]) => (
              <div key={key} className="mb-1 last:mb-0">
                <span className="text-blue-600 dark:text-blue-400">{key}:</span>{' '}
                <span className="text-gray-800 dark:text-gray-200">
                  {typeof value === 'string' ? `"${value}"` : JSON.stringify(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show tool result/output */}
      {result !== undefined && (
        <div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-medium">Output:</div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded px-3 py-2 text-xs border border-green-200 dark:border-green-800">
            <span className="text-green-800 dark:text-green-200">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export function ChatMessageBubble(props: { message: UIMessage; aiEmoji?: string }) {
  const { message, aiEmoji } = props;
  const text = uiMessageToText(message);
  const toolCalls = getToolCallsFromMessage(message);

  return (
    <div
      className={cn(
        'rounded-[24px] max-w-[80%] mb-8 flex',
        message.role === 'user' ? 'bg-secondary text-secondary-foreground px-4 py-2' : null,
        message.role === 'user' ? 'ml-auto' : 'mr-auto',
      )}
    >
      {message.role !== 'user' && (
        <div className="mr-4 -mt-2 mt-1 border bg-secondary rounded-full w-10 h-10 flex-shrink-0 flex items-center justify-center">
          {aiEmoji}
        </div>
      )}

      <div className="chat-message-bubble whitespace-pre-wrap flex flex-col prose dark:prose-invert max-w-none">
        {/* Render tool calls if present */}
        {toolCalls.length > 0 && (
          <div className="mb-3">
            {toolCalls.map((toolCall, index) => (
              <ToolCallDisplay key={`${toolCall.toolCallId}-${index}`} toolCall={toolCall} />
            ))}
          </div>
        )}
        
        {/* Render text content if present */}
        {text && <MemoizedMarkdown content={text} id={message.id as any} />}
      </div>
    </div>
  );
}
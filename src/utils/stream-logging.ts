/**
 * Creates a TransformStream that logs tool calling data for debugging.
 * WARNING: Use only in development. As this might cause EventTarget memory leak.
 * This is a very crude implementation that logs tool calls as they are received
 * and merges them into a single object. Assumes the data is received in order.
 * This is similar to { concat } from '@langchain/core/utils/stream' which doesn't seem to work.
 */

export function logToolCallsInDevelopment(eventStream: ReadableStream) {
    // Log tool calling data only in development mode
    if (process.env.NODE_ENV !== 'development') {
        return eventStream;
    }
    // Keep track of merged tool calls by their index
    const mergedToolCalls = new Map<string, any>();
    let currentId: string | undefined;
    return eventStream.pipeThrough(
        new TransformStream({
            async transform(chunk, controller) {
                try {
                    const { event, data } = chunk;
                    if (event === 'on_chat_model_stream' && data.chunk.tool_call_chunks.length > 0) {
                        for (const { id, name, args } of data.chunk.tool_call_chunks) {
                            if (!!id && !mergedToolCalls.has(id)) {
                                currentId = id;
                                mergedToolCalls.set(id, { name, args });
                            }

                            // Only proceed if we have a valid currentId
                            if (!currentId) continue;

                            const mergedCall = mergedToolCalls.get(currentId);
                            // Append args
                            if (mergedCall && args) {
                                mergedCall.args = (mergedCall.args || '') + args;
                            }
                        }
                    }
                    // Pass the chunk through unchanged
                    controller.enqueue(chunk);
                } catch (error) {
                    console.error('Error processing tool call chunk:', error);
                    controller.enqueue(chunk); // Still pass through the chunk even if processing fails
                }
            },
            flush() {
                // Log the merged tool calls
                console.log('Tool calls state:', JSON.stringify(Object.fromEntries(mergedToolCalls), null, 2));
                // Clear the map when the stream is done
                mergedToolCalls.clear();
            },
        }),
    );
}

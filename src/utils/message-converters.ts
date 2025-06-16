import { Message } from 'ai';
import { AIMessage, BaseMessage, ChatMessage, HumanMessage } from '@langchain/core/messages';

export const convertVercelMessageToLangChainMessage = (message: Message) => {
    if (message.role === 'user') {
        return new HumanMessage(message.content);
    } else if (message.role === 'assistant') {
        return new AIMessage(message.content);
    } else {
        return new ChatMessage(message.content, message.role);
    }
};

export const convertLangChainMessageToVercelMessage = (message: BaseMessage) => {
    if (message.getType() === 'human') {
        return { content: message.content, role: 'user' };
    } else if (message.getType() === 'ai') {
        return {
            content: message.content,
            role: 'assistant',
            parts: (message as AIMessage).tool_calls,
        };
    } else if (message.getType() === 'tool') {
        return {
            content: message.content,
            role: 'system',
        };
    } else {
        return { content: message.content, role: message.getType() };
    }
};

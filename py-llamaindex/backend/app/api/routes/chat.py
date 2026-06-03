import json
import logging
import uuid
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from llama_index.core.agent.workflow import AgentStream, ToolCall, ToolCallResult
from llama_index.core.llms import ChatMessage, MessageRole
from llama_index.core.memory import Memory

logger = logging.getLogger(__name__)

from auth0_ai.interrupts.auth0_interrupt import Auth0Interrupt
from auth0_ai_llamaindex.context import set_ai_context

from app.core.auth import auth_client
from app.core.auth0_ai import current_credentials
from app.agents.assistant0 import create_agent

agent_router = APIRouter(prefix="/agent", tags=["agent"])

# In-memory thread storage, scoped by user sub
_threads: dict[str, dict[str, list[dict]]] = {}  # user_sub -> thread_id -> messages


def _get_credentials(auth_session: dict) -> dict:
    return {
        "access_token": auth_session.get("token_sets", [{}])[0].get("access_token"),
        "refresh_token": auth_session.get("refresh_token"),
        "user": auth_session.get("user"),
    }


def _get_user_sub(auth_session: dict) -> str:
    return auth_session.get("user", {}).get("sub", "anonymous")


def _get_thread_messages(user_sub: str, thread_id: str) -> list[dict]:
    return _threads.get(user_sub, {}).get(thread_id, [])


def _save_message(user_sub: str, thread_id: str, message: dict):
    if user_sub not in _threads:
        _threads[user_sub] = {}
    if thread_id not in _threads[user_sub]:
        _threads[user_sub][thread_id] = []
    _threads[user_sub][thread_id].append(message)


def _extract_text(msg: dict) -> str:
    """Extract text content from a UI message (AI SDK format)."""
    for part in msg.get("parts", []):
        if isinstance(part, dict) and part.get("type") == "text":
            return part.get("text", "")
    # Fallback to content field
    return msg.get("content", "")


def _build_memory(chat_id: str, messages: list[dict]) -> Memory:
    """Build a LlamaIndex Memory from AI SDK messages."""
    chat_history = []
    for msg in messages[:-1]:  # Exclude the last user message
        role = MessageRole.USER if msg.get("role") == "user" else MessageRole.ASSISTANT
        text = _extract_text(msg)
        if text:
            chat_history.append(ChatMessage(role=role, content=text))
    return Memory.from_defaults(session_id=chat_id, chat_history=chat_history)


def _sse(data: dict) -> str:
    """Format data as an SSE event."""
    return f"data: {json.dumps(data)}\n\n"


@agent_router.get("/threads/{thread_id}")
async def get_thread(
    thread_id: str,
    auth_session=Depends(auth_client.require_session),
):
    user_sub = _get_user_sub(auth_session)
    messages = _get_thread_messages(user_sub, thread_id)
    logger.info(
        "GET thread %s for user %s: %d messages (known threads: %s)",
        thread_id, user_sub, len(messages),
        list(_threads.get(user_sub, {}).keys()),
    )
    return JSONResponse(content={"messages": messages})


@agent_router.post("/chat")
async def chat_stream(
    request: Request,
    auth_session=Depends(auth_client.require_session),
):
    body = await request.json()
    chat_id = body.get("id") or body.get("chatId") or str(uuid.uuid4())
    messages_data = body.get("messages", [])
    logger.info("Chat request: chat_id=%s, messages=%d", chat_id, len(messages_data))

    credentials = _get_credentials(auth_session)
    user_sub = _get_user_sub(auth_session)
    current_credentials.set(credentials)
    set_ai_context(chat_id)

    # Extract last user message
    user_message = ""
    for msg in reversed(messages_data):
        if msg.get("role") == "user":
            user_message = _extract_text(msg)
            break

    memory = _build_memory(chat_id, messages_data)
    agent = create_agent(credentials)

    async def event_stream():
        msg_id = str(uuid.uuid4())
        text_part_id = str(uuid.uuid4())
        text_started = False
        response_parts: list[str] = []

        yield _sse({"type": "start", "messageId": msg_id})

        try:
            handler = agent.run(user_message, memory=memory)

            async for event in handler.stream_events():
                if isinstance(event, ToolCall):
                    yield _sse({
                        "type": "tool-input-start",
                        "toolCallId": event.tool_id,
                        "toolName": event.tool_name,
                    })
                    yield _sse({
                        "type": "tool-input-available",
                        "toolCallId": event.tool_id,
                        "toolName": event.tool_name,
                        "input": event.tool_kwargs,
                    })
                elif isinstance(event, ToolCallResult):
                    if event.tool_output.is_error:
                        logger.error(
                            "Tool '%s' failed: %s (exception type: %s)",
                            event.tool_name,
                            event.tool_output.content,
                            type(event.tool_output.exception).__name__ if event.tool_output.exception else "None",
                        )
                        if isinstance(event.tool_output.exception, Auth0Interrupt):
                            interrupt = event.tool_output.exception
                            interrupt_data = interrupt.to_json()
                            # Convert snake_case to camelCase for AI SDK frontend
                            if "required_scopes" in interrupt_data:
                                interrupt_data["requiredScopes"] = interrupt_data.pop("required_scopes")
                            if "authorization_params" in interrupt_data:
                                interrupt_data["authorizationParams"] = interrupt_data.pop("authorization_params")
                            interrupt_data.setdefault("behavior", "reload")
                            interrupt_data["toolCall"] = {
                                "id": event.tool_id,
                                "name": event.tool_name,
                                "args": event.tool_kwargs,
                            }
                            error_text = f"AUTH0_AI_INTERRUPTION:{json.dumps(interrupt_data)}"
                            yield _sse({"type": "error", "errorText": error_text})
                            yield "data: [DONE]\n\n"
                            return
                        yield _sse({
                            "type": "tool-output-error",
                            "toolCallId": event.tool_id,
                            "errorText": event.tool_output.content,
                        })
                    else:
                        yield _sse({
                            "type": "tool-output-available",
                            "toolCallId": event.tool_id,
                            "output": event.tool_output.content,
                        })
                elif isinstance(event, AgentStream):
                    if event.delta:
                        response_parts.append(event.delta)
                        if not text_started:
                            yield _sse({"type": "text-start", "id": text_part_id})
                            text_started = True
                        yield _sse({
                            "type": "text-delta",
                            "delta": event.delta,
                            "id": text_part_id,
                        })

            await handler

            if text_started:
                yield _sse({"type": "text-end", "id": text_part_id})

            # Persist messages for thread storage
            logger.info("Saving messages for thread %s (user %s)", chat_id, user_sub)
            user_msg_id = str(uuid.uuid4())
            _save_message(user_sub, chat_id, {
                "id": user_msg_id,
                "role": "user",
                "parts": [{"type": "text", "text": user_message}],
            })
            _save_message(user_sub, chat_id, {
                "id": msg_id,
                "role": "assistant",
                "parts": [{"type": "text", "text": "".join(response_parts)}],
            })

            yield _sse({"type": "finish"})

        except Auth0Interrupt as e:
            interrupt_data = e.to_json()
            if "required_scopes" in interrupt_data:
                interrupt_data["requiredScopes"] = interrupt_data.pop("required_scopes")
            if "authorization_params" in interrupt_data:
                interrupt_data["authorizationParams"] = interrupt_data.pop("authorization_params")
            interrupt_data["toolCall"] = {
                "id": str(uuid.uuid4()),
                "name": "unknown",
                "args": {},
            }
            error_text = f"AUTH0_AI_INTERRUPTION:{json.dumps(interrupt_data)}"
            yield _sse({"type": "error", "errorText": error_text})

        except Exception as e:
            logger.exception("Unexpected error in chat stream")
            yield _sse({"type": "error", "errorText": "An unexpected error occurred"})

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "x-vercel-ai-ui-message-stream": "v1",
        },
    )

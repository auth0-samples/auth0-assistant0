from __future__ import annotations
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse, JSONResponse
from app.core.auth import auth_client
from app.agents.assistant0_li import agent

agent_router = APIRouter(prefix="/agent", tags=["agent"])

@agent_router.post("/chat")
async def chat(request: Request, auth_session=Depends(auth_client.require_session)):
    try:
        body = await request.json()
        query: str = body.get("input") or body.get("message") or ""
        stream = agent.stream_chat(query)

        async def gen():
            async for ev in stream:
                if token := ev.get("delta"):
                    yield token
        return StreamingResponse(gen(), media_type="text/plain")

    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

from __future__ import annotations
import httpx
from llama_index.core.tools import FunctionTool
from app.core.config import settings
from app.core.auth import auth_client

async def _get_user_info() -> str:
    if not sess:
        return "There is no user logged in."

    access_token = sess.get("token_sets", [{}])[0].get("access_token")
    if not access_token:
        return "There is no user logged in."

    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://{settings.AUTH0_DOMAIN}/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    return f"User information: {r.json()}" if r.status_code == 200 else "I couldn't verify your identity"

get_user_info_li = FunctionTool.from_defaults(
    name="get_user_info",
    description="Get information about the current logged in user.",
    fn=_get_user_info,
)

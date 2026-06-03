import httpx
from llama_index.core.tools import FunctionTool

from app.core.config import settings


async def get_user_info_fn(credentials: dict | None = None) -> str:
    """Get information about the current logged in user from Auth0 /userinfo endpoint."""

    if not credentials:
        return "There is no user logged in."

    access_token = credentials.get("access_token")

    if not access_token:
        return "There is no user logged in."

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://{settings.AUTH0_DOMAIN}/userinfo",
                headers={
                    "Authorization": f"Bearer {access_token}",
                },
            )

            if response.status_code == 200:
                user_info = response.json()
                return f"User information: {user_info}"
            else:
                return "I couldn't verify your identity"

    except Exception as e:
        return f"Error getting user info: {str(e)}"


def create_user_info_tool(credentials: dict | None = None) -> FunctionTool:
    """Create the user info tool with credentials bound."""

    async def _get_user_info() -> str:
        """Get information about the current logged in user."""
        return await get_user_info_fn(credentials)

    return FunctionTool.from_defaults(
        async_fn=_get_user_info,
        name="get_user_info",
        description="Get information about the current logged in user.",
    )

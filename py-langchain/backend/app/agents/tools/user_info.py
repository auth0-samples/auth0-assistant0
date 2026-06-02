import httpx
from langchain_core.tools import StructuredTool
from langchain_core.runnables.config import RunnableConfig
from pydantic import BaseModel

from app.core.config import settings


class UserInfoSchema(BaseModel):
    pass


async def get_user_info_fn(config: RunnableConfig):
    """Get information about the current logged in user from Auth0 /userinfo endpoint."""

    # Access credentials from config
    if "configurable" not in config or "_credentials" not in config["configurable"]:
        return "There is no user logged in."

    credentials = config["configurable"]["_credentials"]
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


get_user_info = StructuredTool(
    name="get_user_info",
    description="Get information about the current logged in user.",
    args_schema=UserInfoSchema,
    coroutine=get_user_info_fn,
)

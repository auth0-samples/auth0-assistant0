import httpx
from langchain_core.tools import StructuredTool
from auth0_ai_langchain.async_authorization import get_async_authorization_credentials
from pydantic import BaseModel

from app.core.auth0_ai import with_async_authorization
from app.core.config import settings


class BuyOnlineSchema(BaseModel):
    product: str
    quantity: int


async def shop_online_fn(product: str, quantity: int):
    """Tool to buy products online."""

    api_url = settings.SHOP_API_URL

    if not api_url.strip():
        # No API set, mock a response
        return f"Ordered {quantity} {product}"

    credentials = get_async_authorization_credentials()

    if not credentials:
        raise ValueError("Async Authorization credentials not found")

    headers = {
        "Authorization": f"Bearer {credentials['access_token']}",
        "Content-Type": "application/json",
    }

    data = {
        "product": product,
        "quantity": quantity,
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                api_url,
                headers=headers,
                json=data,
            )

        if response.status_code != 200:
            raise ValueError(f"Failed to buy product: {response.text}")

        return response.json()

    except httpx.HTTPError as e:
        return {
            "success": False,
            "error": f"Failed to buy product: {str(e)}",
        }


shop_online = with_async_authorization(
    StructuredTool(
        name="shop_online",
        description="Tool to buy products online.",
        args_schema=BuyOnlineSchema,
        coroutine=shop_online_fn,
    )
)

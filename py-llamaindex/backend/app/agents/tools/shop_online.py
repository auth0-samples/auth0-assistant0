import httpx
from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex.async_authorization import get_async_authorization_credentials

from app.core.auth0_ai import with_async_authorization
from app.core.config import settings


async def shop_online_fn(product: str, qty: int, priceLimit: int | None = None) -> str:
    """Tool to buy products online."""

    api_url = settings.SHOP_API_URL

    if not api_url.strip():
        # No API set, mock a response
        return f"Ordered {qty} {product}"

    credentials = get_async_authorization_credentials()

    if not credentials:
        raise ValueError("Async Authorization credentials not found")

    headers = {
        "Authorization": f"Bearer {credentials['access_token']}",
        "Content-Type": "application/json",
    }

    data = {
        "product": product,
        "qty": qty,
        "priceLimit": priceLimit,
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
        return f"Failed to buy product: {str(e)}"


shop_online = with_async_authorization(
    FunctionTool.from_defaults(
        async_fn=shop_online_fn,
        name="shop_online",
        description="Tool to buy products online.",
    )
)

from typing import Optional
import httpx
from langchain_core.tools import StructuredTool
from auth0_ai_langchain.ciba import get_ciba_credentials
from pydantic import BaseModel

from app.core.auth0_ai import protect_tool


class BuyOnlineSchema(BaseModel):
    product: str
    quantity: int


def shop_online_fn(product: str, quantity: int):
    """Tool to buy products online."""
    credentials = get_ciba_credentials()

    if not credentials:
        raise ValueError("CIBA credentials not found")

    headers = {
        "Authorization": f"Bearer {credentials['access_token']}",
        "Content-Type": "application/json",
    }

    data = {
        "product": product,
        "quantity": quantity,
    }

    try:
        response = httpx.post(
            "https://api.shop-online-demo.com/v1/shop/order",
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


shop_online = protect_tool(
    StructuredTool(
        name="shop_online",
        description="Tool to buy products online.",
        args_schema=BuyOnlineSchema,
        func=shop_online_fn,
    )
)

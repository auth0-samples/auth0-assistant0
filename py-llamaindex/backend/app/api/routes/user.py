import httpx
from fastapi import APIRouter, Request, Response

from app.core.auth import auth_client
from app.core.config import settings

user_router = APIRouter(prefix="/user", tags=["user"])

CONNECTED_ACCOUNTS_AUDIENCE = f"https://{settings.AUTH0_DOMAIN}/me/"
CONNECTED_ACCOUNTS_BASE_URL = f"https://{settings.AUTH0_DOMAIN}/me/v1/connected-accounts/accounts"


@user_router.get("/profile")
async def profile(request: Request, response: Response):
    store_options = {"request": request, "response": response}
    user = await auth_client.client.get_user(store_options=store_options)
    if not user:
        return {"error": "User not authenticated"}

    return {
        "message": "Your Profile",
        "user": user
    }


@user_router.get("/connected-accounts")
async def list_connected_accounts(request: Request, response: Response):
    store_options = {"request": request, "response": response}
    try:
        token = await auth_client.client.get_access_token(
            store_options=store_options,
            audience=CONNECTED_ACCOUNTS_AUDIENCE,
            scope="read:me:connected_accounts",
        )
    except Exception:
        return {"accounts": []}

    if not token:
        return {"accounts": []}

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            CONNECTED_ACCOUNTS_BASE_URL,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
        )

    if resp.is_success:
        data = resp.json()
        return {"accounts": data.get("accounts", [])}

    return {"accounts": []}


@user_router.delete("/connected-accounts/{account_id}")
async def delete_connected_account(account_id: str, request: Request, response: Response):
    store_options = {"request": request, "response": response}
    try:
        token = await auth_client.client.get_access_token(
            store_options=store_options,
            audience=CONNECTED_ACCOUNTS_AUDIENCE,
            scope="delete:me:connected_accounts",
        )
    except Exception:
        return {"success": False, "error": "Failed to retrieve access token"}

    if not token:
        return {"success": False, "error": "No token retrieved"}

    async with httpx.AsyncClient() as client:
        resp = await client.delete(
            f"{CONNECTED_ACCOUNTS_BASE_URL}/{account_id}",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {token}",
            },
        )

    if resp.is_success:
        return {"success": True}

    return {"success": False, "error": resp.text or "Failed to delete connected account"}

from fastapi import APIRouter, Request, Response

from app.core.auth import auth_client

user_router = APIRouter(prefix="/user", tags=["user"])

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

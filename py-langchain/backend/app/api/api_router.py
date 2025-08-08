from fastapi import APIRouter
from app.api.routes.chat import agent_router
from app.api.routes.documents import documents_router
from app.core.auth import auth_router

api_router = APIRouter()

api_router.include_router(agent_router)


api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(documents_router)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from app.core.config import settings
from app.api.api_router import api_router
from app.core.auth import auth_client
from app.core.db import engine, init_db
from app.core.fga import authorization_manager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    authorization_manager.connect()

    yield

app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALL_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SessionMiddleware, secret_key=settings.AUTH0_SECRET)

app.state.auth_client = auth_client

app.include_router(api_router, prefix=settings.API_PREFIX)
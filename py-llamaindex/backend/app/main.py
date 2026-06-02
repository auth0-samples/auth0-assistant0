import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)-8s %(name)s: %(message)s",
)

from starlette.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware

# Load .env into os.environ so libraries using os.getenv() (e.g. FGARetriever) work correctly.
# This mirrors LangGraph server's "env": ".env" behavior.
load_dotenv()

from app.core.config import settings
from app.api.api_router import api_router
from app.core.auth import auth_client
from app.core.db import engine, init_db
from app.core.fga import authorization_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    authorization_manager.connect()

    yield

    # Shutdown


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALL_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set the session middleware
app.add_middleware(SessionMiddleware, secret_key=settings.AUTH0_SECRET)

# Save auth state
app.state.auth_client = auth_client

app.include_router(api_router, prefix=settings.API_PREFIX)

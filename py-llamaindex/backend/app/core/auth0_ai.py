from contextvars import ContextVar
from typing import TypedDict

from auth0_ai.authorizers.types import Auth0ClientParams
from auth0_ai_llamaindex.auth0_ai import Auth0AI

from app.core.config import settings


class Credentials(TypedDict):
    access_token: str | None
    refresh_token: str | None
    user: dict | None


# Single ContextVar to propagate user context to auth0-ai callbacks at runtime.
# Set in the chat route before agent execution.
current_credentials: ContextVar[Credentials] = ContextVar(
    "current_credentials",
    default={"access_token": None, "refresh_token": None, "user": None},
)

auth0_ai = Auth0AI(
    Auth0ClientParams(
        {
            "domain": settings.AUTH0_DOMAIN,
            "client_id": settings.AUTH0_CLIENT_ID,
            "client_secret": settings.AUTH0_CLIENT_SECRET,
        }
    )
)

_get_refresh_token = lambda *_args, **_kwargs: current_credentials.get()["refresh_token"]

with_calendar_access = auth0_ai.with_token_vault(
    connection="google-oauth2",
    scopes=["openid", "https://www.googleapis.com/auth/calendar.events"],
    refresh_token=_get_refresh_token,
)

with_gmail_read_access = auth0_ai.with_token_vault(
    connection="google-oauth2",
    scopes=["openid", "https://www.googleapis.com/auth/gmail.readonly"],
    refresh_token=_get_refresh_token,
)

with_gmail_write_access = auth0_ai.with_token_vault(
    connection="google-oauth2",
    scopes=["openid", "https://www.googleapis.com/auth/gmail.compose"],
    refresh_token=_get_refresh_token,
)

with_github_access = auth0_ai.with_token_vault(
    connection="github",
    scopes=[],
    refresh_token=_get_refresh_token,
)

with_slack_access = auth0_ai.with_token_vault(
    connection="sign-in-with-slack",
    scopes=["channels:read", "groups:read"],
    refresh_token=_get_refresh_token,
)

with_async_authorization = auth0_ai.with_async_authorization(
    audience=settings.SHOP_API_AUDIENCE,
    scopes=["openid", "product:buy"],
    binding_message=lambda product,
    qty: f"Do you want to buy {qty} {product}",
    user_id=lambda *_, **__: current_credentials.get()["user"].get("sub"),
    on_authorization_request="block",
)

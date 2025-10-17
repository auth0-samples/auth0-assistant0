from auth0_ai.authorizers.types import Auth0ClientParams
from auth0_ai_langchain.auth0_ai import Auth0AI
from langchain_core.runnables import ensure_config

from app.core.config import settings

auth0_ai = Auth0AI(
    Auth0ClientParams(
        {
            "domain": settings.AUTH0_DOMAIN,
            "client_id": settings.AUTH0_CLIENT_ID,
            "client_secret": settings.AUTH0_CLIENT_SECRET,
        }
    )
)

with_calendar_access = auth0_ai.with_token_vault(
    connection="google-oauth2",
    scopes=["https://www.googleapis.com/auth/calendar.events"],
)

with_async_authorization = auth0_ai.with_async_authorization(
    audience=settings.SHOP_API_AUDIENCE,
    # add any scopes you want to use with your API
    scopes=["openid", "product:buy"],
    binding_message=lambda product,
    quantity: f"Do you want to buy {quantity} {product}",
    user_id=lambda *_, **__: ensure_config()
    .get("configurable")
    .get("_credentials")
    .get("user")
    .get("sub"),
    # When this flag is set to `block`, the execution of the tool awaits
    # until the user approves or rejects the request.
    #
    # Given the asynchronous nature of the CIBA flow, this mode
    # is only useful during development.
    #
    # In practice, the process that is awaiting the user confirmation
    # could crash or timeout before the user approves the request.
    on_authorization_request="block",
    # Note: Setting a requested expiry greater than 300 (seconds) will force email verification
    # instead of using the push notification flow.
    # requested_expiry=301,
)

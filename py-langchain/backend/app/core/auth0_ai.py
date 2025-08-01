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
            "client_assertion_signing_alg": None,
            "client_assertion_signing_key": None,
            "telemetry": None,
            "timeout": None,
            "protocol": None,
        }
    )
)


with_calendar_free_busy_access = auth0_ai.with_federated_connection(
    connection="google-oauth2",
    scopes=["https://www.googleapis.com/auth/calendar.freebusy"],
)

protect_tool = auth0_ai.with_async_user_confirmation(
    audience=settings.AUTH0_SHOP_AUDIENCE,
    scopes=["openid", "product:buy"],
    binding_message=lambda product,
    quantity: "Do you want to buy {quantity} {product}?",
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
)

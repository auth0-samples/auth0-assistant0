from auth0_fastapi.auth import AuthClient
from auth0_fastapi.config import Auth0Config
from auth0_fastapi.server.routes import router as auth_router, register_auth_routes

from app.core.config import settings

auth_config = Auth0Config(
    domain=settings.AUTH0_DOMAIN,
    client_id=settings.AUTH0_CLIENT_ID,
    client_secret=settings.AUTH0_CLIENT_SECRET,
    secret=settings.AUTH0_SECRET,
    app_base_url=f"{settings.APP_BASE_URL}{settings.API_PREFIX}",
    mount_routes=True,
    mount_connected_account_routes=True,
    authorization_params={
        "scope": "openid profile email offline_access",
    },
)

auth_client = AuthClient(auth_config)

register_auth_routes(auth_router, auth_config)

from typing import Annotated, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field, AnyUrl, BeforeValidator


def parse_cors(v: Any) -> list[str] | str:
    if isinstance(v, str) and not v.startswith("["):
        return [i.strip() for i in v.split(",")]
    elif isinstance(v, list | str):
        return v
    raise ValueError(v)


class Settings(BaseSettings):
    APP_NAME: str = "Assistant0"
    API_PREFIX: str = "/api"

    AUTH0_DOMAIN: str
    AUTH0_CLIENT_ID: str
    AUTH0_CLIENT_SECRET: str
    AUTH0_SECRET: str
    AUTH0_SHOP_AUDIENCE: str = "https://api.shop-online-demo.com"
    APP_BASE_URL: str

    OPENAI_API_KEY: str

    LANGGRAPH_URL: str = "http://localhost:54367"
    LANGGRAPH_API_KEY: str = ""

    FRONTEND_HOST: str = "http://localhost:5173"
    BACKEND_CORS_ORIGINS: Annotated[list[AnyUrl] | str, BeforeValidator(parse_cors)] = [
        "http://localhost:8000"
    ]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def ALL_CORS_ORIGINS(self) -> list[str]:
        return [str(origin).rstrip("/") for origin in self.BACKEND_CORS_ORIGINS] + [
            self.FRONTEND_HOST
        ]

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()

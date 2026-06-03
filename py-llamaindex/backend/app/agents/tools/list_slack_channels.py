import json
from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex.token_vault import get_access_token_from_token_vault
from slack_sdk.web.async_client import AsyncWebClient
from slack_sdk.errors import SlackApiError

from app.core.auth0_ai import with_slack_access


async def list_slack_channels_fn() -> str:
    """List channels for the current user on Slack."""
    access_token = get_access_token_from_token_vault()
    if not access_token:
        raise ValueError(
            "Authorization required to access Slack."
        )

    try:
        client = AsyncWebClient(token=access_token)

        result = await client.conversations_list(
            exclude_archived=True,
            types="public_channel,private_channel",
            limit=10,
        )

        channels = result.get("channels", [])
        channel_names = [
            ch["name"] for ch in channels if ch.get("name")
        ]

        return json.dumps({
            "total_channels": len(channel_names),
            "channels": channel_names,
        })

    except SlackApiError as e:
        if e.response.get("error") == "invalid_auth" or e.response.get("error") == "not_authed":
            raise ValueError(
                "Authorization required to access the Federated Connection"
            )
        raise


list_slack_channels = with_slack_access(
    FunctionTool.from_defaults(
        async_fn=list_slack_channels_fn,
        name="list_slack_channels",
        description="List channels for the current user on Slack",
    )
)

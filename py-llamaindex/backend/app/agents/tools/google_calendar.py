from llama_index.core.tools import FunctionTool
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from auth0_ai_llamaindex.token_vault import get_access_token_from_token_vault
import datetime
import json

from app.core.auth0_ai import with_calendar_access


async def list_upcoming_events_fn() -> str:
    """List upcoming events from the user's Google Calendar."""
    google_access_token = get_access_token_from_token_vault()
    if not google_access_token:
        raise ValueError(
            "Authorization required to access the Token Vault API"
        )

    calendar_service = build(
        "calendar",
        "v3",
        credentials=Credentials(google_access_token),
    )

    events = (
        calendar_service.events()
        .list(
            calendarId="primary",
            timeMin=datetime.datetime.now().isoformat() + "Z",
            timeMax=(datetime.datetime.now() + datetime.timedelta(days=7)).isoformat()
            + "Z",
            maxResults=5,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
        .get("items", [])
    )

    return json.dumps(
        [
            {
                "summary": event["summary"],
                "start": event["start"].get("dateTime", event["start"].get("date")),
            }
            for event in events
        ]
    )


list_upcoming_events = with_calendar_access(
    FunctionTool.from_defaults(
        async_fn=list_upcoming_events_fn,
        name="list_upcoming_events",
        description="List upcoming events from the user's Google Calendar",
    )
)

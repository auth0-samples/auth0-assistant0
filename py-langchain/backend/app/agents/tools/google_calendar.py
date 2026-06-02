from langchain_core.tools import StructuredTool
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from pydantic import BaseModel
from auth0_ai_langchain.token_vault import (
    get_access_token_from_token_vault,
)
import datetime
import json

from app.core.auth0_ai import with_calendar_access


async def list_upcoming_events_fn():
    """List upcoming events from the user's Google Calendar"""
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
    StructuredTool(
        name="list_upcoming_events",
        description="List upcoming events from the user's Google Calendar",
        args_schema=BaseModel,
        coroutine=list_upcoming_events_fn,
    )
)

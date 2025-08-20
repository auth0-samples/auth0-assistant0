from __future__ import annotations
import datetime, json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex.federated_connections import (
    with_federated_connection,
    get_access_token_for_connection,
)

async def _list_events() -> str:
    google_access_token = get_access_token_for_connection()
    if not google_access_token:
        return "Authorization required to access the Federated Connection API"

    service = build("calendar", "v3", credentials=Credentials(google_access_token))
    events = (service.events()
        .list(
            calendarId="primary",
            timeMin=datetime.datetime.utcnow().isoformat() + "Z",
            timeMax=(datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat() + "Z",
            maxResults=5,
            singleEvents=True,
            orderBy="startTime",
        )
        .execute()
        .get("items", [])
    )

    return json.dumps([
        {"summary": e.get("summary", "(no title)"),
         "start": e["start"].get("dateTime", e["start"].get("date"))}
        for e in events
    ])

list_upcoming_events_li = with_federated_connection(
    FunctionTool.from_defaults(
        name="list_upcoming_events",
        description="List upcoming events from the user's Google Calendar.",
        fn=_list_events,
    ),
    connection="google-oauth2",
    scopes=["https://www.googleapis.com/auth/calendar.events"],
)

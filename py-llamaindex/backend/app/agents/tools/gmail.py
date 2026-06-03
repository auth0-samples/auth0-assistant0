import json
from llama_index.core.tools import FunctionTool
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from auth0_ai_llamaindex.token_vault import get_access_token_from_token_vault

from app.core.auth0_ai import with_gmail_read_access, with_gmail_write_access


async def gmail_search_fn(
    query: str, max_results: int = 10
) -> str:
    """Search for emails in the user's Gmail inbox."""
    google_access_token = get_access_token_from_token_vault()
    if not google_access_token:
        raise ValueError(
            "Authorization required to access the Token Vault API"
        )

    service = build(
        "gmail",
        "v1",
        credentials=Credentials(google_access_token),
    )

    results = (
        service.users()
        .messages()
        .list(userId="me", q=query, maxResults=max_results)
        .execute()
    )

    messages = results.get("messages", [])
    if not messages:
        return "No messages found."

    email_data = []
    for msg in messages[:max_results]:
        msg_detail = (
            service.users()
            .messages()
            .get(userId="me", id=msg["id"], format="metadata")
            .execute()
        )
        headers = {h["name"]: h["value"] for h in msg_detail.get("payload", {}).get("headers", [])}
        email_data.append({
            "id": msg["id"],
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "date": headers.get("Date", ""),
            "snippet": msg_detail.get("snippet", ""),
        })

    return json.dumps(email_data)


gmail_search = with_gmail_read_access(
    FunctionTool.from_defaults(
        async_fn=gmail_search_fn,
        name="gmail_search",
        description="Search for emails in the user's Gmail inbox. Can search by sender, subject, or content.",
    )
)


async def gmail_create_draft_fn(
    message: str, to: str, subject: str, cc: str = "", bcc: str = ""
) -> str:
    """Create a draft email in the user's Gmail account."""
    import base64
    from email.mime.text import MIMEText

    google_access_token = get_access_token_from_token_vault()
    if not google_access_token:
        raise ValueError(
            "Authorization required to access the Token Vault API"
        )

    service = build(
        "gmail",
        "v1",
        credentials=Credentials(google_access_token),
    )

    mime_message = MIMEText(message)
    mime_message["to"] = to
    mime_message["subject"] = subject

    if cc:
        mime_message["cc"] = cc
    if bcc:
        mime_message["bcc"] = bcc

    encoded_message = base64.urlsafe_b64encode(mime_message.as_bytes()).decode()

    draft = (
        service.users()
        .drafts()
        .create(userId="me", body={"message": {"raw": encoded_message}})
        .execute()
    )

    return json.dumps({"id": draft["id"], "message": "Draft created successfully"})


gmail_create_draft = with_gmail_write_access(
    FunctionTool.from_defaults(
        async_fn=gmail_create_draft_fn,
        name="gmail_create_draft",
        description="Create a draft email in the user's Gmail account.",
    )
)

import json
from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex.token_vault import get_access_token_from_token_vault
import httpx

from app.core.auth0_ai import with_github_access


def _get_payload_summary(event_type: str, payload: dict) -> str:
    """Extract meaningful info from event payloads."""
    match event_type:
        case "PushEvent":
            return f"Pushed {len(payload.get('commits', []))} commit(s)"
        case "PullRequestEvent":
            return f"{payload.get('action', '')} pull request: {payload.get('pull_request', {}).get('title', '')}"
        case "IssuesEvent":
            return f"{payload.get('action', '')} issue: {payload.get('issue', {}).get('title', '')}"
        case "CreateEvent":
            return f"Created {payload.get('ref_type', '')}: {payload.get('ref', '')}"
        case "WatchEvent":
            return "Starred repository"
        case "ForkEvent":
            return "Forked repository"
        case _:
            return event_type


async def list_github_events_fn(per_page: int = 30, page: int = 1) -> str:
    """List recent events for the current authenticated user on GitHub (e.g., commits, pushes, pull requests, issues, etc.)."""
    access_token = get_access_token_from_token_vault()
    if not access_token:
        raise ValueError(
            "Authorization required to access your GitHub events."
        )

    try:
        async with httpx.AsyncClient() as client:
            # First get the authenticated user's login
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
            )

            if user_response.status_code == 401:
                raise ValueError(
                    "Authorization required to access your GitHub events. Please connect your GitHub account."
                )

            user_response.raise_for_status()
            username = user_response.json()["login"]

            # Then get their events
            events_response = await client.get(
                f"https://api.github.com/users/{username}/events",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                params={"per_page": per_page, "page": page},
            )

            events_response.raise_for_status()
            events = events_response.json()

        formatted_events = [
            {
                "id": event.get("id"),
                "type": event.get("type"),
                "created_at": event.get("created_at"),
                "repo": {
                    "name": event.get("repo", {}).get("name", "Unknown"),
                    "url": event.get("repo", {}).get("url", ""),
                },
                "actor": {
                    "login": event.get("actor", {}).get("login", "Unknown"),
                    "avatar_url": event.get("actor", {}).get("avatar_url", ""),
                },
                "payload_summary": _get_payload_summary(
                    event.get("type", ""), event.get("payload", {})
                ),
                "public": event.get("public"),
            }
            for event in events
        ]

        return json.dumps({
            "events": formatted_events,
            "total_events": len(formatted_events),
            "page": page,
            "per_page": per_page,
        })

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ValueError(
                "Authorization required to access your GitHub events. Please connect your GitHub account."
            )
        if e.response.status_code == 403:
            raise ValueError(
                "Access forbidden. Your GitHub token may not have the required permissions to access events."
            )
        raise


list_github_events = with_github_access(
    FunctionTool.from_defaults(
        async_fn=list_github_events_fn,
        name="list_github_events",
        description="List recent events for the current authenticated user on GitHub (e.g., commits, pushes, pull requests, issues, etc.)",
    )
)

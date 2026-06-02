import json
from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex.token_vault import get_access_token_from_token_vault
import httpx

from app.core.auth0_ai import with_github_access


async def list_repositories_fn() -> str:
    """List data of all repositories for the current user on GitHub."""
    access_token = get_access_token_from_token_vault()
    if not access_token:
        raise ValueError(
            "Authorization required to access your GitHub repositories."
        )

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                    "X-GitHub-Api-Version": "2022-11-28",
                },
                params={"visibility": "all", "per_page": 100},
            )

            if response.status_code == 401:
                raise ValueError(
                    "Authorization required to access your GitHub repositories. Please connect your GitHub account."
                )

            response.raise_for_status()
            repos = response.json()

        simplified_repos = [
            {
                "name": repo["name"],
                "full_name": repo["full_name"],
                "description": repo.get("description"),
                "private": repo["private"],
                "html_url": repo["html_url"],
                "language": repo.get("language"),
                "stargazers_count": repo.get("stargazers_count", 0),
                "forks_count": repo.get("forks_count", 0),
                "open_issues_count": repo.get("open_issues_count", 0),
                "updated_at": repo.get("updated_at"),
                "created_at": repo.get("created_at"),
            }
            for repo in repos
        ]

        return json.dumps({
            "total_repositories": len(simplified_repos),
            "repositories": simplified_repos,
        })

    except httpx.HTTPStatusError as e:
        if e.response.status_code == 401:
            raise ValueError(
                "Authorization required to access your GitHub repositories. Please connect your GitHub account."
            )
        raise


list_repositories = with_github_access(
    FunctionTool.from_defaults(
        async_fn=list_repositories_fn,
        name="list_repositories",
        description="List data of all repositories for the current user on GitHub",
    )
)

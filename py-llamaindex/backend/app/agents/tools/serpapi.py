import httpx
from llama_index.core.tools import FunctionTool

from app.core.config import settings


async def serp_search_fn(q: str) -> str:
    """Search the web using SerpAPI."""
    api_key = settings.SERPAPI_API_KEY

    if not api_key:
        return "SerpAPI key not configured. Web search is not available."

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://serpapi.com/search",
                params={
                    "q": q,
                    "api_key": api_key,
                    "engine": "google",
                },
            )

            response.raise_for_status()
            data = response.json()

            # Extract organic results
            results = data.get("organic_results", [])
            if not results:
                return "No search results found."

            formatted = []
            for result in results[:5]:
                formatted.append(
                    f"Title: {result.get('title', '')}\n"
                    f"Link: {result.get('link', '')}\n"
                    f"Snippet: {result.get('snippet', '')}"
                )

            return "\n\n".join(formatted)

    except Exception as e:
        return f"Error searching the web: {str(e)}"


serp_search = None

if settings.SERPAPI_API_KEY:
    serp_search = FunctionTool.from_defaults(
        async_fn=serp_search_fn,
        name="serp_search",
        description="Search the web for information using a search query.",
    )

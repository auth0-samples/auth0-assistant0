from llama_index.llms.openai import OpenAI
from llama_index.core.agent.workflow import FunctionAgent
from datetime import date

from app.core.config import settings
from app.agents.tools.shop_online import shop_online
from app.agents.tools.google_calendar import list_upcoming_events
from app.agents.tools.gmail import gmail_search, gmail_create_draft
from app.agents.tools.list_gh_repos import list_repositories
from app.agents.tools.list_gh_events import list_github_events
from app.agents.tools.list_slack_channels import list_slack_channels
from app.agents.tools.serpapi import serp_search
from app.agents.tools.user_info import create_user_info_tool
from app.agents.tools.context_docs import create_context_docs_tool


llm = OpenAI(model="gpt-4.1-mini", api_key=settings.OPENAI_API_KEY)


def get_prompt():
    today_str = date.today().strftime("%Y-%m-%d")
    return (
        f"You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. "
        f"You have access to a set of tools. When using tools, you MUST provide valid JSON arguments. Always format tool call arguments as proper JSON objects. "
        f"For example, when calling shop_online tool, format like this: "
        f'{{"product": "iPhone", "qty": 1, "priceLimit": 1000}} '
        f"Use the tools as needed to answer the user's question. Render the email body as a markdown block, do not wrap it in code blocks. Today is {today_str}."
    )


def create_agent(credentials: dict | None = None) -> FunctionAgent:
    """Create a new LlamaIndex agent with the given credentials."""
    # Tools that need credentials
    user_info_tool = create_user_info_tool(credentials)
    context_docs_tool = create_context_docs_tool(credentials)

    # Build tools list
    tools = [
        user_info_tool,
        context_docs_tool,
        list_upcoming_events,
        shop_online,
        gmail_search,
        gmail_create_draft,
        list_repositories,
        list_github_events,
        list_slack_channels,
    ]

    # Add optional tools
    if serp_search is not None:
        tools.append(serp_search)

    agent = FunctionAgent(
        llm=llm,
        tools=tools,
        system_prompt=get_prompt(),
    )
    return agent

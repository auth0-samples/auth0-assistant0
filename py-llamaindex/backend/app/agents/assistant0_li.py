from __future__ import annotations
from llama_index.core.agent import ReActAgentWorker
from llama_index.llms.openai import OpenAI

from app.agents.tools.user_info_li import get_user_info_li
from app.agents.tools.google_calendar_li import list_upcoming_events_li
from app.agents.tools.shop_online_li import shop_online_li
from app.agents.tools.context_docs_li import get_context_docs_li

llm = OpenAI(model="gpt-4.1-mini", temperature=0.2)

tools = [
    get_user_info_li,
    list_upcoming_events_li,
    shop_online_li,
    get_context_docs_li,
]

agent = ReActAgentWorker.from_tools(
    tools=tools,
    llm=llm,
    verbose=True,
    system_prompt=(
        "You are a personal assistant named Assistant0. "
        "Use tools when helpful; prefer get_context_docs for knowledge base queries. "
        "Render email-like bodies as markdown (no code fences)."
    ),
).as_agent()
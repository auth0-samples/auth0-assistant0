from langgraph.prebuilt import ToolNode, create_react_agent
from langchain_openai import ChatOpenAI

from app.agents.tools.shop_online import shop_online
from app.agents.tools.google_calendar import list_upcoming_events
from app.agents.tools.user_info import get_user_info
from app.agents.tools.context_docs import get_context_docs
from datetime import date


tools = [get_user_info, list_upcoming_events, shop_online, get_context_docs]

llm = ChatOpenAI(model="gpt-4.1-mini")

def get_prompt():
    today_str = date.today().strftime('%Y-%m-%d')
    return (
        f"You are a personal assistant named Assistant0. You are a helpful assistant that can answer questions and help with tasks. "
        f"Today's date is {today_str}. You have access to a set of tools, use the tools as needed to answer the user's question. "
        f"Render the email body as a markdown block, do not wrap it in code blocks."
    )

agent = create_react_agent(
    llm,
    tools=ToolNode(tools, handle_tool_errors=False),
    prompt=get_prompt(),
)

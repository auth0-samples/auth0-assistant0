from langchain_core.runnables.config import RunnableConfig


async def get_user_info(config: RunnableConfig):
    """Get's information about the user currently using the assistant."""
    if "configurable" not in config or "_credentials" not in config["configurable"]:
        return "No user information available"

    return config["configurable"]["_credentials"]["user"]

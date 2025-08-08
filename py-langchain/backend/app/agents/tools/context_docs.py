from langchain_core.runnables import RunnableConfig
from langchain_core.tools import StructuredTool
from auth0_ai_langchain import FGARetriever
from openfga_sdk.client.models import ClientBatchCheckItem
from pydantic import BaseModel

from app.core.rag import get_vector_store


class GetContextDocsSchema(BaseModel):
    question: str


async def get_context_docs_fn(question: str, config: RunnableConfig):
    """Use the tool when user asks for documents or projects or anything that is stored in the knowledge base."""

    if "configurable" not in config or "_credentials" not in config["configurable"]:
        return "There is no user logged in."

    credentials = config["configurable"]["_credentials"]
    user = credentials.get("user")

    if not user:
        return "There is no user logged in."

    user_email = user.get("email")
    vector_store = await get_vector_store()

    if not vector_store:
        return "There is no vector store."

    retriever = FGARetriever(
        retriever=vector_store.as_retriever(),
        build_query=lambda doc: ClientBatchCheckItem(
            user=f"user:{user_email}",
            object=f"doc:{doc.metadata.get('document_id')}",
            relation="can_view",
        ),
    )

    documents = retriever.invoke(question)
    return "\n\n".join([document.page_content for document in documents])


get_context_docs = StructuredTool(
    name="get_context_docs",
    description="Use the tool when user asks for documents or projects or anything that is stored in the knowledge base.",
    args_schema=GetContextDocsSchema,
    coroutine=get_context_docs_fn,
)

from llama_index.core.tools import FunctionTool
from auth0_ai_llamaindex import FGARetriever
from openfga_sdk.client.models import ClientBatchCheckItem

from app.core.rag import get_vector_store

async def get_context_docs_fn(question: str, credentials: dict | None = None):
    """Use the tool when user asks for documents or projects or anything that is stored in the knowledge base."""

    if not credentials:
        return "There is no user logged in."

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

    # Use sync retrieve — the async path in FGARetriever has a bug
    # where NodeWithScore is used as a dict key (unhashable).
    documents = retriever.retrieve(question)
    return "\n\n".join([document.get_content() for document in documents])


def create_context_docs_tool(credentials: dict | None = None) -> FunctionTool:
    """Create the context docs tool with credentials bound."""

    async def _get_context_docs(question: str) -> str:
        """Use the tool when user asks for documents or projects or anything that is stored in the knowledge base."""
        return await get_context_docs_fn(question, credentials)

    return FunctionTool.from_defaults(
        async_fn=_get_context_docs,
        name="get_context_docs",
        description="Use the tool when user asks for documents or projects or anything that is stored in the knowledge base.",
    )

from __future__ import annotations
from typing import List

from llama_index.core.tools import FunctionTool
from pydantic import BaseModel

from app.core.rag_li import retrieve_nodes
from app.core.fga import authorization_manager


class GetContextDocsSchema(BaseModel):
    question: str

async def get_context_docs_li_fn(question: str, user_email: str) -> str:
    nodes = retrieve_nodes(question, top_k=12)

    allowed: List[str] = []
    for n in nodes:
        doc_id = n.metadata.get("document_id")
        if not doc_id:
            continue

        can_view = await authorization_manager.check_relation(
            user=user_email, doc_id=doc_id, relation="can_view"
        )
        if can_view:
            allowed.append(n.get_content(metadata_mode="none"))

    if not allowed:
        return "I couldn't find any documents you are allowed to view."
    return "\n\n".join(allowed)


get_context_docs_li = FunctionTool.from_defaults(
    name="get_context_docs",
    description="Retrieve documents from the knowledge base (LlamaIndex + FGA).",
    fn=get_context_docs_li_fn,
)
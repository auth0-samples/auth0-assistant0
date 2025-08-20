from __future__ import annotations
import uuid
from llama_index.core import VectorStoreIndex, Document
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.vector_stores.postgres import PGVectorStore
from app.core.config import settings

_index: VectorStoreIndex | None = None


def _build_store() -> PGVectorStore:
    return PGVectorStore.from_params(
        database=settings.DATABASE_URL,
        table_name="embedding_li",
        id_column="id",
        vector_dimension=1536,
    )

def _embedder() -> OpenAIEmbedding:
    return OpenAIEmbedding(
        model="text-embedding-3-small",
        api_key=settings.OPENAI_API_KEY,
    )

def _get_index() -> VectorStoreIndex:
    global _index
    if _index is not None:
        return _index

    store = _build_store()
    _index = VectorStoreIndex.from_vector_store(
        vector_store=store,
        embed_model=_embedder(),
    )
    return _index

def upsert_text_document(document_id: uuid.UUID, file_name: str, text: str) -> None:
    index = _get_index()
    splitter = SentenceSplitter(chunk_size=1000, chunk_overlap=100)
    nodes = splitter.get_nodes_from_documents(
        [Document(text=text, metadata={"file_name": file_name, "document_id": str(document_id)})]
    )
    index.insert_nodes(nodes)

def retrieve_texts(question: str, top_k: int = 10) -> list[str]:
    index = _get_index()
    retriever = index.as_retriever(similarity_top_k=top_k)
    nodes = retriever.retrieve(question)
    return [n.get_content(metadata_mode="none") for n in nodes]

def retrieve_nodes(question: str, top_k: int = 12):
    index = _get_index()
    retriever = index.as_retriever(similarity_top_k=top_k)
    return retriever.retrieve(question)
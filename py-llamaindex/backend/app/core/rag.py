import uuid
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.retrievers import BaseRetriever
from llama_index.core.schema import NodeWithScore, TextNode, QueryBundle, Document
from sqlmodel import Session, text

from app.core.config import settings
from app.core.db import engine
from app.models.embeddings import Embedding

embedding_model = OpenAIEmbedding(
    model_name="text-embedding-3-small",
    api_key=settings.OPENAI_API_KEY,
)

vector_store: "PGVectorStore | None" = None


def generate_embeddings(
    document_id: uuid.UUID, file_name: str, text: str
) -> list[Embedding]:
    """Generate embeddings for a document."""
    splitter = SentenceSplitter(
        chunk_size=100,
        chunk_overlap=10,
    )

    nodes = splitter.get_nodes_from_documents([Document(text=text)])
    embeddings = embedding_model.get_text_embedding_batch(
        [node.get_content() for node in nodes]
    )

    return [
        Embedding(
            document_id=document_id,
            meta={
                "file_name": file_name,
                "document_id": str(document_id),
            },
            content=node.get_content(),
            embedding=embedding,
        )
        for node, embedding in zip(nodes, embeddings)
    ]


class PGVectorRetriever(BaseRetriever):
    """Retriever that queries the pgvector embedding table."""

    def _retrieve(self, query_bundle: QueryBundle) -> list[NodeWithScore]:
        query_embedding = embedding_model.get_text_embedding(query_bundle.query_str)

        with Session(engine) as db_session:
            results = db_session.exec(
                text(
                    """
                    SELECT id, content, document_id, meta, 1 - (embedding <=> CAST(:query_embedding AS vector)) as similarity
                    FROM embedding
                    WHERE 1 - (embedding <=> CAST(:query_embedding AS vector)) > 0.5
                    ORDER BY similarity DESC
                    LIMIT :limit
                    """
                ).bindparams(
                    query_embedding=str(query_embedding),
                    limit=4,
                )
            ).all()

            return [
                NodeWithScore(
                    node=TextNode(
                        id_=str(row[0]),
                        text=row[1],
                        metadata={
                            "document_id": str(row[2]),
                            **(row[3] if isinstance(row[3], dict) else {}),
                        },
                    ),
                    score=float(row[4]),
                )
                for row in results
            ]

    async def _aretrieve(self, query_bundle: QueryBundle) -> list[NodeWithScore]:
        return self._retrieve(query_bundle)


class PGVectorStore:
    """Vector store backed by pgvector, mirroring the LangChain PGVectorStore interface."""

    def as_retriever(self) -> PGVectorRetriever:
        return PGVectorRetriever()


async def get_vector_store() -> PGVectorStore:
    global vector_store

    if vector_store is not None:
        return vector_store

    vector_store = PGVectorStore()

    return vector_store

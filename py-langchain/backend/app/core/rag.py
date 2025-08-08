import uuid
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_postgres import PGVectorStore, PGEngine
from pydantic import SecretStr

from app.core.config import settings
from app.core.db import engine
from app.models.embeddings import Embedding

embedding_model = OpenAIEmbeddings(
    model="text-embedding-3-small",
    api_key=SecretStr(settings.OPENAI_API_KEY),
)

vector_store: PGVectorStore | None = None


def generate_embeddings(
    document_id: uuid.UUID, file_name: str, text: str
) -> list[Embedding]:
    """Generate embeddings for a document."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=100,
        chunk_overlap=10,
        length_function=len,
    )

    chunks = splitter.create_documents([text])
    embeddings = embedding_model.embed_documents(
        [chunk.page_content for chunk in chunks]
    )

    return [
        Embedding(
            document_id=document_id,
            meta={
                "file_name": file_name,
                "document_id": str(document_id),
            },
            content=chunk.page_content,
            embedding=embedding,
        )
        for chunk, embedding in zip(chunks, embeddings)
    ]


async def get_vector_store():
    global vector_store

    if vector_store is not None:
        return vector_store

    pg_engine = PGEngine.from_connection_string(settings.DATABASE_URL)
    vector_store = await PGVectorStore.create(
        engine=pg_engine,
        table_name="embedding",
        embedding_service=embedding_model,
        id_column="id",
        embedding_column="embedding",
        content_column="content",
        metadata_json_column="meta",
    )

    return vector_store

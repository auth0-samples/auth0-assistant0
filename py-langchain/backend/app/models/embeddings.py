import uuid
from typing import Dict
from sqlmodel import JSON, Column, Field, SQLModel
from pgvector.sqlalchemy import Vector


class Embedding(SQLModel, table=True):
    id: str = Field(default_factory=uuid.uuid4, primary_key=True)
    document_id: uuid.UUID = Field(
        default=None, foreign_key="document.id", ondelete="CASCADE"
    )
    content: str
    meta: Dict = Field(default={}, sa_column=Column(JSON))
    embedding: list[float] = Field(sa_column=Column(Vector(1536)))

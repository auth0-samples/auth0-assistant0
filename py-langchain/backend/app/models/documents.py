import uuid
from datetime import datetime
from sqlmodel import Field, SQLModel, ARRAY, Column, String


class DocumentWithoutContent(SQLModel):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    file_name: str
    file_type: str
    created_at: datetime
    updated_at: datetime
    user_id: str
    user_email: str
    shared_with: list[str] = Field(sa_column=Column(ARRAY(String)))


class Document(DocumentWithoutContent, table=True):
    content: bytes

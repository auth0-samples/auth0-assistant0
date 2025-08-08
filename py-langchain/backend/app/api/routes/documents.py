from datetime import datetime
import base64
import uuid
import PyPDF2
from io import BytesIO
from fastapi import APIRouter, Depends, File, UploadFile
from fastapi.exceptions import HTTPException
from pydantic import BaseModel
from sqlmodel import Session, select, update, col, delete

from app.core.auth import auth_client
from app.core.db import engine
from app.core.fga import authorization_manager
from app.models.documents import Document, DocumentWithoutContent
from app.core.rag import generate_embeddings

documents_router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_FILE_TYPES = ["text/plain", "application/pdf", "text/markdown"]
MAX_FILE_SIZE_MB = 10
MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024


@documents_router.get("/")
def get_documents(
    auth_session=Depends(auth_client.require_session),
) -> list[DocumentWithoutContent]:
    user = auth_session.get("user")

    with Session(engine) as db_session:
        documents = db_session.exec(
            select(
                Document.id,
                Document.file_name,
                Document.file_type,
                Document.created_at,
                Document.updated_at,
                Document.user_id,
                Document.user_email,
                Document.shared_with,
            ).where(Document.user_id == user.get("sub"))
        ).all()

        return [
            DocumentWithoutContent(
                id=doc.id,
                file_name=doc.file_name,
                file_type=doc.file_type,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
                user_id=doc.user_id,
                user_email=doc.user_email,
                shared_with=doc.shared_with,
            )
            for doc in documents
        ]


@documents_router.post("/upload")
async def upload_document(
    file: UploadFile = File(), auth_session=Depends(auth_client.require_session)
) -> DocumentWithoutContent:
    user = auth_session.get("user")

    binary_content = await file.read()

    file_name = file.filename
    file_type = file.content_type

    if not file_name:
        raise HTTPException(status_code=400, detail="File name is required")

    if file_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed file types are: {','.join(ALLOWED_FILE_TYPES)}",
        )

    if len(binary_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds the maximum allowed size of {MAX_FILE_SIZE_MB} MB",
        )

    # Get the document's content
    file_text = ""
    if file_type == "application/pdf":
        pdf_stream = BytesIO(binary_content)
        pdf_reader = PyPDF2.PdfReader(pdf_stream)
        for page in pdf_reader.pages:
            file_text += page.extract_text()
    else:
        file_text = binary_content.decode("utf-8")

    with Session(engine) as db_session:
        # Create the document
        document = Document(
            content=binary_content,
            file_name=file_name,
            file_type=file_type,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            user_id=user.get("sub"),
            user_email=user.get("email"),
            shared_with=[],
        )

        db_session.add(document)

        embeddings = generate_embeddings(
            document_id=document.id, file_name=file_name, text=file_text
        )

        if len(embeddings) > 0:
            db_session.add_all(embeddings)

        doc_id = str(document.id)
        db_session.commit()

        # Write the relationship tuple to FGA
        await authorization_manager.add_relation(user.get("email"), doc_id)

        return document


@documents_router.get(
    "/{document_id}/content",
    dependencies=[Depends(auth_client.require_session)],
)
def get_document_content(document_id: str):
    with Session(engine) as db_session:
        document = db_session.get(Document, document_id)

        if not document:
            raise HTTPException(status_code=404, detail="Document not found")

        encoded_content = base64.b64encode(document.content).decode("utf-8")

        return encoded_content


class ShareDocumentRequest(BaseModel):
    email_addresses: list[str]


@documents_router.post("/{document_id}/share")
async def share_document(
    document_id: str,
    input: ShareDocumentRequest,
    auth_session=Depends(auth_client.require_session),
):
    with Session(engine) as db_session:
        shared_with = db_session.exec(
            select(Document.shared_with).where(col(Document.id) == document_id)
        ).first()

        if shared_with is None:
            raise HTTPException(status_code=404, detail="Document not found")

        merged_shared_with = list(
            set([email for email in shared_with] + input.email_addresses)
        )

        db_session.exec(
            update(Document)
            .where(col(Document.id) == document_id)
            .values(shared_with=merged_shared_with)
        )
        db_session.commit()

        for email in input.email_addresses:
            await authorization_manager.add_relation(email, str(document_id), "viewer")


@documents_router.delete("/{document_id}")
async def delete_document(
    document_id: str, auth_session=Depends(auth_client.require_session)
):
    with Session(engine) as db_session:
        shared_with = db_session.exec(
            select(Document.shared_with).where(col(Document.id) == document_id)
        ).first()

        if shared_with is None:
            raise HTTPException(status_code=404, detail="Document not found")

        # Remove the relationship tuple from FGA
        user = auth_session.get("user")
        await authorization_manager.delete_relation(user.get("email"), str(document_id))

        # Delete the shared_with relationships from FGA
        for shared_with_email in shared_with:
            await authorization_manager.delete_relation(
                shared_with_email, str(document_id), "viewer"
            )

        # Delete the document from the database
        db_session.exec(delete(Document).where(col(Document.id) == document_id))
        db_session.commit()

        return {"message": "Document deleted successfully"}

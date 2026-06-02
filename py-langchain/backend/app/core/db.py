from sqlmodel import Session, create_engine, SQLModel, text

from app.models import models
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL)


def init_db():
    # Enable vector extension
    with Session(engine) as db_session:
        db_session.exec(text("CREATE EXTENSION IF NOT EXISTS vector"))
        db_session.commit()

    SQLModel.metadata.create_all(engine)

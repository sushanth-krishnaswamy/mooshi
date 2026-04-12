from sqlalchemy import create_engine, Column, String, Boolean, DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
import uuid
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://mooshi:mooshi@localhost/mooshi_db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Tag(Base):
    __tablename__ = "tags"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    color = Column(String, nullable=False)

class Folder(Base):
    __tablename__ = "folders"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'task' or 'note'

class Task(Base):
    __tablename__ = "tasks"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    status = Column(String, default="active")
    dueDate = Column(String, nullable=True)
    folderId = Column(String, ForeignKey("folders.id"), nullable=True)
    noteId = Column(String, nullable=True)
    tags = Column(JSON, default=list)  # Store list of tag IDs
    order = Column(Integer, default=0)
    createdAt = Column(String, default=lambda: datetime.utcnow().isoformat())
    updatedAt = Column(String, default=lambda: datetime.utcnow().isoformat())

class Note(Base):
    __tablename__ = "notes"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    status = Column(String, default="active")
    folderId = Column(String, ForeignKey("folders.id"), nullable=True)
    tags = Column(JSON, default=list)
    tasks = Column(JSON, default=list)
    images = Column(JSON, default=list)
    createdAt = Column(String, default=lambda: datetime.utcnow().isoformat())
    updatedAt = Column(String, default=lambda: datetime.utcnow().isoformat())

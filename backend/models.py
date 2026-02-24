import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Table, text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from database import Base

# Association tables for many-to-many relationships
note_tags = Table(
    'note_tags', Base.metadata,
    Column('note_id', String, ForeignKey('notes.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', String, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

task_tags = Table(
    'task_tags', Base.metadata,
    Column('task_id', String, ForeignKey('tasks.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', String, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)

class Folder(Base):
    __tablename__ = 'folders'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    type = Column(String, nullable=False) # 'task' or 'note'
    
    notes = relationship("Note", back_populates="folder")
    tasks = relationship("Task", back_populates="folder")


class Tag(Base):
    __tablename__ = 'tags'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True)
    color = Column(String, nullable=False)


class Note(Base):
    __tablename__ = 'notes'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    content = Column(String, nullable=False, default="") # Markdown HTML string
    status = Column(String, nullable=False, default="active") # 'active', 'archived', 'deleted'
    folder_id = Column(String, ForeignKey('folders.id', ondelete='SET NULL'), nullable=True)
    images = Column(JSONB, nullable=True) # Arary of image URLs
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    folder = relationship("Folder", back_populates="notes")
    tags = relationship("Tag", secondary=note_tags, lazy='joined')
    tasks = relationship("Task", back_populates="note")


class Task(Base):
    __tablename__ = 'tasks'
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    completed = Column(Boolean, default=False)
    status = Column(String, nullable=False, default="active") # 'active', 'completed', 'deleted'
    due_date = Column(String, nullable=True)
    folder_id = Column(String, ForeignKey('folders.id', ondelete='SET NULL'), nullable=True)
    note_id = Column(String, ForeignKey('notes.id', ondelete='SET NULL'), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    folder = relationship("Folder", back_populates="tasks")
    note = relationship("Note", back_populates="tasks")
    tags = relationship("Tag", secondary=task_tags, lazy='joined')

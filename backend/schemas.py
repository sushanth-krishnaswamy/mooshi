from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str
    color: str

class TagCreate(TagBase):
    pass

class TagSchema(TagBase):
    id: str

    class Config:
        orm_mode = True

class FolderBase(BaseModel):
    name: str
    type: str

class FolderCreate(FolderBase):
    pass

class FolderSchema(FolderBase):
    id: str

    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    status: str = "active"
    dueDate: Optional[str] = None
    folderId: Optional[str] = None
    noteId: Optional[str] = None
    tags: List[str] = []
    order: int = 0

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    dueDate: Optional[str] = None
    folderId: Optional[str] = None
    noteId: Optional[str] = None
    tags: Optional[List[str]] = None
    order: Optional[int] = None

class TaskSchema(TaskBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        orm_mode = True

class NoteBase(BaseModel):
    title: str
    content: str
    status: str = "active"
    folderId: Optional[str] = None
    tags: List[str] = []
    tasks: List[str] = []
    images: List[str] = []

class NoteCreate(NoteBase):
    pass

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    folderId: Optional[str] = None
    tags: Optional[List[str]] = None
    tasks: Optional[List[str]] = None
    images: Optional[List[str]] = None

class NoteSchema(NoteBase):
    id: str
    createdAt: str
    updatedAt: str

    class Config:
        orm_mode = True

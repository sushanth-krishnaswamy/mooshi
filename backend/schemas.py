from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str
    color: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: str
    class Config:
        from_attributes = True

class FolderBase(BaseModel):
    name: str
    type: str

class FolderCreate(FolderBase):
    pass

class Folder(FolderBase):
    id: str
    class Config:
        from_attributes = True

class NoteBase(BaseModel):
    title: str
    content: str = ""
    status: str = "active"
    folder_id: Optional[str] = None
    images: Optional[List[str]] = []
    
class NoteCreate(NoteBase):
    tags: List[str] = [] # Expecting a list of Tag IDs from the frontend
    tasks: List[str] = [] # Optional list of Task IDs to associate

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    status: Optional[str] = None
    folder_id: Optional[str] = None
    images: Optional[List[str]] = None
    tags: Optional[List[str]] = None

class Note(NoteBase):
    id: str
    created_at: datetime
    updated_at: datetime
    tags: List[Tag] = []
    # Optional field since the frontend `Note` expecting strings for simplicity in the Zustand store 
    # we will modify our response to return IDs
    
    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False
    status: str = "active"
    due_date: Optional[str] = None
    folder_id: Optional[str] = None
    note_id: Optional[str] = None

class TaskCreate(TaskBase):
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    completed: Optional[bool] = None
    status: Optional[str] = None
    due_date: Optional[str] = None
    folder_id: Optional[str] = None
    note_id: Optional[str] = None
    tags: Optional[List[str]] = None

class Task(TaskBase):
    id: str
    created_at: datetime
    updated_at: datetime
    tags: List[Tag] = []
    
    class Config:
        from_attributes = True

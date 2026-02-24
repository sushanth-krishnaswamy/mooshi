import uuid
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from database import engine, get_db, Base
import models, schemas

# Initialize the db models
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Helper: Convert model to frontend friendly dict mapping tag IDs instead of full tag objects
def format_entity(record, is_note=False):
    res = {column.name: getattr(record, column.name) for column in record.__table__.columns}
    res["tags"] = [tag.id for tag in record.tags]
    if getattr(record, 'due_date', None):
        res["dueDate"] = record.due_date
    if getattr(record, 'folder_id', None) is not None:
        res["folderId"] = record.folder_id
    if getattr(record, 'note_id', None) is not None:
        res["noteId"] = record.note_id
    res["createdAt"] = record.created_at.isoformat()
    res["updatedAt"] = record.updated_at.isoformat()
    if is_note:
        res["tasks"] = [task.id for task in record.tasks]
    return res


@app.get("/api/state")
def get_initial_state(db: Session = Depends(get_db)):
    """Fetch all data to prime the frontend Zustand store"""
    folders = [{"id": f.id, "name": f.name, "type": f.type} for f in db.query(models.Folder).all()]
    tags = [{"id": t.id, "name": t.name, "color": t.color} for t in db.query(models.Tag).all()]
    tasks = [format_entity(t, is_note=False) for t in db.query(models.Task).all()]
    notes = [format_entity(n, is_note=True) for n in db.query(models.Note).all()]
    
    return {
        "folders": folders,
        "tags": tags,
        "tasks": tasks,
        "notes": notes
    }


# ==================================
# FOLDERS & TAGS
# ==================================

@app.post("/api/folders")
def create_folder(folder: schemas.Folder, db: Session = Depends(get_db)):
    db_folder = models.Folder(id=folder.id, name=folder.name, type=folder.type)
    db.add(db_folder)
    db.commit()
    return {"status": "success"}

@app.delete("/api/folders/{folder_id}")
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if db_folder:
        db.delete(db_folder)
        db.commit()
    return {"status": "success"}

@app.put("/api/folders/{folder_id}")
def update_folder(folder_id: str, req: schemas.FolderBase, db: Session = Depends(get_db)):
     db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
     if db_folder:
         db_folder.name = req.name
         db_folder.type = req.type
         db.commit()
     return {"status": "success"}

@app.post("/api/tags")
def create_tag(tag: schemas.Tag, db: Session = Depends(get_db)):
    db_tag = models.Tag(id=tag.id, name=tag.name, color=tag.color)
    db.add(db_tag)
    db.commit()
    return {"status": "success"}

@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if db_tag:
        db.delete(db_tag)
        db.commit()
    return {"status": "success"}


# ==================================
# TASKS
# ==================================

@app.post("/api/tasks")
def create_task(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Accept raw JSON from frontend (camelCase fields) and map to DB model."""
    db_task = models.Task(
        id=payload.get("id", str(uuid.uuid4())),
        title=payload["title"],
        description=payload.get("description"),
        completed=payload.get("completed", False),
        status=payload.get("status", "active"),
        due_date=payload.get("dueDate"),
        folder_id=payload.get("folderId"),
        note_id=payload.get("noteId"),
    )

    # Resolve tags array from client (List of tag string IDs)
    tag_ids = payload.get("tags", [])
    if tag_ids:
        db_tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_task.tags = db_tags

    db.add(db_task)
    db.commit()
    return {"status": "success"}

@app.put("/api/tasks/{task_id}")
def update_task(task_id: str, req: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if 'title' in req: task.title = req['title']
    if 'description' in req: task.description = req['description']
    if 'completed' in req: task.completed = req['completed']
    if 'status' in req: task.status = req['status']
    if 'dueDate' in req: task.due_date = req['dueDate']
    if 'folderId' in req: task.folder_id = req['folderId']
    if 'noteId' in req: task.note_id = req['noteId']

    if 'tags' in req:
        db_tags = db.query(models.Tag).filter(models.Tag.id.in_(req['tags'])).all()
        task.tags = db_tags

    db.commit()
    return {"status": "success"}

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if task:
        db.delete(task)
        db.commit()
    return {"status": "success"}


# ==================================
# NOTES
# ==================================

@app.post("/api/notes")
def create_note(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Accept raw JSON from frontend (camelCase fields) and map to DB model."""
    db_note = models.Note(
        id=payload.get("id", str(uuid.uuid4())),
        title=payload["title"],
        content=payload.get("content", ""),
        status=payload.get("status", "active"),
        folder_id=payload.get("folderId"),
        images=payload.get("images"),
    )
    
    tag_ids = payload.get("tags", [])
    if tag_ids:
        db_tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_note.tags = db_tags

    db.add(db_note)
    db.commit()
    return {"status": "success"}

@app.put("/api/notes/{note_id}")
def update_note(note_id: str, req: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if 'title' in req: note.title = req['title']
    if 'content' in req: note.content = req['content']
    if 'status' in req: note.status = req['status']
    if 'folderId' in req: note.folder_id = req['folderId']
    if 'images' in req: note.images = req['images']

    if 'tags' in req:
        db_tags = db.query(models.Tag).filter(models.Tag.id.in_(req['tags'])).all()
        note.tags = db_tags

    db.commit()
    return {"status": "success"}

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if note:
        db.delete(note)
        db.commit()
    return {"status": "success"}

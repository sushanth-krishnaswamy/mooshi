from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

import models
import schemas
from models import SessionLocal, engine

app = FastAPI()

# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://0.0.0.0:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.get("/api/health")
def health_check():
    return {"status": "Backend is running!"}

# --- Tasks ---
@app.get("/api/tasks", response_model=List[schemas.TaskSchema])
def get_tasks(db: Session = Depends(get_db)):
    return db.query(models.Task).all()

@app.post("/api/tasks", response_model=schemas.TaskSchema)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    db_task = models.Task(**task.dict())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@app.put("/api/tasks/{task_id}", response_model=schemas.TaskSchema)
def update_task(task_id: str, task: schemas.TaskUpdate, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    update_data = task.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)

    db_task.updatedAt = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(db_task)
    return db_task

@app.delete("/api/tasks/{task_id}")
def delete_task(task_id: str, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return {"ok": True}

@app.put("/api/tasks/reorder/batch")
def reorder_tasks(updates: List[dict], db: Session = Depends(get_db)):
    for update in updates:
        db_task = db.query(models.Task).filter(models.Task.id == update['id']).first()
        if db_task:
            db_task.order = update['order']
            db_task.updatedAt = datetime.utcnow().isoformat()
    db.commit()
    return {"ok": True}

# --- Notes ---
@app.get("/api/notes", response_model=List[schemas.NoteSchema])
def get_notes(db: Session = Depends(get_db)):
    return db.query(models.Note).all()

@app.post("/api/notes", response_model=schemas.NoteSchema)
def create_note(note: schemas.NoteCreate, db: Session = Depends(get_db)):
    db_note = models.Note(**note.dict())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

@app.put("/api/notes/{note_id}", response_model=schemas.NoteSchema)
def update_note(note_id: str, note: schemas.NoteUpdate, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")

    update_data = note.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_note, key, value)

    db_note.updatedAt = datetime.utcnow().isoformat()
    db.commit()
    db.refresh(db_note)
    return db_note

@app.delete("/api/notes/{note_id}")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    db_note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not db_note:
        raise HTTPException(status_code=404, detail="Note not found")
    db.delete(db_note)
    db.commit()
    return {"ok": True}

# --- Folders ---
@app.get("/api/folders", response_model=List[schemas.FolderSchema])
def get_folders(db: Session = Depends(get_db)):
    return db.query(models.Folder).all()

@app.post("/api/folders", response_model=schemas.FolderSchema)
def create_folder(folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = models.Folder(**folder.dict())
    db.add(db_folder)
    db.commit()
    db.refresh(db_folder)
    return db_folder

@app.put("/api/folders/{folder_id}", response_model=schemas.FolderSchema)
def update_folder(folder_id: str, folder: schemas.FolderCreate, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    for key, value in folder.dict().items():
        setattr(db_folder, key, value)

    db.commit()
    db.refresh(db_folder)
    return db_folder

@app.delete("/api/folders/{folder_id}")
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    db_folder = db.query(models.Folder).filter(models.Folder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    db.delete(db_folder)
    db.commit()
    return {"ok": True}

# --- Tags ---
@app.get("/api/tags", response_model=List[schemas.TagSchema])
def get_tags(db: Session = Depends(get_db)):
    return db.query(models.Tag).all()

@app.post("/api/tags", response_model=schemas.TagSchema)
def create_tag(tag: schemas.TagCreate, db: Session = Depends(get_db)):
    db_tag = models.Tag(**tag.dict())
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    db_tag = db.query(models.Tag).filter(models.Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    db.delete(db_tag)
    db.commit()
    return {"ok": True}

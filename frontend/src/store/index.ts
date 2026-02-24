import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Note, Folder, Tag } from '../types';

const API_BASE_URL = 'http://localhost:8000/api';

interface AppState {
    tasks: Task[];
    notes: Note[];
    folders: Folder[];
    tags: Tag[];

    // Data Loading
    initialize: () => Promise<void>;

    // Task actions
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateTask: (id: string, task: Partial<Task>) => void;
    deleteTask: (id: string) => void;
    permanentlyDeleteTask: (id: string) => void;
    restoreTask: (id: string) => void;
    toggleTask: (id: string) => void;

    // Note actions
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateNote: (id: string, note: Partial<Note>) => void;
    deleteNote: (id: string) => void;
    permanentlyDeleteNote: (id: string) => void;
    archiveNote: (id: string) => void;
    restoreNote: (id: string) => void;

    // Folder actions
    addFolder: (folder: Omit<Folder, 'id'>) => void;
    updateFolder: (id: string, folder: Partial<Folder>) => void;
    deleteFolder: (id: string) => void;

    // Tag actions
    addTag: (tag: Omit<Tag, 'id'>) => string;
    deleteTag: (id: string) => void;
}

export const useAppStore = create<AppState>()((set) => ({
    tasks: [],
    notes: [],
    folders: [],
    tags: [],

    initialize: async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/state`);
            if (!response.ok) throw new Error("Failed to fetch state");

            const data = await response.json();
            set({
                folders: data.folders || [],
                tags: data.tags || [],
                tasks: data.tasks || [],
                notes: data.notes || []
            });
        } catch (error) {
            console.error("Error initializing app state:", error);
            // Fallback for initial UI run if backend isn't up
            set({
                folders: [
                    { id: '1', name: 'Personal', type: 'task' },
                    { id: '2', name: 'Work', type: 'task' },
                    { id: '3', name: 'Journals', type: 'note' },
                ],
                tags: [
                    { id: '1', name: 'Important', color: '#ef4444' },
                ],
            });
        }
    },

    addTask: (taskData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newTask: Task = { ...taskData, id, status: taskData.status ?? 'active', createdAt: now, updatedAt: now };

        // Optimistic UI Update
        set((state) => ({ tasks: [...state.tasks, newTask] }));

        // Background Sync
        fetch(`${API_BASE_URL}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newTask)
        }).catch(err => console.error("Failed to add task to backend:", err));

        return id;
    },

    updateTask: (id, taskUpdate) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, ...taskUpdate, updatedAt: new Date().toISOString() } : t
            ),
        }));

        fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskUpdate)
        }).catch(err => console.error("Failed to update task on backend:", err));
    },

    deleteTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, status: 'deleted' as const, updatedAt: new Date().toISOString() } : t
            )
        }));

        fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'deleted' })
        });
    },

    permanentlyDeleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        fetch(`${API_BASE_URL}/tasks/${id}`, { method: 'DELETE' });
    },

    restoreTask: (id) => {
        set((state) => ({
            tasks: state.tasks.map((t) =>
                t.id === id ? { ...t, status: 'active' as const, completed: false, updatedAt: new Date().toISOString() } : t
            )
        }));

        fetch(`${API_BASE_URL}/tasks/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active', completed: false })
        });
    },

    toggleTask: (id) => {
        set((state) => {
            const task = state.tasks.find(t => t.id === id);
            if (!task) return state;

            const newCompleted = !task.completed;
            const newStatus = newCompleted ? 'completed' : 'active';
            const updatedTasks = state.tasks.map(t =>
                t.id === id ? { ...t, completed: newCompleted, status: newStatus as Task['status'], updatedAt: new Date().toISOString() } : t
            );

            // Async trigger backend update immediately
            fetch(`${API_BASE_URL}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: newCompleted, status: newStatus })
            });

            let updatedNotes = state.notes;
            if (task.noteId) {
                const note = state.notes.find(n => n.id === task.noteId);
                if (note) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(note.content, 'text/html');
                    const taskNodes = doc.querySelectorAll('li[data-type="taskItem"]');

                    Array.from(taskNodes).forEach(node => {
                        if (node.textContent?.trim() === task.title) {
                            node.setAttribute('data-checked', newCompleted ? 'true' : 'false');
                        }
                    });

                    const newContent = doc.body.innerHTML;

                    updatedNotes = state.notes.map(n => {
                        if (n.id === task.noteId) {
                            // Async trigger backend update immediately
                            fetch(`${API_BASE_URL}/notes/${n.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content: newContent })
                            });

                            return { ...n, content: newContent, updatedAt: new Date().toISOString() };
                        }
                        return n;
                    });
                }
            }

            return {
                tasks: updatedTasks,
                notes: updatedNotes
            };
        });
    },

    addNote: (noteData) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newNote: Note = { ...noteData, id, status: noteData.status ?? 'active', createdAt: now, updatedAt: now };

        // Parse extracted tasks
        const parser = new DOMParser();
        const doc = parser.parseFromString(noteData.content, 'text/html');
        const taskNodes = doc.querySelectorAll('li[data-type="taskItem"]');
        const newTasks: Task[] = [];

        Array.from(taskNodes).forEach(node => {
            const text = node.textContent?.trim() || '';
            if (!text) return;
            const checked = node.getAttribute('data-checked') === 'true';

            const extractedTask = {
                id: uuidv4(),
                title: text,
                completed: checked,
                status: checked ? 'completed' : 'active',
                noteId: id,
                folderId: noteData.folderId,
                tags: [],
                createdAt: now,
                updatedAt: now
            };

            newTasks.push(extractedTask as Task);

            // Sync extracted task
            fetch(`${API_BASE_URL}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(extractedTask)
            });
        });

        set((state) => ({
            notes: [...state.notes, newNote],
            tasks: [...state.tasks, ...newTasks]
        }));

        // Sync note
        fetch(`${API_BASE_URL}/notes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNote)
        });

        return id;
    },

    updateNote: (id, noteUpdate) => {
        set((state) => {
            let updatedTasks = state.tasks;
            if (noteUpdate.content !== undefined) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(noteUpdate.content, 'text/html');
                const taskNodes = doc.querySelectorAll('li[data-type="taskItem"]');

                const extractedTasks = Array.from(taskNodes).map((node) => {
                    const text = node.textContent?.trim() || '';
                    const checked = node.getAttribute('data-checked') === 'true';
                    return { text, checked };
                }).filter(et => et.text);

                const existingForNote = state.tasks.filter(t => t.noteId === id);
                const newTasksList = state.tasks.filter(t => t.noteId !== id);

                const now = new Date().toISOString();
                const noteFolderName = state.notes.find(n => n.id === id)?.folderId;

                extractedTasks.forEach(et => {
                    const existing = existingForNote.find(t => t.title === et.text);
                    if (existing) {
                        const updatedTask = {
                            ...existing,
                            completed: et.checked,
                            folderId: noteFolderName,
                            updatedAt: now
                        };
                        newTasksList.push(updatedTask);

                        // Async remote PUT call to append to sync queue
                        fetch(`${API_BASE_URL}/tasks/${updatedTask.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ completed: updatedTask.completed, folderId: updatedTask.folderId })
                        });

                    } else {
                        const newTask: Task = {
                            id: uuidv4(),
                            title: et.text,
                            completed: et.checked,
                            status: et.checked ? 'completed' : 'active',
                            noteId: id,
                            folderId: noteFolderName,
                            tags: [],
                            createdAt: now,
                            updatedAt: now
                        };
                        newTasksList.push(newTask);

                        // Async POST
                        fetch(`${API_BASE_URL}/tasks`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(newTask)
                        });
                    }
                });

                updatedTasks = newTasksList;
            }

            return {
                tasks: updatedTasks,
                notes: state.notes.map((n) =>
                    n.id === id ? { ...n, ...noteUpdate, updatedAt: new Date().toISOString() } : n
                ),
            };
        });

        fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(noteUpdate)
        });
    },

    deleteNote: (id) => {
        set((state) => ({
            notes: state.notes.map((n) =>
                n.id === id ? { ...n, status: 'deleted' as const, updatedAt: new Date().toISOString() } : n
            )
        }));
        fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'deleted' })
        });
    },

    permanentlyDeleteNote: (id) => {
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
        fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
    },

    archiveNote: (id) => {
        set((state) => ({
            notes: state.notes.map((n) =>
                n.id === id ? { ...n, status: 'archived' as const, updatedAt: new Date().toISOString() } : n
            )
        }));
        fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' })
        });
    },

    restoreNote: (id) => {
        set((state) => ({
            notes: state.notes.map((n) =>
                n.id === id ? { ...n, status: 'active' as const, updatedAt: new Date().toISOString() } : n
            )
        }));

        fetch(`${API_BASE_URL}/notes/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' })
        });
    },

    addFolder: (folderData) => {
        const id = uuidv4();
        const payload = { ...folderData, id };
        set((state) => ({ folders: [...state.folders, payload] }));
        fetch(`${API_BASE_URL}/folders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    },

    updateFolder: (id, folderUpdate) => {
        set((state) => ({
            folders: state.folders.map((f) => (f.id === id ? { ...f, ...folderUpdate } : f)),
        }));
        fetch(`${API_BASE_URL}/folders/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(folderUpdate)
        });
    },

    deleteFolder: (id) => {
        set((state) => ({
            folders: state.folders.filter((f) => f.id !== id),
            tasks: state.tasks.map((t) => (t.folderId === id ? { ...t, folderId: undefined } : t)),
            notes: state.notes.map((n) => (n.folderId === id ? { ...n, folderId: undefined } : n)),
        }));
        fetch(`${API_BASE_URL}/folders/${id}`, { method: 'DELETE' });
    },

    addTag: (tagData) => {
        const id = uuidv4();
        const payload = { ...tagData, id };
        set((state) => ({ tags: [...state.tags, payload] }));
        fetch(`${API_BASE_URL}/tags`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return id;
    },

    deleteTag: (id) => {
        set((state) => ({
            tags: state.tags.filter((t) => t.id !== id),
            tasks: state.tasks.map((t) => ({ ...t, tags: t.tags.filter((tagId) => tagId !== id) })),
            notes: state.notes.map((n) => ({ ...n, tags: n.tags.filter((tagId) => tagId !== id) })),
        }));
        fetch(`${API_BASE_URL}/tags/${id}`, { method: 'DELETE' });
    },
}));

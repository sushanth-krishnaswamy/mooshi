import { create } from 'zustand';
import type { Task, Note, Folder, Tag } from '../types';

const API_BASE = 'http://localhost:8000/api';

interface AppState {
    tasks: Task[];
    notes: Note[];
    folders: Folder[];
    tags: Tag[];

    fetchInitialData: () => Promise<void>;

    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<string>;
    updateTask: (id: string, task: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    permanentlyDeleteTask: (id: string) => Promise<void>;
    restoreTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    reorderTasks: (updates: { id: string, order: number }[]) => Promise<void>;

    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateNote: (id: string, note: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    permanentlyDeleteNote: (id: string) => Promise<void>;
    archiveNote: (id: string) => Promise<void>;
    restoreNote: (id: string) => Promise<void>;

    addFolder: (folder: Omit<Folder, 'id'>) => Promise<void>;
    updateFolder: (id: string, folder: Partial<Folder>) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;

    addTag: (tag: Omit<Tag, 'id'>) => Promise<string>;
    deleteTag: (id: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
    tasks: [],
    notes: [],
    folders: [],
    tags: [],

    fetchInitialData: async () => {
        try {
            const [tasksRes, notesRes, foldersRes, tagsRes] = await Promise.all([
                fetch(`${API_BASE}/tasks`),
                fetch(`${API_BASE}/notes`),
                fetch(`${API_BASE}/folders`),
                fetch(`${API_BASE}/tags`)
            ]);

            const tasks = await tasksRes.json();
            const notes = await notesRes.json();
            const folders = await foldersRes.json();
            const tags = await tagsRes.json();

            set({ tasks, notes, folders, tags });
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        }
    },

    addTask: async (taskData) => {
        try {
            const newTaskData = { ...taskData, status: taskData.status ?? 'active', completed: false, order: get().tasks.length };
            const response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTaskData)
            });
            const newTask = await response.json();
            set((state) => ({ tasks: [...state.tasks, newTask] }));
            return newTask.id;
        } catch (error) {
            console.error('Failed to add task:', error);
            return '';
        }
    },

    updateTask: async (id, taskUpdate) => {
        try {
            const response = await fetch(`${API_BASE}/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskUpdate)
            });
            const updatedTask = await response.json();
            set((state) => ({
                tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
            }));
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    },

    deleteTask: async (id) => {
        const store = get();
        await store.updateTask(id, { status: 'deleted' });
    },

    permanentlyDeleteTask: async (id) => {
        try {
            await fetch(`${API_BASE}/tasks/${id}`, { method: 'DELETE' });
            set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
        } catch (error) {
            console.error('Failed to permanently delete task:', error);
        }
    },

    restoreTask: async (id) => {
        const store = get();
        await store.updateTask(id, { status: 'active', completed: false });
    },

    toggleTask: async (id) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        const newStatus = newCompleted ? 'completed' : 'active';

        await state.updateTask(id, { completed: newCompleted, status: newStatus });

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

                await state.updateNote(task.noteId, { content: doc.body.innerHTML });
            }
        }
    },

    reorderTasks: async (updates) => {
        try {
            await fetch(`${API_BASE}/tasks/reorder/batch`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });

            set((state) => {
                const tasksCopy = [...state.tasks];
                for (const update of updates) {
                    const idx = tasksCopy.findIndex(t => t.id === update.id);
                    if (idx !== -1) {
                        tasksCopy[idx] = { ...tasksCopy[idx], order: update.order };
                    }
                }
                return { tasks: tasksCopy };
            });
        } catch (error) {
            console.error('Failed to reorder tasks:', error);
        }
    },

    addNote: async (noteData) => {
        try {
            const response = await fetch(`${API_BASE}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...noteData, status: noteData.status ?? 'active' })
            });
            const newNote = await response.json();

            const parser = new DOMParser();
            const doc = parser.parseFromString(noteData.content, 'text/html');
            const taskNodes = doc.querySelectorAll('li[data-type="taskItem"]');

            const state = get();
            for (const node of Array.from(taskNodes)) {
                const text = node.textContent?.trim() || '';
                if (!text) continue;
                const checked = node.getAttribute('data-checked') === 'true';
                await state.addTask({
                    title: text,
                    completed: checked,
                    status: checked ? 'completed' : 'active',
                    noteId: newNote.id,
                    folderId: noteData.folderId,
                    tags: []
                });
            }

            set((state) => ({ notes: [...state.notes, newNote] }));
            return newNote.id;
        } catch (error) {
            console.error('Failed to add note:', error);
            return '';
        }
    },

    updateNote: async (id, noteUpdate) => {
        try {
            const state = get();

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
                const noteFolderName = state.notes.find(n => n.id === id)?.folderId;

                for (const et of extractedTasks) {
                    const existing = existingForNote.find(t => t.title === et.text);
                    if (existing) {
                        await state.updateTask(existing.id, { completed: et.checked, folderId: noteFolderName });
                    } else {
                        await state.addTask({
                            title: et.text,
                            completed: et.checked,
                            status: et.checked ? 'completed' : 'active',
                            noteId: id,
                            folderId: noteFolderName,
                            tags: []
                        });
                    }
                }
            }

            const response = await fetch(`${API_BASE}/notes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(noteUpdate)
            });
            const updatedNote = await response.json();

            set((state) => ({
                notes: state.notes.map((n) => (n.id === id ? updatedNote : n)),
            }));
        } catch (error) {
            console.error('Failed to update note:', error);
        }
    },

    deleteNote: async (id) => {
        const store = get();
        await store.updateNote(id, { status: 'deleted' });
    },

    permanentlyDeleteNote: async (id) => {
        try {
            await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
            set((state) => ({ notes: state.notes.filter((n) => n.id !== id) }));
        } catch (error) {
            console.error('Failed to permanently delete note:', error);
        }
    },

    archiveNote: async (id) => {
        const store = get();
        await store.updateNote(id, { status: 'archived' });
    },

    restoreNote: async (id) => {
        const store = get();
        await store.updateNote(id, { status: 'active' });
    },

    addFolder: async (folderData) => {
        try {
            const response = await fetch(`${API_BASE}/folders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(folderData)
            });
            const newFolder = await response.json();
            set((state) => ({ folders: [...state.folders, newFolder] }));
        } catch (error) {
            console.error('Failed to add folder:', error);
        }
    },

    updateFolder: async (id, folderUpdate) => {
        try {
            const response = await fetch(`${API_BASE}/folders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(folderUpdate)
            });
            const updatedFolder = await response.json();
            set((state) => ({
                folders: state.folders.map((f) => (f.id === id ? updatedFolder : f)),
            }));
        } catch (error) {
            console.error('Failed to update folder:', error);
        }
    },

    deleteFolder: async (id) => {
        try {
            await fetch(`${API_BASE}/folders/${id}`, { method: 'DELETE' });
            const state = get();

            for (const t of state.tasks.filter(t => t.folderId === id)) {
                await state.updateTask(t.id, { folderId: undefined });
            }
            for (const n of state.notes.filter(n => n.folderId === id)) {
                await state.updateNote(n.id, { folderId: undefined });
            }

            set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));
        } catch (error) {
            console.error('Failed to delete folder:', error);
        }
    },

    addTag: async (tagData) => {
        try {
            const response = await fetch(`${API_BASE}/tags`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tagData)
            });
            const newTag = await response.json();
            set((state) => ({ tags: [...state.tags, newTag] }));
            return newTag.id;
        } catch (error) {
            console.error('Failed to add tag:', error);
            return '';
        }
    },

    deleteTag: async (id) => {
        try {
            await fetch(`${API_BASE}/tags/${id}`, { method: 'DELETE' });
            const state = get();

            for (const t of state.tasks.filter(t => t.tags.includes(id))) {
                await state.updateTask(t.id, { tags: t.tags.filter(tagId => tagId !== id) });
            }
            for (const n of state.notes.filter(n => n.tags.includes(id))) {
                await state.updateNote(n.id, { tags: n.tags.filter(tagId => tagId !== id) });
            }

            set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    },
}));

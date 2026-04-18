import { create } from 'zustand';
import type { Task, Note, Folder, Tag } from '../types';
import { Platform } from 'react-native';

// For Android emulator it should be 10.0.2.2, for iOS simulator it's localhost
// In a real device you should replace this with your local machine IP.
const getApiBase = () => {
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8000/api';
    }
    return 'http://localhost:8000/api';
};

const API_BASE = getApiBase();

interface AppState {
    tasks: Task[];
    notes: Note[];
    folders: Folder[];
    tags: Tag[];
    isLoading: boolean;
    error: string | null;

    fetchInitialData: () => Promise<void>;

    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<string>;
    updateTask: (id: string, task: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    permanentlyDeleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;

    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
    updateNote: (id: string, note: Partial<Note>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;

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
    isLoading: false,
    error: null,

    fetchInitialData: async () => {
        set({ isLoading: true, error: null });
        try {
            const [tasksRes, notesRes, foldersRes, tagsRes] = await Promise.all([
                fetch(`${API_BASE}/tasks`),
                fetch(`${API_BASE}/notes`),
                fetch(`${API_BASE}/folders`),
                fetch(`${API_BASE}/tags`)
            ]);

            if (!tasksRes.ok || !notesRes.ok) throw new Error('Failed to fetch data');

            const [tasks, notes, folders, tags] = await Promise.all([
                tasksRes.json(),
                notesRes.json(),
                foldersRes.json(),
                tagsRes.json()
            ]);

            set({ tasks, notes, folders, tags, isLoading: false });
        } catch (error: any) {
            console.error('Failed to fetch initial data:', error);
            set({ error: error.message, isLoading: false });
        }
    },

    addTask: async (taskData) => {
        try {
            const response = await fetch(`${API_BASE}/tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(taskData)
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

    toggleTask: async (id) => {
        const state = get();
        const task = state.tasks.find(t => t.id === id);
        if (!task) return;

        const newCompleted = !task.completed;
        const newStatus = newCompleted ? 'completed' : 'active';

        await state.updateTask(id, { completed: newCompleted, status: newStatus });
    },

    addNote: async (noteData) => {
        try {
            const response = await fetch(`${API_BASE}/notes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...noteData, status: noteData.status ?? 'active' })
            });
            const newNote = await response.json();
            set((state) => ({ notes: [...state.notes, newNote] }));
            return newNote.id;
        } catch (error) {
            console.error('Failed to add note:', error);
            return '';
        }
    },

    updateNote: async (id, noteUpdate) => {
        try {
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
            set((state) => ({ tags: state.tags.filter((t) => t.id !== id) }));
        } catch (error) {
            console.error('Failed to delete tag:', error);
        }
    },
}));

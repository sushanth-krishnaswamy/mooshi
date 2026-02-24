import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Note, Folder, Tag } from '../types';

interface AppState {
    tasks: Task[];
    notes: Note[];
    folders: Folder[];
    tags: Tag[];

    // Task actions
    addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateTask: (id: string, task: Partial<Task>) => void;
    deleteTask: (id: string) => void;          // soft-delete → status:'deleted'
    permanentlyDeleteTask: (id: string) => void; // hard delete
    restoreTask: (id: string) => void;         // deleted → active
    toggleTask: (id: string) => void;

    // Note actions
    addNote: (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => string;
    updateNote: (id: string, note: Partial<Note>) => void;
    deleteNote: (id: string) => void;              // soft-delete → status:'deleted'
    permanentlyDeleteNote: (id: string) => void;   // hard delete
    archiveNote: (id: string) => void;             // active → archived
    restoreNote: (id: string) => void;             // deleted/archived → active

    // Folder actions
    addFolder: (folder: Omit<Folder, 'id'>) => void;
    updateFolder: (id: string, folder: Partial<Folder>) => void;
    deleteFolder: (id: string) => void;

    // Tag actions
    addTag: (tag: Omit<Tag, 'id'>) => string;
    deleteTag: (id: string) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            tasks: [],
            notes: [],
            folders: [
                { id: '1', name: 'Personal', type: 'task' },
                { id: '2', name: 'Work', type: 'task' },
                { id: '3', name: 'Journals', type: 'note' },
            ],
            tags: [
                { id: '1', name: 'Important', color: '#ef4444' },
            ],

            addTask: (taskData) => {
                const id = uuidv4();
                const now = new Date().toISOString();
                const newTask: Task = { ...taskData, id, status: taskData.status ?? 'active', createdAt: now, updatedAt: now };
                set((state) => ({ tasks: [...state.tasks, newTask] }));
                return id;
            },
            updateTask: (id, taskUpdate) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, ...taskUpdate, updatedAt: new Date().toISOString() } : t
                    ),
                })),
            deleteTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, status: 'deleted' as const, updatedAt: new Date().toISOString() } : t
                    )
                })),
            permanentlyDeleteTask: (id) =>
                set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) })),
            restoreTask: (id) =>
                set((state) => ({
                    tasks: state.tasks.map((t) =>
                        t.id === id ? { ...t, status: 'active' as const, completed: false, updatedAt: new Date().toISOString() } : t
                    )
                })),
            toggleTask: (id) =>
                set((state) => {
                    const task = state.tasks.find(t => t.id === id);
                    if (!task) return state;

                    const newCompleted = !task.completed;
                    const newStatus = newCompleted ? 'completed' : 'active';
                    const updatedTasks = state.tasks.map(t =>
                        t.id === id ? { ...t, completed: newCompleted, status: newStatus as Task['status'], updatedAt: new Date().toISOString() } : t
                    );

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

                            updatedNotes = state.notes.map(n =>
                                n.id === task.noteId ? { ...n, content: doc.body.innerHTML, updatedAt: new Date().toISOString() } : n
                            );
                        }
                    }

                    return {
                        tasks: updatedTasks,
                        notes: updatedNotes
                    };
                }),

            addNote: (noteData) => {
                const id = uuidv4();
                const now = new Date().toISOString();
                const newNote: Note = { ...noteData, id, status: noteData.status ?? 'active', createdAt: now, updatedAt: now };

                // If initializing with tasks
                const parser = new DOMParser();
                const doc = parser.parseFromString(noteData.content, 'text/html');
                const taskNodes = doc.querySelectorAll('li[data-type="taskItem"]');
                const newTasks: Task[] = [];

                Array.from(taskNodes).forEach(node => {
                    const text = node.textContent?.trim() || '';
                    if (!text) return;
                    const checked = node.getAttribute('data-checked') === 'true';
                    newTasks.push({
                        id: uuidv4(),
                        title: text,
                        completed: checked,
                        status: checked ? 'completed' : 'active',
                        noteId: id,
                        folderId: noteData.folderId,
                        tags: [],
                        createdAt: now,
                        updatedAt: now
                    });
                });

                set((state) => ({
                    notes: [...state.notes, newNote],
                    tasks: [...state.tasks, ...newTasks]
                }));
                return id;
            },
            updateNote: (id, noteUpdate) =>
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
                        }).filter(et => et.text); // keep only non-empty

                        const existingForNote = state.tasks.filter(t => t.noteId === id);
                        const newTasksList = state.tasks.filter(t => t.noteId !== id);

                        const now = new Date().toISOString();
                        const noteFolderName = state.notes.find(n => n.id === id)?.folderId;

                        extractedTasks.forEach(et => {
                            const existing = existingForNote.find(t => t.title === et.text);
                            if (existing) {
                                newTasksList.push({
                                    ...existing,
                                    completed: et.checked,
                                    folderId: noteFolderName,
                                    updatedAt: now
                                });
                            } else {
                                newTasksList.push({
                                    id: uuidv4(),
                                    title: et.text,
                                    completed: et.checked,
                                    status: et.checked ? 'completed' : 'active',
                                    noteId: id,
                                    folderId: noteFolderName,
                                    tags: [],
                                    createdAt: now,
                                    updatedAt: now
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
                }),
            deleteNote: (id) =>
                set((state) => ({
                    notes: state.notes.map((n) =>
                        n.id === id ? { ...n, status: 'deleted' as const, updatedAt: new Date().toISOString() } : n
                    )
                })),
            permanentlyDeleteNote: (id) =>
                set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
            archiveNote: (id) =>
                set((state) => ({
                    notes: state.notes.map((n) =>
                        n.id === id ? { ...n, status: 'archived' as const, updatedAt: new Date().toISOString() } : n
                    )
                })),
            restoreNote: (id) =>
                set((state) => ({
                    notes: state.notes.map((n) =>
                        n.id === id ? { ...n, status: 'active' as const, updatedAt: new Date().toISOString() } : n
                    )
                })),

            addFolder: (folderData) => {
                const id = uuidv4();
                set((state) => ({ folders: [...state.folders, { ...folderData, id }] }));
            },
            updateFolder: (id, folderUpdate) =>
                set((state) => ({
                    folders: state.folders.map((f) => (f.id === id ? { ...f, ...folderUpdate } : f)),
                })),
            deleteFolder: (id) =>
                set((state) => ({
                    folders: state.folders.filter((f) => f.id !== id),
                    tasks: state.tasks.map((t) => (t.folderId === id ? { ...t, folderId: undefined } : t)),
                    notes: state.notes.map((n) => (n.folderId === id ? { ...n, folderId: undefined } : n)),
                })),

            addTag: (tagData) => {
                const id = uuidv4();
                set((state) => ({ tags: [...state.tags, { ...tagData, id }] }));
                return id;
            },
            deleteTag: (id) =>
                set((state) => ({
                    tags: state.tags.filter((t) => t.id !== id),
                    tasks: state.tasks.map((t) => ({ ...t, tags: t.tags.filter((tagId) => tagId !== id) })),
                    notes: state.notes.map((n) => ({ ...n, tags: n.tags.filter((tagId) => tagId !== id) })),
                })),
        }),
        {
            name: 'tasks-notes-storage',
        }
    )
);

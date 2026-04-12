export type EntityType = 'task' | 'note';

export interface Tag {
    id: string;
    name: string;
    color: string;
}

export interface Folder {
    id: string;
    name: string;
    type: EntityType;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    completed: boolean;
    status: 'active' | 'completed' | 'deleted';
    dueDate?: string; // ISO string without time or specific UTC
    folderId?: string;
    noteId?: string; // ID of the Note this task was extracted from
    tags: string[]; // Tag IDs
    order: number;
    createdAt: string;
    updatedAt: string;
}

export interface Note {
    id: string;
    title: string;
    content: string; // Markdown content
    status: 'active' | 'archived' | 'deleted';
    folderId?: string;
    tags: string[];
    tasks: string[]; // Associated task IDs
    images?: string[];
    createdAt: string;
    updatedAt: string;
}

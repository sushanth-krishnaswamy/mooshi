export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  status: 'active' | 'completed' | 'deleted';
  noteId?: string;
  folderId?: string;
  tags: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  status: 'active' | 'archived' | 'deleted';
  folderId?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}
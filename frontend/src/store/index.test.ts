import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from './index';

// Mock fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('useAppStore', () => {
    beforeEach(() => {
        useAppStore.setState({
            tasks: [],
            notes: [],
            folders: [],
            tags: []
        });
        fetchMock.mockClear();
    });

    it('addTask correctly updates the store', async () => {
        const mockTask = {
            id: 'test-id',
            title: 'Test Task',
            status: 'active',
            completed: false,
            order: 0,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve(mockTask)
        });

        const id = await useAppStore.getState().addTask({
            title: 'Test Task',
            tags: []
        });

        expect(id).toBe('test-id');
        expect(useAppStore.getState().tasks).toHaveLength(1);
        expect(useAppStore.getState().tasks[0]).toEqual(mockTask);

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/tasks', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"title":"Test Task"')
        }));
    });

    it('reorderTasks correctly modifies the order properties', async () => {
        const task1 = { id: 'id-1', title: 'Task 1', order: 0, completed: false, status: 'active', tags: [], createdAt: '', updatedAt: '' } as any;
        const task2 = { id: 'id-2', title: 'Task 2', order: 1, completed: false, status: 'active', tags: [], createdAt: '', updatedAt: '' } as any;

        useAppStore.setState({ tasks: [task1, task2] });

        fetchMock.mockResolvedValueOnce({
            json: () => Promise.resolve({ ok: true })
        });

        await useAppStore.getState().reorderTasks([
            { id: 'id-1', order: 1 },
            { id: 'id-2', order: 0 }
        ]);

        const tasks = useAppStore.getState().tasks;
        expect(tasks.find(t => t.id === 'id-1')?.order).toBe(1);
        expect(tasks.find(t => t.id === 'id-2')?.order).toBe(0);

        expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/api/tasks/reorder/batch', expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify([
                { id: 'id-1', order: 1 },
                { id: 'id-2', order: 0 }
            ])
        }));
    });
});

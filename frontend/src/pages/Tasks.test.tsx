import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Tasks } from './Tasks';
import { useAppStore } from '../store';
import { BrowserRouter } from 'react-router-dom';
import * as reactRouterDom from 'react-router-dom';

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}));

describe('Tasks Component', () => {
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue({
      tasks: [
        {
          id: '1',
          title: 'Dummy Task',
          status: 'active',
          completed: false,
          tags: [],
          order: 0,
          createdAt: '',
          updatedAt: ''
        },
      ],
      notes: [],
      tags: [],
      addTask: vi.fn(),
      updateTask: vi.fn(),
      toggleTask: vi.fn(),
      deleteTask: vi.fn(),
      permanentlyDeleteTask: vi.fn(),
      restoreTask: vi.fn(),
      reorderTasks: vi.fn(),
    });
  });

  it('renders a dummy task successfully', () => {
    render(
      <BrowserRouter>
        <Tasks />
      </BrowserRouter>
    );

    const taskTitle = screen.getByText('Dummy Task');
    expect(taskTitle).toBeInTheDocument();
  });
});

'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus } from 'lucide-react';
import TaskModal from '@/components/tasks/TaskModal';
import StackModal from '@/components/tasks/StackModal';
import KanbanBoard from '@/components/tasks/KanbanBoard';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TasksPage() {
    const { data: tasks, error: tasksError, isLoading: tasksLoading } = useSWR('/api/tasks', fetcher);
    const { data: stacks, error: stacksError, isLoading: stacksLoading } = useSWR('/api/tasks/stacks', fetcher);

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isStackModalOpen, setIsStackModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingTask, setEditingTask] = useState<any | null>(null);

    const handleCreateStack = async (name: string, color: string) => {
        try {
            const maxOrder = stacks?.length > 0 ? Math.max(...stacks.map((s: { order: number }) => s.order)) : 0;
            await fetch('/api/tasks/stacks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, color, order: maxOrder + 1 }),
            });
            mutate('/api/tasks/stacks');
        } catch (error) {
            console.error('Failed to create stack', error);
        }
    };

    const handleDeleteStack = async (stackId: number) => {
        if (!confirm('Delete this stack? Tasks will move to Unassigned.')) return;
        try {
            await fetch(`/api/tasks/stacks/${stackId}`, { method: 'DELETE' });
            mutate('/api/tasks/stacks');
            mutate('/api/tasks');
        } catch (error) {
            console.error('Failed to delete stack', error);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleTaskEdit = (task: any) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleTaskMove = async (taskId: number, newStackId: number | null, newOrder: number) => {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stackId: newStackId, order: newOrder }),
            });
            mutate('/api/tasks');
        } catch (error) {
            console.error('Failed to move task', error);
        }
    };

    const handleCloseTaskModal = () => {
        setIsTaskModalOpen(false);
        setEditingTask(null);
    };

    if (tasksLoading || stacksLoading) return <div className="p-8">Loading...</div>;
    if (tasksError || stacksError) return <div className="p-8 text-red-500">Error loading data</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
                <button
                    onClick={() => setIsTaskModalOpen(true)}
                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Task
                </button>
            </div>

            {/* Kanban Board */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
                <KanbanBoard
                    stacks={stacks || []}
                    tasks={tasks || []}
                    onTaskEdit={handleTaskEdit}
                    onTaskMove={handleTaskMove}
                    onStackDelete={handleDeleteStack}
                    onNewStack={() => setIsStackModalOpen(true)}
                />
            </div>

            {/* Modals */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                task={editingTask}
                stacks={stacks || []}
            />
            <StackModal
                isOpen={isStackModalOpen}
                onClose={() => setIsStackModalOpen(false)}
                onCreate={handleCreateStack}
            />
        </div>
    );
}

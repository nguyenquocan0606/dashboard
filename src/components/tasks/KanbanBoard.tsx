'use client';
import { useState } from 'react';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import TaskStack from './TaskStack';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';

interface Task {
    id: number;
    title: string;
    description?: string;
    dueDate?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: string;
    stackId?: number | null;
    order: number;
}

interface Stack {
    id: number;
    name: string;
    color: string;
    order: number;
}

interface KanbanBoardProps {
    stacks: Stack[];
    tasks: Task[];
    onTaskEdit: (task: Task) => void;
    onTaskMove: (taskId: number, newStackId: number | null, newOrder: number) => Promise<void>;
    onStackDelete: (stackId: number) => void;
    onNewStack: () => void;
}

export default function KanbanBoard({
    stacks,
    tasks,
    onTaskEdit,
    onTaskMove,
    onStackDelete,
    onNewStack,
}: KanbanBoardProps) {
    const [activeTask, setActiveTask] = useState<Task | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    // Group tasks by stack
    const tasksByStack: Record<string, Task[]> = {};

    // Initialize with unassigned
    tasksByStack['unassigned'] = tasks.filter(t => !t.stackId).sort((a, b) => a.order - b.order);

    // Add tasks for each stack
    stacks.forEach(stack => {
        tasksByStack[`stack-${stack.id}`] = tasks
            .filter(t => t.stackId === stack.id)
            .sort((a, b) => a.order - b.order);
    });

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find(t => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragOver = (_event: DragOverEvent) => {
        // Optional: Real-time visual updates during drag
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const taskId = active.id as number;
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Determine new stack
        let newStackId: number | null = null;
        if (typeof over.id === 'string') {
            if (over.id.startsWith('stack-')) {
                newStackId = parseInt(over.id.replace('stack-', ''));
            } else if (over.id !== 'unassigned') {
                // Dropped on another task - get that task's stack
                const targetTask = tasks.find(t => t.id === over.id);
                newStackId = targetTask?.stackId || null;
            }
        }

        // Get current stack tasks
        const currentStackKey = task.stackId ? `stack-${task.stackId}` : 'unassigned';
        const newStackKey = newStackId ? `stack-${newStackId}` : 'unassigned';

        const currentTasks = [...(tasksByStack[currentStackKey] || [])];
        const newTasks = newStackId !== task.stackId ? [...(tasksByStack[newStackKey] || [])] : currentTasks;

        // Calculate new order
        let newOrder = 0;

        if (active.id !== over.id) {
            const oldIndex = currentTasks.findIndex(t => t.id === taskId);
            const newIndex = newTasks.findIndex(t => t.id === over.id);

            if (currentStackKey === newStackKey) {
                // Same stack - reorder
                arrayMove(currentTasks, oldIndex, newIndex);
                newOrder = newIndex;
            } else {
                // Different stack - move to new position
                newOrder = newIndex >= 0 ? newIndex : newTasks.length;
            }
        }

        // Call API to update
        await onTaskMove(taskId, newStackId, newOrder);
    };

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex space-x-4 overflow-x-auto pb-4">
                {/* Importance Stack */}
                <TaskStack
                    stack={{ id: 0, name: 'Importance', color: '#ef4444', order: -1 }}
                    tasks={tasksByStack['unassigned'] || []}
                    onEdit={onTaskEdit}
                    onDelete={() => { }}
                />

                {/* User Stacks */}
                {stacks
                    .sort((a, b) => a.order - b.order)
                    .map((stack) => (
                        <TaskStack
                            key={stack.id}
                            stack={stack}
                            tasks={tasksByStack[`stack-${stack.id}`] || []}
                            onEdit={onTaskEdit}
                            onDelete={() => onStackDelete(stack.id)}
                        />
                    ))}

                {/* New Stack Button */}
                <div className="flex-shrink-0 w-80">
                    <button
                        onClick={onNewStack}
                        className="w-full h-full min-h-[200px] border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-500 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors"
                    >
                        <Plus className="w-8 h-8 mb-2" />
                        <span className="font-medium">New Stack</span>
                    </button>
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeTask && (
                    <div className="rotate-3 opacity-90">
                        <TaskCard task={activeTask} onEdit={() => { }} />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}

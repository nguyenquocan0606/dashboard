'use client';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Trash2, MoreVertical } from 'lucide-react';
import TaskCard from './TaskCard';

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

interface TaskStackProps {
    stack: Stack;
    tasks: Task[];
    onEdit: (task: Task) => void;
    onDelete: () => void;
}

export default function TaskStack({ stack, tasks, onEdit, onDelete }: TaskStackProps) {
    const { setNodeRef } = useDroppable({
        id: `stack-${stack.id}`,
        data: { type: 'stack', stackId: stack.id },
    });

    return (
        <div className="flex-shrink-0 w-80">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden h-full flex flex-col">
                {/* Stack Header - Full colored background */}
                <div
                    className="flex items-center justify-between px-4 py-3 text-white"
                    style={{
                        backgroundColor: stack.color,
                        opacity: 0.95
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold">
                            {stack.name}
                        </h3>
                        <span className="text-xs opacity-80">
                            ({tasks.length})
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={onDelete}
                            className="p-1 text-white opacity-70 hover:opacity-100 transition-opacity"
                            title="Delete stack"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-white opacity-70 hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Tasks List */}
                <div
                    ref={setNodeRef}
                    className="flex-1 space-y-2 overflow-y-auto min-h-[200px] p-4"
                >
                    <SortableContext
                        items={tasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {tasks.map((task) => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                onEdit={onEdit}
                            />
                        ))}
                    </SortableContext>
                    {tasks.length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                            Drop tasks here
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

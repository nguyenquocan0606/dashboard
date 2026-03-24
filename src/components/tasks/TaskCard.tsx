'use client';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

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

interface TaskCardProps {
    task: Task;
    onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const priorityColors = {
        HIGH: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        LOW: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-gray-700 p-3 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer group"
            onClick={() => onEdit(task)}
        >
            <div className="flex items-start space-x-2">
                <button
                    {...attributes}
                    {...listeners}
                    className="mt-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-4 h-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {task.title}
                    </h4>
                    {task.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColors[task.priority]}`}>
                            {task.priority}
                        </span>
                        {task.dueDate && (
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="w-3 h-3 mr-1" />
                                {format(new Date(task.dueDate), 'MMM dd')}
                            </div>
                        )}
                        {!task.dueDate && (
                            <div className="flex items-center text-xs text-gray-400 dark:text-gray-500">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                No date
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

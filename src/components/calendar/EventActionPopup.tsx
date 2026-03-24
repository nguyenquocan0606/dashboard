'use client';
import { Edit2, Trash2, X } from 'lucide-react';

interface EventActionPopupProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    eventTitle: string;
}

export default function EventActionPopup({ isOpen, onClose, onEdit, onDelete, eventTitle }: EventActionPopupProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2">
                        {eventTitle}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-2">
                    <button
                        onClick={() => {
                            onEdit();
                            onClose();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left group"
                    >
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/40 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/60 transition-colors">
                            <Edit2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Edit Reminder</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Modify date, time, or color</p>
                        </div>
                    </button>

                    <button
                        onClick={() => {
                            onDelete();
                            onClose();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left group"
                    >
                        <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/40 group-hover:bg-red-200 dark:group-hover:bg-red-900/60 transition-colors">
                            <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Delete Reminder</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Remove from calendar</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}

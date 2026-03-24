'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface StackModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (name: string, color: string) => Promise<void>;
}

export default function StackModal({ isOpen, onClose, onCreate }: StackModalProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#64748b');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onCreate(name, color);
            setName('');
            setColor('#64748b');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const presetColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#3b82f6', '#6366f1', '#a855f7', '#64748b'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Stack</h2>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <Trash2 className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Stack Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., To Do, In Progress, Done"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Color
                        </label>
                        <div className="flex items-center space-x-2">
                            {presetColors.map((presetColor) => (
                                <button
                                    key={presetColor}
                                    type="button"
                                    onClick={() => setColor(presetColor)}
                                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === presetColor
                                            ? 'border-gray-900 dark:border-white scale-110'
                                            : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                        }`}
                                    style={{ backgroundColor: presetColor }}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            {isSubmitting ? 'Creating...' : 'Create Stack'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

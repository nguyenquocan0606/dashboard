'use client';
import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import EventActionPopup from '@/components/calendar/EventActionPopup';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Plus, X } from 'lucide-react';

import { vi } from 'date-fns/locale';

const locales = {
    'vi': vi,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CalendarPage() {
    const { data: tasks } = useSWR('/api/tasks', fetcher);
    const { data: reminders } = useSWR('/api/reminders', fetcher);
    const { data: subscriptions } = useSWR('/api/finance/subscriptions', fetcher);
    const { data: connections } = useSWR('/api/calendar/connections', fetcher);

    const [showModal, setShowModal] = useState(false);
    const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editingReminder, setEditingReminder] = useState<number | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [actionPopup, setActionPopup] = useState<{ isOpen: boolean; reminder: any | null }>({ isOpen: false, reminder: null });
    const [reminderForm, setReminderForm] = useState({
        title: '',
        dateTime: '',
        isRecurring: false,
        color: '#10b981', // Default green
    });

    const events = useMemo(() => {
        const taskEvents = (tasks || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((task: any) => task.dueDate)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((task: any) => ({
                id: `task-${task.id}`,
                title: `📋 ${task.title}`,
                start: new Date(task.dueDate),
                end: new Date(task.dueDate),
                type: 'task',
                resource: task,
            }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reminderEvents = (reminders || []).map((reminder: any) => ({
            id: `reminder-${reminder.id}`,
            title: `⏰ ${reminder.title}`,
            start: new Date(reminder.dateTime),
            end: new Date(reminder.dateTime),
            type: 'reminder',
            resource: reminder,
        }));

        const subscriptionEvents = (subscriptions || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((sub: any) => sub.isActive && sub.nextBillingDate)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((sub: any) => ({
                id: `sub-${sub.id}`,
                title: `💳 ${sub.name}`,
                start: new Date(sub.nextBillingDate),
                end: new Date(sub.nextBillingDate),
                type: 'subscription',
                resource: sub,
            }));

        return [...taskEvents, ...reminderEvents, ...subscriptionEvents];
    }, [tasks, reminders, subscriptions]);

    const handleConnectCalendar = async (provider: 'google' | 'apple') => {
        try {
            const res = await fetch(`/api/calendar/oauth?provider=${provider}`);
            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error('Failed to initiate OAuth', error);
            alert('Failed to connect calendar. Please try again.');
        }
    };

    const handleSyncAll = async () => {
        try {
            await fetch('/api/calendar/sync', { method: 'POST' });
            alert('✅ Synced all events to calendar!');
        } catch (error) {
            console.error('Sync failed', error);
            alert('❌ Sync failed. Please try again.');
        }
    };

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(start);
        setReminderForm({
            ...reminderForm,
            dateTime: format(start, "yyyy-MM-dd'T'HH:mm"),
        });
        setEditingReminder(null); // Clear editing state when selecting a new slot
        setShowModal(true);
    };

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();

        // Optimistic UI - close modal immediately
        setShowModal(false);
        const reminderData = { ...reminderForm };
        const isEditing = editingReminder !== null;
        setReminderForm({ title: '', dateTime: '', isRecurring: false, color: '#10b981' });
        setEditingReminder(null);

        try {
            const url = isEditing ? `/api/reminders/${editingReminder}` : '/api/reminders';
            const method = isEditing ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reminderData),
            });

            // Update UI immediately
            mutate('/api/reminders');
        } catch (error) {
            console.error('Failed to save reminder', error);
            // Revert optimistic update
            mutate('/api/reminders');
        }
    };


    const handleDeleteReminder = async (id: number) => {
        // Optimistic UI - update immediately
        mutate('/api/reminders');

        try {
            // Delete in background
            await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Failed to delete reminder', error);
            // Revert on error
            mutate('/api/reminders');
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleSelectEvent = (event: any) => {
        if (event.type === 'reminder') {
            setActionPopup({ isOpen: true, reminder: event.resource });
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6'; // task (blue)
        if (event.type === 'reminder') {
            // Use reminder's custom color
            backgroundColor = event.resource.color || '#10b981';
        }
        if (event.type === 'subscription') backgroundColor = '#dc2626'; // subscription (red)

        return {
            style: {
                backgroundColor,
                borderRadius: '5px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        };
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    const [view, setView] = useState(Views.MONTH);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleView = (newView: any) => {
        setView(newView);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                <div className="flex items-center space-x-3">
                    {/* Connection Status */}
                    {connections && connections.length > 0 ? (
                        <div className="flex items-center space-x-2">
                            {connections.map((conn: { id: number; provider: string }) => (
                                <div key={conn.id} className="flex items-center space-x-1 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-md">
                                    <span>✓</span>
                                    <span className="capitalize">{conn.provider}</span>
                                </div>
                            ))}
                            <button
                                onClick={handleSyncAll}
                                className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                            >
                                Sync All
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => handleConnectCalendar('google')}
                                className="flex items-center px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Connect Google
                            </button>
                            <button
                                onClick={() => handleConnectCalendar('apple')}
                                className="flex items-center px-3 py-1.5 text-sm text-white bg-gray-800 rounded-md hover:bg-gray-900 transition-colors"
                            >
                                Connect Apple
                            </button>
                        </div>
                    )}
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        New Reminder
                    </button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center space-x-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-blue-500 rounded"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tasks</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Reminders</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">Subscriptions</span>
                </div>
            </div>

            {/* Calendar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    onSelectEvent={handleSelectEvent}
                    eventPropGetter={eventStyleGetter}
                    className="text-gray-900 dark:text-white"
                    date={currentDate}
                    onNavigate={handleNavigate}
                    view={view}
                    onView={handleView}
                    culture="vi"
                />
            </div>

            {/* Upcoming Reminders */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Reminders</h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {(!reminders || reminders.length === 0) ? (
                        <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                            No reminders scheduled
                        </div>
                    ) : (
                        reminders
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .filter((r: any) => !r.isCompleted)
                            .slice(0, 5)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .map((reminder: any) => (
                                <div key={reminder.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex items-center space-x-3 flex-1">
                                        {/* Color Indicator */}
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: reminder.color || '#10b981' }}
                                        />
                                        <div className="flex-1">
                                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                                {reminder.title}
                                            </h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {format(new Date(reminder.dateTime), 'dd/MM/yyyy HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteReminder(reminder.id)}
                                        className="ml-4 p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Reminder Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingReminder ? 'Edit Reminder' : 'New Reminder'}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateReminder} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reminderForm.title}
                                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Enter reminder title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Date & Time <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={reminderForm.dateTime}
                                    onChange={(e) => setReminderForm({ ...reminderForm, dateTime: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            {/* Color Picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Color
                                </label>
                                <div className="flex items-center space-x-2">
                                    {/* Preset Colors */}
                                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981', '#3b82f6', '#6366f1', '#a855f7'].map((presetColor) => (
                                        <button
                                            key={presetColor}
                                            type="button"
                                            onClick={() => setReminderForm({ ...reminderForm, color: presetColor })}
                                            className={`w-8 h-8 rounded-full border-2 transition-all ${reminderForm.color === presetColor
                                                ? 'border-gray-900 dark:border-white scale-110'
                                                : 'border-gray-300 dark:border-gray-600 hover:scale-105'
                                                }`}
                                            style={{ backgroundColor: presetColor }}
                                            title={presetColor}
                                        />
                                    ))}
                                    {/* Custom Color Input */}
                                    <div className="relative">
                                        <input
                                            type="color"
                                            value={reminderForm.color}
                                            onChange={(e) => setReminderForm({ ...reminderForm, color: e.target.value })}
                                            className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                                            title="Custom color"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isRecurring"
                                    checked={reminderForm.isRecurring}
                                    onChange={(e) => setReminderForm({ ...reminderForm, isRecurring: e.target.checked })}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isRecurring" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Recurring Reminder
                                </label>
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Create Reminder
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Event Action Popup */}
            <EventActionPopup
                isOpen={actionPopup.isOpen}
                onClose={() => setActionPopup({ isOpen: false, reminder: null })}
                onEdit={() => {
                    if (actionPopup.reminder) {
                        setEditingReminder(actionPopup.reminder.id);
                        setReminderForm({
                            title: actionPopup.reminder.title,
                            dateTime: format(new Date(actionPopup.reminder.dateTime), "yyyy-MM-dd'T'HH:mm"),
                            isRecurring: actionPopup.reminder.isRecurring,
                            color: actionPopup.reminder.color || '#10b981',
                        });
                        setShowModal(true);
                    }
                }}
                onDelete={() => {
                    if (actionPopup.reminder) {
                        handleDeleteReminder(actionPopup.reminder.id);
                    }
                }}
                eventTitle={actionPopup.reminder?.title || ''}
            />
        </div>
    );
}

'use client';
import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
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
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reminderForm, setReminderForm] = useState({
        title: '',
        dateTime: '',
        isRecurring: false,
    });

    const events = useMemo(() => {
        const taskEvents = (tasks || [])
            .filter((task: any) => task.dueDate)
            .map((task: any) => ({
                id: `task-${task.id}`,
                title: `📋 ${task.title}`,
                start: new Date(task.dueDate),
                end: new Date(task.dueDate),
                type: 'task',
                resource: task,
            }));

        const reminderEvents = (reminders || []).map((reminder: any) => ({
            id: `reminder-${reminder.id}`,
            title: `⏰ ${reminder.title}`,
            start: new Date(reminder.dateTime),
            end: new Date(reminder.dateTime),
            type: 'reminder',
            resource: reminder,
        }));

        const subscriptionEvents = (subscriptions || [])
            .filter((sub: any) => sub.isActive && sub.nextBillingDate)
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

    const handleSelectSlot = ({ start }: { start: Date }) => {
        setSelectedDate(start);
        setReminderForm({
            ...reminderForm,
            dateTime: format(start, "yyyy-MM-dd'T'HH:mm"),
        });
        setShowModal(true);
    };

    const handleCreateReminder = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/reminders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reminderForm),
            });
            mutate('/api/reminders');
            setShowModal(false);
            setReminderForm({ title: '', dateTime: '', isRecurring: false });
        } catch (error) {
            console.error('Failed to create reminder', error);
        }
    };

    const handleDeleteReminder = async (id: number) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
            mutate('/api/reminders');
        } catch (error) {
            console.error('Failed to delete reminder', error);
        }
    };

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6'; // task (blue)
        if (event.type === 'reminder') backgroundColor = '#10b981'; // reminder (green)
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

    const handleView = (newView: any) => {
        setView(newView);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Reminder
                </button>
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
                            .filter((r: any) => !r.isCompleted)
                            .slice(0, 5)
                            .map((reminder: any) => (
                                <div key={reminder.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                                            {reminder.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {format(new Date(reminder.dateTime), 'dd/MM/yyyy HH:mm')}
                                        </p>
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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Reminder</h2>
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
        </div>
    );
}

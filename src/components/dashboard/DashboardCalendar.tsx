'use client';
import { useState, useMemo } from 'react';
import useSWR, { mutate } from 'swr';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, isSameDay } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomToolbar = (toolbar: any) => {
    const goToBack = () => {
        toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
        toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
        toolbar.onNavigate('TODAY');
    };

    return (
        <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white capitalize">
                {format(toolbar.date, 'MMMM yyyy', { locale: locales['vi'] })}
            </h2>
            <div className="flex items-center space-x-3">
                <button
                    onClick={goToBack}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                    onClick={goToCurrent}
                    className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                    Today
                </button>
                <button
                    onClick={goToNext}
                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomDateHeader = ({ label, date, onDrillDown }: any) => {
    const isToday = isSameDay(date, new Date());
    return (
        <div className="flex justify-center pt-1 pb-1">
            <button
                onClick={onDrillDown}
                className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${isToday
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
            >
                {label}
            </button>
        </div>
    );
};

export default function DashboardCalendar() {
    const { data: tasks } = useSWR('/api/tasks', fetcher);
    const { data: reminders } = useSWR('/api/reminders', fetcher);
    const { data: subscriptions } = useSWR('/api/finance/subscriptions', fetcher);
    const [showModal, setShowModal] = useState(false);
    const [_selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [reminderForm, setReminderForm] = useState({
        title: '',
        dateTime: '',
        isRecurring: false,
    });

    const events = useMemo(() => {
        const taskEvents = (tasks || [])
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .filter((task: any) => task.dueDate)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((task: any) => ({
                id: `task-${task.id}`,
                title: task.title,
                start: new Date(task.dueDate),
                end: new Date(task.dueDate),
                type: 'task',
                resource: task,
            }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const reminderEvents = (reminders || []).map((reminder: any) => ({
            id: `reminder-${reminder.id}`,
            title: reminder.title,
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
                title: `💳 ${sub.name} (${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(sub.price))})`,
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _handleDeleteReminder = async (id: number) => {
        if (!confirm('Delete this reminder?')) return;
        try {
            await fetch(`/api/reminders/${id}`, { method: 'DELETE' });
            mutate('/api/reminders');
        } catch (error) {
            console.error('Failed to delete reminder', error);
        }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const eventStyleGetter = (event: any) => {
        const isTask = event.type === 'task';
        const isSubscription = event.type === 'subscription';

        let style = {};

        if (isSubscription) {
            style = {
                backgroundColor: 'rgba(239, 68, 68, 0.15)', // red
                color: '#dc2626',
                borderLeft: '3px solid #dc2626',
                borderRadius: '4px',
                opacity: 1,
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '2px 6px',
                marginBottom: '2px',
                boxShadow: 'none',
            };
        } else {
            style = {
                backgroundColor: isTask ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                color: isTask ? '#2563eb' : '#059669',
                borderLeft: `3px solid ${isTask ? '#2563eb' : '#059669'}`,
                borderRadius: '4px',
                opacity: 1,
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                padding: '2px 6px',
                marginBottom: '2px',
                boxShadow: 'none',
            };
        }

        return { style };
    };

    const handleNavigate = (newDate: Date) => {
        setCurrentDate(newDate);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const components: any = useMemo(() => ({
        toolbar: CustomToolbar,
        month: {
            dateHeader: CustomDateHeader,
        },
    }), []);

    return (
        <div className="h-full">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%', minHeight: '600px' }}
                    selectable
                    onSelectSlot={handleSelectSlot}
                    eventPropGetter={eventStyleGetter}
                    className="custom-calendar text-gray-900 dark:text-white"
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    date={currentDate}
                    onNavigate={handleNavigate}
                    components={components}
                    culture="vi"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
                        <div className="p-8 pb-0">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Reminder</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 rounded-full bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Add a new task to your schedule</p>
                        </div>

                        <form onSubmit={handleCreateReminder} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={reminderForm.title}
                                    onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                                    className="w-full px-0 py-2 bg-transparent border-b-2 border-gray-100 dark:border-gray-700 text-lg font-medium text-gray-900 dark:text-white placeholder-gray-300 focus:border-blue-500 outline-none transition-colors"
                                    placeholder="e.g., Team meeting"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date & Time
                                </label>
                                <input
                                    type="datetime-local"
                                    required
                                    value={reminderForm.dateTime}
                                    onChange={(e) => setReminderForm({ ...reminderForm, dateTime: e.target.value })}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="flex items-center space-x-3 py-2">
                                <button
                                    type="button"
                                    onClick={() => setReminderForm({ ...reminderForm, isRecurring: !reminderForm.isRecurring })}
                                    className={`w-12 h-6 rounded-full transition-colors relative ${reminderForm.isRecurring ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${reminderForm.isRecurring ? 'left-7' : 'left-1'}`}></div>
                                </button>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Repeat weekly</span>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="submit"
                                    className="w-full py-4 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-2xl shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
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

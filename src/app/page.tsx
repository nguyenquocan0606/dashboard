'use client';
import useSWR from 'swr';
import { CheckCircle, Bell, Calendar as CalendarIcon, CreditCard, Sparkles, Clock } from 'lucide-react';
import DashboardCalendar from '@/components/dashboard/DashboardCalendar';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((res) => res.json());



// Format currency with VND
function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading, error: statsError } = useSWR('/api/dashboard', fetcher);
  const { data: primaryAccount } = useSWR('/api/settings', fetcher);
  const { data: tasks } = useSWR('/api/tasks', fetcher);
  const { data: reminders } = useSWR('/api/reminders', fetcher);
  const { data: subscriptions } = useSWR('/api/finance/subscriptions', fetcher);

  if (statsLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 bg-blue-200 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 rounded"></div>
      </div>
    </div>
  );

  if (statsError) return (
    <div className="p-8 text-center">
      <div className="text-red-500 text-lg font-medium">Error loading dashboard</div>
      <p className="text-gray-500 mt-2">Please try refreshing the page</p>
    </div>
  );



  // Calculate counts
  const importantTasksCount = (tasks || []).filter((t: any) => t.status !== 'DONE' && t.priority === 'HIGH').length;
  const pendingTasksCount = stats?.pendingTasksCount ?? 0;
  const todayRemindersCount = stats?.todayReminders?.length ?? 0;

  // Build upcoming items (tasks + reminders + subscriptions)
  const upcomingItems: any[] = [];

  (tasks || [])
    .filter((t: any) => t.status !== 'DONE' && t.dueDate)
    .slice(0, 3)
    .forEach((t: any) => upcomingItems.push({ type: 'task', title: t.title, date: new Date(t.dueDate), priority: t.priority }));

  (reminders || [])
    .filter((r: any) => !r.isCompleted)
    .slice(0, 3)
    .forEach((r: any) => upcomingItems.push({ type: 'reminder', title: r.title, date: new Date(r.dateTime) }));

  (subscriptions || [])
    .filter((s: any) => s.isActive && s.nextBillingDate)
    .slice(0, 2)
    .forEach((s: any) => upcomingItems.push({ type: 'subscription', title: `${s.name} - ${formatVND(Number(s.price))}`, date: new Date(s.nextBillingDate) }));

  upcomingItems.sort((a, b) => a.date.getTime() - b.date.getTime());
  const displayItems = upcomingItems.slice(0, 5);

  return (
    <div className="w-full px-6 h-[calc(100vh-5rem)] py-4 box-border overflow-hidden">
      {/* Main Layout: Sidebar LEFT (1/5) + Calendar RIGHT (4/5) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full">
        {/* LEFT Sidebar - 1 column */}
        <div className="lg:col-span-1 space-y-4 flex flex-col h-full overflow-y-auto pr-2 no-scrollbar">
          {/* Pending Tasks */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{pendingTasksCount}</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg text-white">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Primary Account */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  {primaryAccount?.name || 'Tài khoản'}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatVND(primaryAccount?.currentBalance || 0)}
                </p>
              </div>
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg text-white">
                <CreditCard className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Today's Reminders */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reminders</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{todayRemindersCount}</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg text-white">
                <Bell className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 grow overflow-y-auto">
            <div className="flex items-center gap-2 mb-3 sticky top-0 bg-white dark:bg-gray-800 z-10 pb-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Upcoming</h3>
            </div>
            {displayItems.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">Không có gì sắp tới</p>
            ) : (
              <div className="space-y-2">
                {displayItems.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${item.type === 'task' ? 'bg-blue-500' :
                      item.type === 'reminder' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-gray-400">{format(item.date, 'dd/MM HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT Calendar - 4 columns */}
        <div className="lg:col-span-4 h-full">
          <DashboardCalendar />
        </div>
      </div>
    </div>
  );
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Calendar, DollarSign, Settings, X, CreditCard } from 'lucide-react';
import { useUI } from '@/providers/UIProvider';

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Tasks', href: '/tasks', icon: CheckSquare },
    { name: 'Calendar', href: '/calendar', icon: Calendar },
    { name: 'Finance', href: '/finance', icon: DollarSign },
    { name: 'Subscriptions', href: '/subscriptions', icon: CreditCard },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, toggleSidebar } = useUI();

    return (
        <aside
            className={`${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full opacity-0'
                } inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out overflow-hidden`}
        >
            <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700 min-w-[16rem]">
                <span className="text-xl font-bold text-gray-900 dark:text-white">Hub</span>
                <button onClick={toggleSidebar} className="lg:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <nav className="flex-1 px-2 py-4 space-y-1 min-w-[16rem]">
                {navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                                : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                                }`}
                        >
                            <item.icon className="w-5 h-5 mr-3" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}

'use client';
import { Menu, Moon, Sun } from 'lucide-react';
import { useUI } from '@/providers/UIProvider';

export default function Navbar() {
    const { toggleSidebar, theme, toggleTheme } = useUI();

    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Get greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Chào buổi sáng';
        if (hour < 18) return 'Chào buổi chiều';
        return 'Chào buổi tối';
    };

    return (
        <header className="flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <button
                    onClick={toggleSidebar}
                    className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div className="hidden md:block">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-none">Dashboard</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 capitalize">
                        {currentDate} • {getGreeting()}
                    </p>
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 rounded-full hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 focus:outline-none"
                >
                    {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="w-8 h-8 bg-gray-200 rounded-full dark:bg-gray-700" />
            </div>
        </header>
    );
}

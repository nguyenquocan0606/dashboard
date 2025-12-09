'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Settings, Check, CreditCard } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SettingsPage() {
    const { data: accounts, isLoading: accLoading } = useSWR('/api/finance/accounts', fetcher);
    const { data: primaryAccount, isLoading: settingsLoading } = useSWR('/api/settings', fetcher);
    const [saving, setSaving] = useState(false);

    const handleSetPrimary = async (accountId: number) => {
        setSaving(true);
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accountId }),
            });
            mutate('/api/settings');
            mutate('/api/finance/accounts');
        } catch (error) {
            console.error('Failed to set primary account', error);
        } finally {
            setSaving(false);
        }
    };

    if (accLoading || settingsLoading) {
        return <div className="p-8">Loading settings...</div>;
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>

            {/* Primary Account Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">Primary Account</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Select the account to display on your dashboard
                    </p>
                </div>
                <div className="p-6">
                    {!accounts || accounts.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No accounts found. Create an account in Finance first.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {accounts.map((acc: any) => (
                                <button
                                    key={acc.id}
                                    onClick={() => handleSetPrimary(acc.id)}
                                    disabled={saving}
                                    className={`relative p-4 rounded-lg border-2 transition-all text-left ${primaryAccount?.id === acc.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    {primaryAccount?.id === acc.id && (
                                        <div className="absolute top-2 right-2">
                                            <Check className="w-5 h-5 text-blue-600" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                            style={{ backgroundColor: acc.color || '#3b82f6' }}
                                        >
                                            <CreditCard className="w-5 h-5 text-white" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{acc.name}</p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(acc.currentBalance || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

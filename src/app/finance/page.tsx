'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { format, parse } from 'date-fns';
import { Plus, TrendingUp, TrendingDown, DollarSign, Trash2, X, CreditCard, Wallet, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from 'date-fns/locale';
registerLocale('vi', vi);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const ACCOUNT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function FinancePage() {
    const { data: accounts, isLoading: accLoading } = useSWR('/api/finance/accounts', fetcher);

    // Selected account for filtering
    const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

    // Build query string based on selected account
    const accountQuery = selectedAccountId ? `&accountId=${selectedAccountId}` : '';
    const { data: transactions, isLoading: txLoading } = useSWR(`/api/finance/transactions${selectedAccountId ? `?accountId=${selectedAccountId}` : ''}`, fetcher);
    const { data: summary, isLoading: summaryLoading } = useSWR(`/api/finance/transactions?type=summary${accountQuery}`, fetcher);
    const { data: chartData, isLoading: chartLoading } = useSWR('/api/finance/transactions?type=chart', fetcher);

    const [showTxModal, setShowTxModal] = useState(false);
    const [showAccModal, setShowAccModal] = useState(false);

    const [txForm, setTxForm] = useState({ amount: '', type: 'EXPENSE', category: '', description: '', date: format(new Date(), 'yyyy-MM-dd'), accountId: '' });
    const [accForm, setAccForm] = useState({ name: '', initialBalance: '', color: ACCOUNT_COLORS[0], description: '' });

    const handleCreateTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/finance/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...txForm,
                    amount: parseFloat(txForm.amount),
                    accountId: txForm.accountId ? parseInt(txForm.accountId) : undefined,
                }),
            });
            mutate('/api/finance/transactions');
            mutate(`/api/finance/transactions?accountId=${selectedAccountId}`);
            mutate('/api/finance/transactions?type=summary');
            mutate(`/api/finance/transactions?type=summary&accountId=${selectedAccountId}`);
            mutate('/api/finance/transactions?type=chart');
            mutate('/api/finance/accounts');
            setShowTxModal(false);
            setTxForm({ amount: '', type: 'EXPENSE', category: '', description: '', date: new Date().toISOString().split('T')[0], accountId: '' });
        } catch (error) {
            console.error('Failed to create transaction', error);
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!confirm('Delete this transaction?')) return;
        try {
            await fetch(`/api/finance/transactions/${id}`, { method: 'DELETE' });
            mutate('/api/finance/transactions');
            mutate(`/api/finance/transactions?accountId=${selectedAccountId}`);
            mutate('/api/finance/transactions?type=summary');
            mutate(`/api/finance/transactions?type=summary&accountId=${selectedAccountId}`);
            mutate('/api/finance/transactions?type=chart');
            mutate('/api/finance/accounts');
        } catch (error) {
            console.error('Failed to delete transaction', error);
        }
    };

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await fetch('/api/finance/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...accForm,
                    initialBalance: parseFloat(accForm.initialBalance) || 0,
                }),
            });
            mutate('/api/finance/accounts');
            setShowAccModal(false);
            setAccForm({ name: '', initialBalance: '', color: ACCOUNT_COLORS[0], description: '' });
        } catch (error) {
            console.error('Failed to create account', error);
        }
    };

    const handleDeleteAccount = async (id: number) => {
        if (!confirm('Delete this account? Transactions will keep their data but will no longer be linked to this account.')) return;
        try {
            await fetch(`/api/finance/accounts/${id}`, { method: 'DELETE' });
            mutate('/api/finance/accounts');
            if (selectedAccountId === id) {
                setSelectedAccountId(null);
            }
        } catch (error) {
            console.error('Failed to delete account', error);
        }
    };

    // Open transaction modal with pre-filled type and account
    const openTransactionModal = (type: 'INCOME' | 'EXPENSE') => {
        setTxForm({
            amount: '',
            type,
            category: '',
            description: '',
            date: format(new Date(), 'yyyy-MM-dd'),
            accountId: selectedAccountId ? selectedAccountId.toString() : '',
        });
        setShowTxModal(true);
    };

    if (txLoading || summaryLoading || chartLoading || accLoading) {
        return <div className="p-8">Loading finance data...</div>;
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Finance</h1>
                <div className="flex space-x-3">
                    <button
                        onClick={() => setShowAccModal(true)}
                        className="flex items-center px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                    >
                        <Wallet className="w-5 h-5 mr-2" />
                        New Account
                    </button>
                    <button
                        onClick={() => openTransactionModal('INCOME')}
                        className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                    >
                        <ArrowDownCircle className="w-5 h-5 mr-2" />
                        Tiền vào
                    </button>
                    <button
                        onClick={() => openTransactionModal('EXPENSE')}
                        className="flex items-center px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                    >
                        <ArrowUpCircle className="w-5 h-5 mr-2" />
                        Tiền ra
                    </button>
                </div>
            </div>

            {/* Accounts Section */}
            {accounts && accounts.length > 0 && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Accounts</h2>
                        {selectedAccountId && (
                            <button
                                onClick={() => setSelectedAccountId(null)}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                            >
                                Show All Transactions
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {accounts.map((acc: any) => (
                            <div
                                key={acc.id}
                                onClick={() => setSelectedAccountId(selectedAccountId === acc.id ? null : acc.id)}
                                className={`relative cursor-pointer rounded-lg shadow-lg p-4 text-white transition-all transform hover:scale-105 ${selectedAccountId === acc.id ? 'ring-4 ring-offset-2 ring-blue-400 dark:ring-offset-gray-900' : ''
                                    }`}
                                style={{ backgroundColor: acc.color || '#3b82f6' }}
                            >
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteAccount(acc.id);
                                    }}
                                    className="absolute top-2 right-2 p-1 rounded-full bg-white/20 hover:bg-white/40 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <div className="flex items-center mb-2">
                                    <CreditCard className="w-6 h-6 mr-2 opacity-80" />
                                    <span className="font-semibold truncate">{acc.name}</span>
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(acc.currentBalance)}</p>
                                {acc.description && (
                                    <p className="text-sm opacity-80 mt-1 truncate">{acc.description}</p>
                                )}
                                <div className="mt-2 flex justify-between text-xs opacity-80">
                                    <span>+{formatCurrency(acc.income)}</span>
                                    <span>-{formatCurrency(acc.expenses)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">
                                {selectedAccountId ? 'Account Income' : 'Total Income'}
                            </p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(summary?.income || 0)}</p>
                        </div>
                        <TrendingUp className="w-12 h-12 text-green-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-sm font-medium">
                                {selectedAccountId ? 'Account Expenses' : 'Total Expenses'}
                            </p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(summary?.expenses || 0)}</p>
                        </div>
                        <TrendingDown className="w-12 h-12 text-red-200 opacity-80" />
                    </div>
                </div>

                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">
                                {selectedAccountId ? 'Account Balance' : 'Balance'}
                            </p>
                            <p className="text-3xl font-bold mt-2">{formatCurrency(summary?.balance || 0)}</p>
                        </div>
                        <DollarSign className="w-12 h-12 text-blue-200 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Recent Transactions - Moved to top */}
            <div className="bg-white rounded-lg shadow overflow-hidden dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        {selectedAccountId
                            ? `Transactions - ${accounts?.find((a: any) => a.id === selectedAccountId)?.name || 'Account'}`
                            : 'Recent Transactions'
                        }
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Account</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions?.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No transactions found</td>
                                </tr>
                            ) : (
                                transactions?.slice(0, 10).map((tx: any) => (
                                    <tr
                                        key={tx.id}
                                        className={`${tx.type === 'INCOME'
                                            ? 'bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                                            : 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30'
                                            }`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {format(new Date(tx.date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {tx.account ? (
                                                <span
                                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-white"
                                                    style={{ backgroundColor: tx.account.color || '#6b7280' }}
                                                >
                                                    {tx.account.name}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{tx.category}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{tx.description || '-'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${tx.type === 'INCOME' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                            }`}>
                                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(Number(tx.amount))}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => handleDeleteTransaction(tx.id)}
                                                className="text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Expenses Chart */}
                <div className="bg-white rounded-lg shadow p-6 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Expenses by Category</h2>
                    <div className="h-64">
                        {chartData && chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData?.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                                No expense data available
                            </div>
                        )}
                    </div>
                </div>

                {/* Subscriptions */}
                {/* Removed SubscriptionList component */}
            </div>

            {/* Transaction Modal */}
            {showTxModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                {txForm.type === 'INCOME' ? (
                                    <ArrowDownCircle className="w-6 h-6 mr-2 text-green-500" />
                                ) : (
                                    <ArrowUpCircle className="w-6 h-6 mr-2 text-red-500" />
                                )}
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {txForm.type === 'INCOME' ? 'Tiền vào' : 'Tiền ra'}
                                </h2>
                            </div>
                            <button onClick={() => setShowTxModal(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTransaction} className="p-6 space-y-4">
                            {/* Show selected account badge if one is pre-selected */}
                            {txForm.accountId && (
                                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                    <div className="flex items-center">
                                        <CreditCard className="w-5 h-5 mr-2 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Tài khoản: {accounts?.find((a: any) => a.id === parseInt(txForm.accountId))?.name}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setTxForm({ ...txForm, accountId: '' })}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        Đổi
                                    </button>
                                </div>
                            )}

                            {/* Only show account dropdown if no account is pre-selected */}
                            {!txForm.accountId && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tài khoản</label>
                                    <select
                                        value={txForm.accountId}
                                        onChange={(e) => setTxForm({ ...txForm, accountId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Không chọn tài khoản</option>
                                        {accounts?.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Type toggle - allow changing if needed */}
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTxForm({ ...txForm, type: 'INCOME' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${txForm.type === 'INCOME'
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Tiền vào
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTxForm({ ...txForm, type: 'EXPENSE' })}
                                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${txForm.type === 'EXPENSE'
                                        ? 'bg-red-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    Tiền ra
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    value={txForm.amount}
                                    onChange={(e) => setTxForm({ ...txForm, amount: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                                <input
                                    type="text"
                                    required
                                    value={txForm.category}
                                    onChange={(e) => setTxForm({ ...txForm, category: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., Food, Rent, Salary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                                <input
                                    type="text"
                                    value={txForm.description}
                                    onChange={(e) => setTxForm({ ...txForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Optional"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date</label>
                                <DatePicker
                                    selected={txForm.date ? parse(txForm.date, 'yyyy-MM-dd', new Date()) : null}
                                    onChange={(date) => setTxForm({ ...txForm, date: date ? format(date, 'yyyy-MM-dd') : '' })}
                                    dateFormat="dd/MM/yyyy"
                                    locale="vi"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    wrapperClassName="w-full"
                                    placeholderText="dd/mm/yyyy"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowTxModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Removed SubscriptionModal component */}

            {/* Account Modal */}
            {showAccModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Account</h2>
                            <button onClick={() => setShowAccModal(false)} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Account Name</label>
                                <input
                                    type="text"
                                    required
                                    value={accForm.name}
                                    onChange={(e) => setAccForm({ ...accForm, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., VCB - Chi tiêu, Techcombank - Tiết kiệm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Balance</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={accForm.initialBalance}
                                    onChange={(e) => setAccForm({ ...accForm, initialBalance: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Color</label>
                                <div className="flex flex-wrap gap-2">
                                    {ACCOUNT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => setAccForm({ ...accForm, color })}
                                            className={`w-8 h-8 rounded-full transition-transform ${accForm.color === color ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description (Optional)</label>
                                <input
                                    type="text"
                                    value={accForm.description}
                                    onChange={(e) => setAccForm({ ...accForm, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="e.g., Chi tiêu hàng ngày"
                                />
                            </div>
                            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowAccModal(false)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-purple-600 rounded-md hover:bg-purple-700"
                                >
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

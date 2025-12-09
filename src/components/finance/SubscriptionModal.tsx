'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import DatePicker, { registerLocale } from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from 'date-fns/locale';
import { format, parse } from 'date-fns';

registerLocale('vi', vi);

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent, data: { name: string; price: string; billingCycle: string; nextBillingDate: string; notes: string }) => Promise<void>;
}

export default function SubscriptionModal({ isOpen, onClose, onSubmit }: SubscriptionModalProps) {
    const [subForm, setSubForm] = useState({ name: '', price: '', billingCycle: 'MONTHLY', nextBillingDate: '', notes: '' });

    const handleSubmit = async (e: React.FormEvent) => {
        await onSubmit(e, subForm);
        setSubForm({ name: '', price: '', billingCycle: 'MONTHLY', nextBillingDate: '', notes: '' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Subscription</h2>
                    <button onClick={onClose} className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
                        <input
                            type="text"
                            required
                            value={subForm.name}
                            onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g., Netflix, Spotify"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price</label>
                        <input
                            type="number"
                            step="0.01"
                            required
                            value={subForm.price}
                            onChange={(e) => setSubForm({ ...subForm, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Billing Cycle</label>
                        <select
                            required
                            value={subForm.billingCycle}
                            onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="MONTHLY">Monthly</option>
                            <option value="YEARLY">Yearly</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next Billing Date</label>
                        <DatePicker
                            selected={subForm.nextBillingDate ? parse(subForm.nextBillingDate, 'yyyy-MM-dd', new Date()) : null}
                            onChange={(date) => setSubForm({ ...subForm, nextBillingDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                            dateFormat="dd/MM/yyyy"
                            locale="vi"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            wrapperClassName="w-full"
                            placeholderText="dd/mm/yyyy"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                        <textarea
                            rows={2}
                            value={subForm.notes}
                            onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Optional notes"
                        />
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700"
                        >
                            Create
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

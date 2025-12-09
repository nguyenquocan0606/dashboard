
'use client';
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus } from 'lucide-react';
import SubscriptionModal from '@/components/finance/SubscriptionModal';
import SubscriptionList from '@/components/finance/SubscriptionList';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SubscriptionsPage() {
    const { data: subscriptions, isLoading: subLoading } = useSWR('/api/finance/subscriptions', fetcher);
    const [showSubModal, setShowSubModal] = useState(false);

    const handleCreateSubscription = async (e: React.FormEvent, data: { name: string; price: string; billingCycle: string; nextBillingDate: string; notes: string }) => {
        e.preventDefault();
        try {
            await fetch('/api/finance/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    price: parseFloat(data.price),
                }),
            });
            mutate('/api/finance/subscriptions');
            setShowSubModal(false);
        } catch (error) {
            console.error('Failed to create subscription', error);
        }
    };

    const handleDeleteSubscription = async (id: number) => {
        if (!confirm('Delete this subscription?')) return;
        try {
            await fetch(`/api/finance/subscriptions/${id}`, { method: 'DELETE' });
            mutate('/api/finance/subscriptions');
        } catch (error) {
            console.error('Failed to delete subscription', error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Subscriptions</h1>
                <button
                    onClick={() => setShowSubModal(true)}
                    className="flex items-center px-4 py-2 text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Subscription
                </button>
            </div>

            <SubscriptionList
                subscriptions={subscriptions}
                isLoading={subLoading}
                onDelete={handleDeleteSubscription}
            />

            <SubscriptionModal
                isOpen={showSubModal}
                onClose={() => setShowSubModal(false)}
                onSubmit={handleCreateSubscription}
            />
        </div>
    );
}

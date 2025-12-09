import prisma from '@/lib/prisma';
import { Subscription, Cycle } from '@prisma/client';

export const subscriptionService = {
    async getAllSubscriptions() {
        return await prisma.subscription.findMany({
            where: { isActive: true },
            orderBy: { nextBillingDate: 'asc' },
        });
    },

    async getSubscriptionById(id: number) {
        return await prisma.subscription.findUnique({
            where: { id },
        });
    },

    async createSubscription(data: {
        name: string;
        price: number;
        billingCycle: Cycle;
        nextBillingDate: Date;
        isActive?: boolean;
        notes?: string;
    }) {
        return await prisma.subscription.create({
            data,
        });
    },

    async updateSubscription(id: number, data: Partial<Subscription>) {
        return await prisma.subscription.update({
            where: { id },
            data,
        });
    },

    async deleteSubscription(id: number) {
        return await prisma.subscription.delete({
            where: { id },
        });
    },

    async getTotalMonthlySubscriptions() {
        const subscriptions = await prisma.subscription.findMany({
            where: { isActive: true },
        });

        return subscriptions.reduce((total, sub) => {
            const amount = Number(sub.price);
            return total + (sub.billingCycle === 'MONTHLY' ? amount : amount / 12);
        }, 0);
    },
};

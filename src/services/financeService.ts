import prisma from '@/lib/prisma';
import { Cycle, TxType, Subscription, Transaction } from '@prisma/client';

export const financeService = {
    // Subscriptions
    async getSubscriptions() {
        return await prisma.subscription.findMany({
            where: { isActive: true },
            orderBy: { nextBillingDate: 'asc' },
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

    // Transactions
    async getTransactions(accountId?: number) {
        return await prisma.transaction.findMany({
            where: accountId ? { accountId } : undefined,
            orderBy: { date: 'desc' },
            include: { account: true },
        });
    },

    async createTransaction(data: {
        amount: number;
        type: TxType;
        category: string;
        description?: string;
        date?: Date;
        accountId?: number;
    }) {
        return await prisma.transaction.create({
            data,
        });
    },

    async deleteTransaction(id: number) {
        return await prisma.transaction.delete({
            where: { id },
        });
    },

    async getTransactionSummary(accountId?: number) {
        const transactions = await prisma.transaction.findMany({
            where: accountId ? { accountId } : undefined,
        });
        const income = transactions
            .filter((t) => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);
        const expenses = transactions
            .filter((t) => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        return {
            income,
            expenses,
            balance: income - expenses,
        };
    },

    async getExpensesByCategory() {
        const transactions = await prisma.transaction.findMany({
            where: { type: 'EXPENSE' },
        });

        const categoryMap = new Map<string, number>();
        transactions.forEach((tx: any) => {
            const current = categoryMap.get(tx.category) || 0;
            categoryMap.set(tx.category, current + Number(tx.amount));
        });

        return Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }));
    },
};

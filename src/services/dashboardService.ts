import prisma from '@/lib/prisma';
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';

export const dashboardService = {
    async getStats() {
        const now = new Date();

        const pendingTasksCount = await prisma.task.count({
            where: {
                status: {
                    not: 'DONE',
                },
            },
        });

        const activeSubscriptions = await prisma.subscription.findMany({
            where: { isActive: true },
        });

        const monthlySubscriptionCost = activeSubscriptions.reduce((acc, sub) => {
            if (sub.billingCycle === 'MONTHLY') {
                return acc + Number(sub.price);
            } else {
                // Normalize yearly to monthly
                return acc + Number(sub.price) / 12;
            }
        }, 0);

        const transactions = await prisma.transaction.findMany({
            where: {
                type: 'EXPENSE',
                date: {
                    gte: startOfMonth(now),
                    lte: endOfMonth(now),
                },
            },
        });

        const monthlyTransactionCost = transactions.reduce((acc, tx) => {
            return acc + Number(tx.amount);
        }, 0);

        const totalMonthlyExpense = monthlySubscriptionCost + monthlyTransactionCost;

        const todayReminders = await prisma.reminder.findMany({
            where: {
                dateTime: {
                    gte: startOfDay(now),
                    lte: endOfDay(now),
                },
                isCompleted: false,
            },
        });

        return {
            pendingTasksCount,
            totalMonthlyExpense,
            todayReminders,
        };
    },
};

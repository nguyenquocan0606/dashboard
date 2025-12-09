import prisma from '@/lib/prisma';
import { Transaction, TxType } from '@prisma/client';

export const transactionService = {
    async getAllTransactions() {
        return await prisma.transaction.findMany({
            orderBy: { date: 'desc' },
        });
    },

    async getTransactionById(id: number) {
        return await prisma.transaction.findUnique({
            where: { id },
        });
    },

    async createTransaction(data: {
        amount: number;
        type: TxType;
        category: string;
        description?: string;
        date?: Date;
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

    async getTransactionSummary() {
        const transactions = await prisma.transaction.findMany();
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
        const expenses = await prisma.transaction.findMany({
            where: { type: 'EXPENSE' },
        });

        const categoryMap = new Map<string, number>();
        expenses.forEach((t) => {
            const current = categoryMap.get(t.category) || 0;
            categoryMap.set(t.category, current + Number(t.amount));
        });

        return Array.from(categoryMap.entries()).map(([name, value]) => ({
            name,
            value,
        }));
    },
};

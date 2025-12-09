import prisma from '@/lib/prisma';

export const accountService = {
    async getAccounts() {
        return await prisma.account.findMany({
            orderBy: { createdAt: 'asc' },
        });
    },

    async getAccountById(id: number) {
        return await prisma.account.findUnique({
            where: { id },
        });
    },

    async createAccount(data: {
        name: string;
        initialBalance?: number;
        color?: string;
        description?: string;
    }) {
        return await prisma.account.create({
            data: {
                name: data.name,
                initialBalance: data.initialBalance ?? 0,
                color: data.color,
                description: data.description,
            },
        });
    },

    async updateAccount(id: number, data: {
        name?: string;
        initialBalance?: number;
        color?: string;
        description?: string;
    }) {
        return await prisma.account.update({
            where: { id },
            data,
        });
    },

    async deleteAccount(id: number) {
        return await prisma.account.delete({
            where: { id },
        });
    },

    async getAccountSummary(accountId: number) {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account) return null;

        const transactions = await prisma.transaction.findMany({
            where: { accountId },
        });

        const income = transactions
            .filter((t) => t.type === 'INCOME')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const expenses = transactions
            .filter((t) => t.type === 'EXPENSE')
            .reduce((sum, t) => sum + Number(t.amount), 0);

        const currentBalance = Number(account.initialBalance) + income - expenses;

        return {
            account,
            income,
            expenses,
            currentBalance,
        };
    },

    async getAccountsWithSummary() {
        const accounts = await prisma.account.findMany({
            orderBy: { createdAt: 'asc' },
        });

        const accountSummaries = await Promise.all(
            accounts.map(async (account) => {
                const transactions = await prisma.transaction.findMany({
                    where: { accountId: account.id },
                });

                const income = transactions
                    .filter((t) => t.type === 'INCOME')
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const expenses = transactions
                    .filter((t) => t.type === 'EXPENSE')
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                const currentBalance = Number(account.initialBalance) + income - expenses;

                return {
                    ...account,
                    income,
                    expenses,
                    currentBalance,
                };
            })
        );

        return accountSummaries;
    },
};

import { NextResponse } from 'next/server';
import { financeService } from '@/services/financeService';
import { z } from 'zod';

const createTransactionSchema = z.object({
    amount: z.number().positive(),
    type: z.enum(['INCOME', 'EXPENSE']),
    category: z.string().min(1),
    description: z.string().optional(),
    date: z.string().optional().transform((str) => (str ? new Date(str) : new Date())),
    accountId: z.number().optional(),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const accountIdParam = searchParams.get('accountId');
    const accountId = accountIdParam ? parseInt(accountIdParam) : undefined;

    try {
        if (type === 'summary') {
            const summary = await financeService.getTransactionSummary(accountId);
            return NextResponse.json(summary);
        }

        if (type === 'chart') {
            const data = await financeService.getExpensesByCategory();
            return NextResponse.json(data);
        }
        const transactions = await financeService.getTransactions(accountId);
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = createTransactionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const transaction = await financeService.createTransaction(validation.data);
        return NextResponse.json(transaction, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
}

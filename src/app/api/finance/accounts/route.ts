import { NextResponse } from 'next/server';
import { accountService } from '@/services/accountService';
import { z } from 'zod';

const createAccountSchema = z.object({
    name: z.string().min(1),
    initialBalance: z.number().optional().default(0),
    color: z.string().optional(),
    description: z.string().optional(),
});

export async function GET() {
    try {
        const accounts = await accountService.getAccountsWithSummary();
        return NextResponse.json(accounts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = createAccountSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const account = await accountService.createAccount(validation.data);
        return NextResponse.json(account, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}

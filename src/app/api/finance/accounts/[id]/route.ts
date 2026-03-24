import { NextResponse } from 'next/server';
import { accountService } from '@/services/accountService';
import { z } from 'zod';

const updateAccountSchema = z.object({
    name: z.string().min(1).optional(),
    initialBalance: z.number().optional(),
    color: z.string().optional(),
    description: z.string().optional(),
});

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const summary = await accountService.getAccountSummary(id);

        if (!summary) {
            return NextResponse.json({ error: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(summary);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const validation = updateAccountSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const account = await accountService.updateAccount(id, validation.data);
        return NextResponse.json(account);
    } catch {
        return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await accountService.deleteAccount(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}

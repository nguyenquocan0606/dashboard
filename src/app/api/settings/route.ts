import { NextResponse } from 'next/server';
import { accountService } from '@/services/accountService';

// GET: Get primary account with balance
export async function GET() {
    try {
        const accounts = await accountService.getAccountsWithSummary();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const primaryAccount = accounts.find((acc: any) => acc.isPrimary);
        return NextResponse.json(primaryAccount || null);
    } catch (error) {
        console.error('Failed to fetch primary account:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PUT: Set primary account
export async function PUT(request: Request) {
    try {
        const { accountId } = await request.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prisma = (await import('@/lib/prisma')).default as any;

        // First, unset all accounts as primary
        await prisma.account.updateMany({
            where: { isPrimary: true },
            data: { isPrimary: false },
        });

        // Then set the selected account as primary
        if (accountId) {
            await prisma.account.update({
                where: { id: accountId },
                data: { isPrimary: true },
            });
        }

        // Return the updated primary account with balance
        const accounts = await accountService.getAccountsWithSummary();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedAccount = accounts.find((acc: any) => acc.isPrimary);

        return NextResponse.json(updatedAccount || null);
    } catch (error) {
        console.error('Failed to update primary account:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}

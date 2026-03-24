import { NextResponse } from 'next/server';
import { financeService } from '@/services/financeService';

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await financeService.deleteTransaction(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 });
    }
}

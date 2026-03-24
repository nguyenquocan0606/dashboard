import { NextResponse } from 'next/server';
import { financeService } from '@/services/financeService';
import { z } from 'zod';

const updateSubscriptionSchema = z.object({
    name: z.string().min(1).optional(),
    price: z.number().positive().optional(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
    nextBillingDate: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const validation = updateSubscriptionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const subscription = await financeService.updateSubscription(id, validation.data as Parameters<typeof financeService.updateSubscription>[1]);
        return NextResponse.json(subscription);
    } catch {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await financeService.deleteSubscription(id);
        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete subscription' }, { status: 500 });
    }
}

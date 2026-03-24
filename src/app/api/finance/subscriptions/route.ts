import { NextResponse } from 'next/server';
import { financeService } from '@/services/financeService';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    billingCycle: z.enum(['MONTHLY', 'YEARLY']),
    nextBillingDate: z.string().transform((str) => new Date(str)),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
});

export async function GET() {
    try {
        const subscriptions = await financeService.getSubscriptions();
        return NextResponse.json(subscriptions);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = createSubscriptionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const subscription = await financeService.createSubscription(validation.data);
        return NextResponse.json(subscription, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
    }
}

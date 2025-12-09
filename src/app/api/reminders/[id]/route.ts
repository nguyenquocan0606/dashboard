import { NextResponse } from 'next/server';
import { reminderService } from '@/services/reminderService';
import { z } from 'zod';

const updateReminderSchema = z.object({
    title: z.string().min(1).optional(),
    dateTime: z.string().optional().transform((str) => (str ? new Date(str) : undefined)),
    isRecurring: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
});

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        const body = await request.json();
        const validation = updateReminderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const reminder = await reminderService.updateReminder(id, validation.data);
        return NextResponse.json(reminder);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update reminder' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        await reminderService.deleteReminder(id);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
}

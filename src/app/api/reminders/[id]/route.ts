import { NextResponse } from 'next/server';
import { reminderService } from '@/services/reminderService';
import { CalendarSyncService } from '@/services/calendarSync.service';
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

        // Auto-sync to calendar (fire-and-forget)
        CalendarSyncService.syncEventToNylas({
            sourceType: 'reminder',
            sourceId: id,
            action: 'update',
        }).catch(err => console.error('Background sync failed:', err));

        return NextResponse.json(reminder);
    } catch {
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

        // Sync deletion to calendar (fire-and-forget)
        CalendarSyncService.syncEventToNylas({
            sourceType: 'reminder',
            sourceId: id,
            action: 'delete',
        }).catch(err => console.error('Background sync failed:', err));

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Failed to delete reminder' }, { status: 500 });
    }
}

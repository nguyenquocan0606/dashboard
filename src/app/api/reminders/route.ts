import { NextResponse } from 'next/server';
import { reminderService } from '@/services/reminderService';
import { CalendarSyncService } from '@/services/calendarSync.service';
import { z } from 'zod';

const createReminderSchema = z.object({
    title: z.string().min(1),
    dateTime: z.string().transform((str) => new Date(str)),
    isRecurring: z.boolean().optional(),
    isCompleted: z.boolean().optional(),
    color: z.string().optional().default('#10b981'),
});

export async function GET() {
    try {
        const reminders = await reminderService.getAllReminders();
        return NextResponse.json(reminders);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validation = createReminderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: validation.error.issues }, { status: 400 });
        }

        const reminder = await reminderService.createReminder(validation.data);

        // Auto-sync to calendar (fire-and-forget - don't wait)
        CalendarSyncService.syncEventToNylas({
            sourceType: 'reminder',
            sourceId: reminder.id,
            action: 'create',
        }).catch(err => console.error('Background sync failed:', err));

        return NextResponse.json(reminder, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create reminder' }, { status: 500 });
    }
}

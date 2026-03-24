import { NextResponse } from 'next/server';
import { CalendarSyncService } from '@/services/calendarSync.service';

/**
 * POST /api/calendar/sync
 * Manually trigger full sync of all events
 */
export async function POST() {
    try {
        await CalendarSyncService.syncAllEvents();
        return NextResponse.json({ success: true, message: 'Sync completed' });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json(
            { error: 'Sync failed', details: String(error) },
            { status: 500 }
        );
    }
}

import { nylas, isNylasConfigured } from '@/lib/nylas';
import prisma from '@/lib/prisma';

interface SyncEventParams {
    sourceType: 'task' | 'reminder' | 'subscription';
    sourceId: number;
    action: 'create' | 'update' | 'delete';
}

interface EventData {
    title: string;
    description: string;
    start: Date;
    end: Date;
}

export class CalendarSyncService {
    /**
     * Sync 1 event to all connected Nylas calendars
     * Called after Task/Reminder/Subscription CRUD operations
     */
    static async syncEventToNylas(params: SyncEventParams) {
        if (!isNylasConfigured()) {
            console.log('Nylas not configured, skipping sync');
            return;
        }

        const { sourceType, sourceId, action } = params;

        // Get all active calendar connections
        const connections = await prisma.calendarConnection.findMany({
            where: { isActive: true },
        });

        if (connections.length === 0) {
            console.log('No calendar connections found, skipping sync');
            return;
        }

        // Sync to each connected calendar
        for (const conn of connections) {
            try {
                if (action === 'delete') {
                    await this.deleteEvent(conn, sourceType, sourceId);
                } else {
                    await this.upsertEvent(conn, sourceType, sourceId);
                }
            } catch (error) {
                console.error(`Sync failed for ${sourceType}:${sourceId}`, error);
                await this.logSync({
                    action,
                    sourceType,
                    sourceId,
                    status: 'failed',
                    error: String(error),
                });
            }
        }
    }

    /**
     * Create or update event on Nylas calendar
     */
    private static async upsertEvent(
        connection: { id: number; nylasGrantId: string },
        sourceType: string,
        sourceId: number
    ) {
        // Fetch source data from database
        const eventData = await this.fetchSourceData(sourceType, sourceId);
        if (!eventData) {
            console.log(`Source data not found for ${sourceType}:${sourceId}`);
            return;
        }

        // Check if this event already synced
        const existing = await prisma.calendarEvent.findFirst({
            where: { sourceType, sourceId, connectionId: connection.id },
        });

        // Prepare Nylas event object
        const nylasEvent = {
            title: eventData.title,
            when: {
                startTime: Math.floor(eventData.start.getTime() / 1000),
                endTime: Math.floor(eventData.end.getTime() / 1000),
            },
            description: eventData.description,
        };

        try {
            // Get first available calendar for this grant
            let calendarId = 'primary'; // Default fallback
            try {
                const calendars = await nylas.calendars.list({
                    identifier: connection.nylasGrantId,
                });

                if (calendars.data && calendars.data.length > 0) {
                    // Use first writable calendar
                    const writableCalendar = calendars.data.find(cal => !cal.readOnly);
                    calendarId = writableCalendar?.id || calendars.data[0].id;
                    console.log(`Using calendar: ${calendarId} for grant ${connection.nylasGrantId}`);
                }
            } catch (calError) {
                console.warn('Failed to fetch calendars, using primary:', calError);
            }

            if (existing) {
                // Update existing event
                await nylas.events.update({
                    identifier: connection.nylasGrantId,
                    eventId: existing.nylasEventId,
                    requestBody: nylasEvent,
                    queryParams: { calendarId },
                });

                console.log(`Updated event ${existing.nylasEventId} for ${sourceType}:${sourceId}`);
            } else {
                // Create new event
                const created = await nylas.events.create({
                    identifier: connection.nylasGrantId,
                    requestBody: nylasEvent,
                    queryParams: { calendarId },
                });

                // Store mapping
                await prisma.calendarEvent.create({
                    data: {
                        nylasEventId: created.data.id,
                        sourceType,
                        sourceId,
                        connectionId: connection.id,
                    },
                });

                console.log(`Created event ${created.data.id} for ${sourceType}:${sourceId}`);
            }

            await this.logSync({
                action: existing ? 'update' : 'create',
                sourceType,
                sourceId,
                status: 'success',
            });
        } catch (error) {
            throw new Error(`Failed to upsert event: ${error}`);
        }
    }

    /**
     * Delete event from Nylas calendar
     */
    private static async deleteEvent(
        connection: { id: number; nylasGrantId: string },
        sourceType: string,
        sourceId: number
    ) {
        const existing = await prisma.calendarEvent.findFirst({
            where: { sourceType, sourceId, connectionId: connection.id },
        });

        if (!existing) {
            console.log(`No synced event found for ${sourceType}:${sourceId}`);
            return;
        }

        try {
            // Get calendar ID for this grant
            let calendarId = 'primary'; // Default fallback
            try {
                const calendars = await nylas.calendars.list({
                    identifier: connection.nylasGrantId,
                });

                if (calendars.data && calendars.data.length > 0) {
                    calendarId = calendars.data[0].id;
                }
            } catch (calError) {
                console.warn('Failed to fetch calendars for deletion, using primary:', calError);
            }

            // Delete from Nylas
            await nylas.events.destroy({
                identifier: connection.nylasGrantId,
                eventId: existing.nylasEventId,
                queryParams: { calendarId },
            });

            // Delete mapping
            await prisma.calendarEvent.delete({ where: { id: existing.id } });

            console.log(`Deleted event ${existing.nylasEventId} for ${sourceType}:${sourceId}`);

            await this.logSync({
                action: 'delete',
                sourceType,
                sourceId,
                nylasEventId: existing.nylasEventId,
                status: 'success',
            });
        } catch (error) {
            throw new Error(`Failed to delete event: ${error}`);
        }
    }

    /**
     * Fetch event data from database based on source type
     */
    private static async fetchSourceData(
        sourceType: string,
        sourceId: number
    ): Promise<EventData | null> {
        switch (sourceType) {
            case 'task': {
                const task = await prisma.task.findUnique({ where: { id: sourceId } });
                if (!task || !task.dueDate) return null;
                return {
                    title: `📋 ${task.title}`,
                    description: task.description || '',
                    start: task.dueDate,
                    end: task.dueDate,
                };
            }

            case 'reminder': {
                const reminder = await prisma.reminder.findUnique({ where: { id: sourceId } });
                if (!reminder) return null;
                return {
                    title: `⏰ ${reminder.title}`,
                    description: '',
                    start: reminder.dateTime,
                    end: reminder.dateTime,
                };
            }

            case 'subscription': {
                const sub = await prisma.subscription.findUnique({ where: { id: sourceId } });
                if (!sub || !sub.isActive) return null;
                return {
                    title: `💳 ${sub.name}`,
                    description: `Billing: ${sub.price} ${sub.billingCycle}`,
                    start: sub.nextBillingDate,
                    end: sub.nextBillingDate,
                };
            }

            default:
                return null;
        }
    }

    /**
     * Log sync operation to database
     */
    private static async logSync(data: {
        action: string;
        sourceType: string;
        sourceId?: number;
        nylasEventId?: string;
        status: string;
        error?: string;
    }) {
        try {
            await prisma.syncLog.create({ data });
        } catch (error) {
            console.error('Failed to log sync:', error);
        }
    }

    /**
     * Bulk sync all existing events (for initial setup)
     */
    static async syncAllEvents() {
        console.log('Starting bulk sync...');

        // Sync all tasks with due dates
        const tasks = await prisma.task.findMany({
            where: { dueDate: { not: null } },
        });
        for (const task of tasks) {
            await this.syncEventToNylas({
                sourceType: 'task',
                sourceId: task.id,
                action: 'create',
            });
        }

        // Sync all reminders
        const reminders = await prisma.reminder.findMany();
        for (const reminder of reminders) {
            await this.syncEventToNylas({
                sourceType: 'reminder',
                sourceId: reminder.id,
                action: 'create',
            });
        }

        // Sync all active subscriptions
        const subscriptions = await prisma.subscription.findMany({
            where: { isActive: true },
        });
        for (const sub of subscriptions) {
            await this.syncEventToNylas({
                sourceType: 'subscription',
                sourceId: sub.id,
                action: 'create',
            });
        }

        console.log('Bulk sync completed');
    }
}

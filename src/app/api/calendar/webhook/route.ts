import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/calendar/webhook?challenge=xxx
 * Webhook verification - Nylas sends this during setup
 */
export async function GET(req: NextRequest) {
    const challenge = req.nextUrl.searchParams.get('challenge');

    if (!challenge) {
        return NextResponse.json({ error: 'Missing challenge parameter' }, { status: 400 });
    }

    // Return the challenge value to verify the webhook endpoint
    console.log('✅ Webhook verification challenge received');
    return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
    });
}

/**
 * POST /api/calendar/webhook
 * Receive webhook notifications from Nylas
 * Handles: event.created, event.updated, event.deleted
 * 
 * CRITICAL: Must respond within 10 seconds or Nylas will timeout with 502
 */
export async function POST(req: NextRequest) {
    try {
        // Verify webhook signature (recommended for production)
        const _signature = req.headers.get('x-nylas-signature');
        // TODO: Implement signature verification with webhook secret

        const payload = await req.json();

        // Nylas v3 webhook format: { data: { object: "event", ... }, type: "event.created" }
        const webhookType = payload.type || payload.event_type;
        const eventData = payload.data;

        console.log(`📨 Webhook received: ${webhookType}`, eventData);

        // Only process event-related webhooks
        if (!webhookType || !webhookType.startsWith('event.')) {
            console.log(`⚠️ Ignoring non-event webhook: ${webhookType}`);
            return NextResponse.json({ success: true });
        }

        // CRITICAL: Process asynchronously and respond immediately
        // This prevents Nylas 502 timeout (10 second limit)
        processWebhookAsync(webhookType, eventData).catch((error) => {
            console.error('Async webhook processing error:', error);
        });

        // Return success immediately
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

/**
 * Process webhook asynchronously after response is sent
 */
async function processWebhookAsync(webhookType: string, eventData: { id?: string; object?: string }) {
    try {
        // Log all webhook events (optional sourceType for webhooks)
        await prisma.syncLog.create({
            data: {
                action: 'webhook',
                sourceType: webhookType,
                sourceId: null,
                nylasEventId: eventData?.id || null,
                status: 'success',
                error: null,
            },
        });

        // Handle different event types
        switch (webhookType) {
            case 'event.created':
            case 'event.updated':
                // Web has priority - don't overwrite events created from web
                // Just log for awareness
                console.log(`ℹ️ Event ${webhookType} from Apple Calendar (ignored - web priority)`);
                break;

            case 'event.deleted':
                // If user deletes on Google/Apple, delete on web
                await handleEventDeleted(eventData);
                break;

            default:
                console.log(`⚠️ Unhandled webhook event: ${webhookType}`);
        }
    } catch (error) {
        console.error('Error processing webhook async:', error);
    }
}

/**
 * Handle event deletion from Google/Apple Calendar
 */
async function handleEventDeleted(eventData: { id?: string }) {
    const nylasEventId = eventData?.id;
    if (!nylasEventId) return;

    try {
        const calendarEvent = await prisma.calendarEvent.findUnique({
            where: { nylasEventId },
        });

        if (!calendarEvent) {
            console.log(`Event ${nylasEventId} not found in database`);
            return;
        }

        // Only delete Reminders (user-created events)
        // Don't auto-delete Tasks/Subscriptions (important data)
        if (calendarEvent.sourceType === 'reminder') {
            await prisma.reminder.delete({
                where: { id: calendarEvent.sourceId },
            });
            await prisma.calendarEvent.delete({
                where: { id: calendarEvent.id },
            });
            console.log(`🗑️ Deleted reminder ${calendarEvent.sourceId} (from Apple Calendar)`);
        } else {
            console.log(`ℹ️ Ignored deletion of ${calendarEvent.sourceType} (protected)`);
        }
    } catch (error) {
        console.error('Failed to handle event deletion:', error);
    }
}

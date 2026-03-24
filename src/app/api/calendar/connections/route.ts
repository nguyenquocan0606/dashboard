import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * GET /api/calendar/connections
 * Get all active calendar connections
 */
export async function GET() {
    try {
        const connections = await prisma.calendarConnection.findMany({
            where: { isActive: true },
            select: {
                id: true,
                provider: true,
                email: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(connections);
    } catch (error) {
        console.error('Failed to fetch connections:', error);
        return NextResponse.json(
            { error: 'Failed to fetch connections' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/calendar/connections?id=xxx
 * Disconnect a calendar
 */
export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { error: 'Connection ID required' },
                { status: 400 }
            );
        }

        // Soft delete (set isActive = false)
        await prisma.calendarConnection.update({
            where: { id: parseInt(id) },
            data: { isActive: false },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete connection:', error);
        return NextResponse.json(
            { error: 'Failed to delete connection' },
            { status: 500 }
        );
    }
}

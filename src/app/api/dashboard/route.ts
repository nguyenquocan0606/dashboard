import { NextResponse } from 'next/server';
import { dashboardService } from '@/services/dashboardService';

export async function GET() {
    try {
        const stats = await dashboardService.getStats();
        return NextResponse.json(stats);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
    }
}

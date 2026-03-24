import { NextRequest, NextResponse } from 'next/server';
import { nylas, NYLAS_CONFIG, isNylasConfigured } from '@/lib/nylas';

/**
 * GET /api/calendar/oauth?provider=google|apple
 * Generate OAuth URL for calendar connection
 */
export async function GET(req: NextRequest) {
    if (!isNylasConfigured()) {
        return NextResponse.json(
            { error: 'Nylas not configured. Please add credentials to .env' },
            { status: 500 }
        );
    }

    const provider = req.nextUrl.searchParams.get('provider');

    if (!provider || !['google', 'apple'].includes(provider)) {
        return NextResponse.json(
            { error: 'Invalid provider. Must be "google" or "apple"' },
            { status: 400 }
        );
    }

    try {
        const authUrl = nylas.auth.urlForOAuth2({
            clientId: NYLAS_CONFIG.clientId,
            redirectUri: NYLAS_CONFIG.redirectUri,
            scope: ['calendar'],
            provider: provider === 'google' ? 'google' : 'icloud',
        });

        return NextResponse.json({ url: authUrl });
    } catch (error) {
        console.error('OAuth URL generation error:', error);
        return NextResponse.json(
            { error: 'Failed to generate OAuth URL' },
            { status: 500 }
        );
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { nylas, isNylasConfigured } from '@/lib/nylas';
import prisma from '@/lib/prisma';

/**
 * GET /api/calendar/oauth/callback?code=xxx
 * Handle OAuth callback from Nylas
 */
export async function GET(req: NextRequest) {
    if (!isNylasConfigured()) {
        return NextResponse.redirect(
            new URL('/calendar?error=nylas_not_configured', req.url)
        );
    }

    const code = req.nextUrl.searchParams.get('code');

    if (!code) {
        return NextResponse.redirect(
            new URL('/calendar?error=oauth_failed', req.url)
        );
    }

    try {
        // Exchange authorization code for access token
        const response = await nylas.auth.exchangeCodeForToken({
            clientId: process.env.NYLAS_CLIENT_ID!,
            clientSecret: process.env.NYLAS_API_KEY!,
            redirectUri: process.env.NYLAS_REDIRECT_URI!,
            code,
        });

        const { grantId, email, accessToken, refreshToken, expiresIn, provider } = response;

        // Calculate token expiration
        const expiresAt = new Date(Date.now() + (expiresIn || 3600) * 1000);

        // Save connection to database
        await prisma.calendarConnection.create({
            data: {
                provider: provider || 'google',
                email: email || 'unknown',
                accessToken: accessToken || '',
                refreshToken: refreshToken || null,
                expiresAt,
                nylasGrantId: grantId,
            },
        });

        console.log(`✅ Calendar connected: ${email} (${provider})`);

        return NextResponse.redirect(
            new URL('/calendar?success=connected', req.url)
        );
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(
            new URL('/calendar?error=oauth_failed', req.url)
        );
    }
}

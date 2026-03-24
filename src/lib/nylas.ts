import Nylas from 'nylas';

if (!process.env.NYLAS_CLIENT_ID || !process.env.NYLAS_API_KEY) {
    console.warn('Nylas credentials not configured. Calendar sync will be disabled.');
}

export const nylas = new Nylas({
    apiKey: process.env.NYLAS_API_KEY || '',
    apiUri: 'https://api.us.nylas.com',
});

export const NYLAS_CONFIG = {
    clientId: process.env.NYLAS_CLIENT_ID || '',
    redirectUri: process.env.NYLAS_REDIRECT_URI || 'http://localhost:3055/api/calendar/oauth/callback',
    webhookSecret: process.env.NYLAS_WEBHOOK_SECRET || '',
};

export const isNylasConfigured = () => {
    return !!(process.env.NYLAS_CLIENT_ID && process.env.NYLAS_API_KEY);
};

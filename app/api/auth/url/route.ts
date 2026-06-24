import { addLog } from '@/lib/server-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get('provider') || 'googlefit';
    
    // Construct mock OAuth provider client configurations
    const oauthConfigs: Record<string, { scopes: string[]; name: string }> = {
      'googlefit': {
        name: 'Google Fit',
        scopes: ['https://www.googleapis.com/auth/fitness.activity.read', 'https://www.googleapis.com/auth/fitness.body.read']
      },
      'fitbit': {
        name: 'Fitbit',
        scopes: ['activity', 'heartrate', 'sleep', 'weight']
      },
      'strava': {
        name: 'Strava',
        scopes: ['read', 'activity:read']
      }
    };

    const config = oauthConfigs[provider] || oauthConfigs.googlefit;

    // Get app URL or origin
    const appUrl = process.env.APP_URL || new URL(req.url).origin;
    const redirectUri = `${appUrl}/api/auth/callback`;

    // Construct the query params pointing to our beautiful mock OAuth provider screen
    const queryParams = new URLSearchParams({
      provider,
      client_id: `client_${provider}_${Math.random().toString(36).substring(2, 8)}`,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state: `state_${Math.random().toString(36).substring(2, 10)}`
    });

    const authUrl = `${appUrl}/oauth-provider?${queryParams.toString()}`;

    addLog(
      'auth',
      'info',
      `OAuth authorization URL generated for ${config.name}.`,
      `Client fetched consent endpoint. Redirect URI: ${redirectUri}, scopes requested: [${config.scopes.join(', ')}].`
    );

    return NextResponse.json({
      success: true,
      url: authUrl
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

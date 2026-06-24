import { store, addLog } from '@/lib/server-store';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Return connection statuses and API healths
    return NextResponse.json({
      success: true,
      connections: store.connections,
      apiHealth: store.apiHealth
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { action, provider } = await req.json();

    if (action === 'disconnect') {
      if (!provider || !store.connections[provider]) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or missing provider'
        }, { status: 400 });
      }

      // Record state change
      store.connections[provider] = { connected: false };
      
      const humanNames: Record<string, string> = {
        'googlefit': 'Google Fit',
        'fitbit': 'Fitbit',
        'strava': 'Strava'
      };
      const providerName = humanNames[provider] || provider;

      addLog(
        'auth',
        'warning',
        `OAuth credentials revoked for ${providerName}.`,
        `User manually disconnected the integration. Access token invalidated, background synchronization halted.`
      );

      return NextResponse.json({
        success: true,
        message: `${providerName} disconnected successfully`,
        connections: store.connections
      });
    }

    if (action === 'refresh') {
      // Simulate refreshing OAuth tokens
      const connectedProviders = Object.keys(store.connections).filter(
        p => store.connections[p].connected
      );

      if (connectedProviders.length === 0) {
        addLog(
          'refresh',
          'info',
          'Token health check executed.',
          '0 active connections found. No token refreshes required.'
        );
        return NextResponse.json({
          success: true,
          message: 'No active connections to refresh.',
          connections: store.connections
        });
      }

      const humanNames: Record<string, string> = {
        'googlefit': 'Google Fit',
        'fitbit': 'Fitbit',
        'strava': 'Strava'
      };

      for (const provider of connectedProviders) {
        const providerName = humanNames[provider] || provider;
        const newExpiry = new Date(Date.now() + 3600 * 1000).toISOString(); // 1 hour
        store.connections[provider].expiresAt = newExpiry;
        
        addLog(
          'refresh',
          'success',
          `OAuth Access Token auto-refreshed for ${providerName}.`,
          `Using Client ID and Client Secret, exchanged refresh token. New expiry: ${new Date(newExpiry).toLocaleTimeString()}`,
          provider
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Tokens refreshed successfully',
        connections: store.connections
      });
    }

    if (action === 'simulate-outage') {
      const { provider: targetProvider, status } = await req.json();
      if (targetProvider && status) {
        store.apiHealth[targetProvider as keyof typeof store.apiHealth] = status;
        addLog(
          'system',
          status === 'healthy' ? 'success' : 'error',
          `System API Health Update: ${targetProvider} status set to ${status.toUpperCase()}.`,
          `Diagnostic sweep triggered on telemetry ping.`
        );
        return NextResponse.json({
          success: true,
          apiHealth: store.apiHealth
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

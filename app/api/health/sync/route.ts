import { store, addLog } from '@/lib/server-store';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { forceProvider } = await req.json().catch(() => ({ forceProvider: null }));
    
    // Determine connected providers
    const activeProviders = Object.keys(store.connections).filter(
      provider => store.connections[provider].connected || (forceProvider === provider)
    );

    if (activeProviders.length === 0) {
      addLog(
        'sync',
        'warning',
        'Physical health synchronization aborted: No connected providers.',
        'Requested metric sync, but user accounts are not authorized with Fitbit, Google Fit, or Strava.'
      );
      return NextResponse.json({
        success: false,
        error: 'No active provider connections found. Please connect a provider using OAuth.'
      }, { status: 400 });
    }

    const providerNames: Record<string, string> = {
      'googlefit': 'Google Fit',
      'fitbit': 'Fitbit',
      'strava': 'Strava'
    };

    let syncedCount = 0;
    const syncedDetails: string[] = [];

    for (const provider of activeProviders) {
      const providerName = providerNames[provider] || provider;
      const apiStatus = store.apiHealth[provider as keyof typeof store.apiHealth] || 'healthy';

      if (apiStatus === 'offline') {
        addLog(
          'sync',
          'error',
          `Sync Failed: ${providerName} server is unreachable.`,
          `HTTP Error 503: Service Unavailable. The external OAuth credentials remained valid, but server failed to answer health diagnostic telemetry.`,
          provider
        );
        continue;
      }

      if (apiStatus === 'degraded') {
        addLog(
          'sync',
          'warning',
          `Sync Degraded: ${providerName} returned partial data.`,
          `HTTP Warning 206: Partial Content. Sync took 4.2 seconds due to network rate-limiting. Pulled steps, but heartrate series failed to synchronize.`,
          provider
        );
        // Continue but with some degraded values
      }

      // Perform simulated sync and update the last day's metrics
      const now = new Date();
      const todayStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Update store connections synced time
      if (store.connections[provider]) {
        store.connections[provider].lastSyncedAt = now.toISOString();
      }

      // Generate random sync figures for today
      const steps = apiStatus === 'degraded' ? 2400 : 7000 + Math.floor(Math.random() * 5000);
      const hr = 72 + Math.floor(Math.random() * 8);
      const sleep = 6.8 + parseFloat((Math.random() * 1.5).toFixed(1));
      const calories = 1800 + Math.floor(Math.random() * 800);

      // Check if we already have today's metrics, update them, otherwise insert
      const existingDayIndex = store.healthMetrics.findIndex(m => m.date === todayStr);
      if (existingDayIndex >= 0) {
        store.healthMetrics[existingDayIndex] = {
          date: todayStr,
          steps,
          heartRate: hr,
          sleepHours: sleep,
          caloriesBurned: calories,
          syncedFrom: providerName
        };
      } else {
        store.healthMetrics.push({
          date: todayStr,
          steps,
          heartRate: hr,
          sleepHours: sleep,
          caloriesBurned: calories,
          syncedFrom: providerName
        });
        // Limit historical chart data to last 10 records
        if (store.healthMetrics.length > 10) {
          store.healthMetrics.shift();
        }
      }

      syncedCount++;
      syncedDetails.push(`${providerName} (${steps} steps, ${sleep}h sleep, ${hr} bpm, ${calories} cal)`);

      addLog(
        'sync',
        'success',
        `Sync Successful: Health data refreshed via ${providerName}.`,
        `Successfully pulled telemetry. Steps: ${steps.toLocaleString()}, Sleep: ${sleep} hrs, Heart Rate: ${hr} bpm, Calories: ${calories.toLocaleString()} kcal. Security OAuth checks validated.`,
        provider
      );
    }

    if (syncedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'All sync requests failed due to remote API offline status. See system logs for diagnostic details.'
      }, { status: 502 });
    }

    return NextResponse.json({
      success: true,
      message: `Health log sync completed for ${syncedCount} providers.`,
      details: syncedDetails,
      healthMetrics: store.healthMetrics,
      connections: store.connections
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}

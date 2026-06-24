// Server-side in-memory state store for Health & Auth Sync
// Uses globalThis to persist state during development hot reloads

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'sync' | 'refresh' | 'system';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details?: string;
  provider?: string;
}

export interface ProviderConnection {
  connected: boolean;
  accessToken?: string;
  expiresAt?: string;
  scopes?: string[];
  userEmail?: string;
  lastSyncedAt?: string;
}

export interface MetricDay {
  date: string;
  steps: number;
  heartRate: number;
  sleepHours: number;
  caloriesBurned: number;
  syncedFrom?: string;
}

export interface StoreState {
  logs: LogEntry[];
  connections: Record<string, ProviderConnection>;
  healthMetrics: MetricDay[];
  apiHealth: {
    fitbit: 'healthy' | 'degraded' | 'offline';
    googlefit: 'healthy' | 'degraded' | 'offline';
    strava: 'healthy' | 'degraded' | 'offline';
    authService: 'healthy' | 'degraded' | 'offline';
  };
}

// Generate realistic starting logs
const generateInitialLogs = (): LogEntry[] => {
  const logs: LogEntry[] = [];
  const now = new Date();
  
  // Helper to subtract minutes
  const subMinutes = (d: Date, m: number) => new Date(d.getTime() - m * 60000);

  logs.push({
    id: 'log-1',
    timestamp: subMinutes(now, 180).toISOString(),
    type: 'system',
    level: 'success',
    message: 'Health & Auth Sync database initialized successfully.',
    details: 'Verified local state engines and active sessions table.'
  });

  logs.push({
    id: 'log-2',
    timestamp: subMinutes(now, 175).toISOString(),
    type: 'system',
    level: 'info',
    message: 'Secure Auth Proxy gateway online.',
    details: 'Listening on port 3000. Frame permissions mapped.'
  });

  logs.push({
    id: 'log-3',
    timestamp: subMinutes(now, 120).toISOString(),
    type: 'auth',
    level: 'info',
    message: 'OAuth callback listener registered for fitbit, googlefit, and strava.',
    details: 'Callback redirect URI configured as matching request host origin.'
  });

  logs.push({
    id: 'log-4',
    timestamp: subMinutes(now, 60).toISOString(),
    type: 'refresh',
    level: 'success',
    message: 'Scheduled token health check completed.',
    details: 'All token sessions evaluated. 0 active tokens requiring refresh.'
  });

  logs.push({
    id: 'log-5',
    timestamp: subMinutes(now, 30).toISOString(),
    type: 'system',
    level: 'info',
    message: 'Active monitoring check: OAuth APIs health ping sent.',
    details: 'Fitbit REST API: 200 OK (112ms), Google Fit REST API: 200 OK (89ms), Strava API: 200 OK (142ms).'
  });

  return logs.reverse(); // Newest first
};

// Generate realistic starting health metrics
const generateInitialMetrics = (): MetricDay[] => {
  const metrics: MetricDay[] = [];
  const now = new Date();
  
  // Create last 7 days of metrics
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Variance in metrics
    const stepsSeed = 6000 + Math.floor(Math.random() * 6000);
    const hrSeed = 68 + Math.floor(Math.random() * 12);
    const sleepSeed = 6.2 + parseFloat((Math.random() * 2.3).toFixed(1));
    const calSeed = 2000 + Math.floor(Math.random() * 1000);

    metrics.push({
      date: dateStr,
      steps: stepsSeed,
      heartRate: hrSeed,
      sleepHours: sleepSeed,
      caloriesBurned: calSeed,
      syncedFrom: i % 2 === 0 ? 'Google Fit' : 'Fitbit'
    });
  }
  return metrics;
};

const getInitialState = (): StoreState => ({
  logs: generateInitialLogs(),
  connections: {
    'googlefit': { connected: false },
    'fitbit': { connected: false },
    'strava': { connected: false }
  },
  healthMetrics: generateInitialMetrics(),
  apiHealth: {
    fitbit: 'healthy',
    googlefit: 'healthy',
    strava: 'healthy',
    authService: 'healthy'
  }
});

// Attach to globalThis to preserve state on hot-reloading
const globalStore = globalThis as unknown as {
  healthAuthStore: StoreState | undefined;
};

if (!globalStore.healthAuthStore) {
  globalStore.healthAuthStore = getInitialState();
}

export const store = globalStore.healthAuthStore;

// Helper to push a new log safely
export function addLog(
  type: 'auth' | 'sync' | 'refresh' | 'system',
  level: 'success' | 'info' | 'warning' | 'error',
  message: string,
  details?: string,
  provider?: string
) {
  const newLog: LogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    level,
    message,
    details,
    provider
  };
  store.logs.unshift(newLog);
  // Keep logs list capped at 150 to save memory
  if (store.logs.length > 150) {
    store.logs.pop();
  }
  return newLog;
}

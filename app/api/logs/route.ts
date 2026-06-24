import { NextRequest, NextResponse } from 'next/server';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'sync' | 'refresh' | 'system';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

// In-memory logs for standard session tracking
let serverLogs: LogEntry[] = [
  {
    id: 'init_1',
    timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
    type: 'system',
    level: 'info',
    message: 'Workspace Integration Server initialized.',
    details: 'Telemetry engine started successfully. Listening for Firebase auth state changes.'
  },
  {
    id: 'init_2',
    timestamp: new Date(Date.now() - 1800 * 1000).toISOString(),
    type: 'system',
    level: 'success',
    message: 'Google Cloud API credentials verified.',
    details: 'Authorized scopes for Gmail, Drive, Calendar, Contacts, and Picker are ready for handshake.'
  }
];

export async function GET() {
  return NextResponse.json({ success: true, logs: serverLogs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, level, message, details } = body;

    if (action === 'add') {
      const newLog: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: type || 'system',
        level: level || 'info',
        message: message || '',
        details: details || ''
      };

      serverLogs = [newLog, ...serverLogs].slice(0, 100); // Limit to 100 logs
      return NextResponse.json({ success: true, logs: serverLogs });
    }

    return NextResponse.json({ success: true, logs: serverLogs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

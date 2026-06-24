import { NextRequest, NextResponse } from 'next/server';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'sync' | 'refresh' | 'system';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details: string;
}

let serverLogs: LogEntry[] = [
  {
    id: 'log_init_1',
    timestamp: new Date(Date.now() - 30000).toISOString(),
    type: 'system',
    level: 'info',
    message: 'Workspace Integration Dashboard started.',
    details: 'Loaded configuration for project gen-lang-client-0806668476. Live systems verified.'
  },
  {
    id: 'log_init_2',
    timestamp: new Date(Date.now() - 25000).toISOString(),
    type: 'auth',
    level: 'success',
    message: 'OAuth permissions verification verified.',
    details: 'Scopes: gmail.readonly, drive.readonly, calendar.readonly, contacts.readonly are active.'
  },
  {
    id: 'log_init_3',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    type: 'sync',
    level: 'success',
    message: 'Firebase Firestore connection established.',
    details: 'Database: ai-studio-08497dfd-7812-4da2-bda4-cd736658f236 is online and synchronized.'
  }
];

export async function GET() {
  return NextResponse.json({ success: true, logs: serverLogs });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, type, level, message, details } = body;

    if (action === 'clear') {
      serverLogs = [];
      return NextResponse.json({ success: true, logs: serverLogs });
    }

    if (action === 'spam') {
      const count = body.count || 10;
      const mockTemplates = [
        {
          type: 'sync' as const,
          level: 'success' as const,
          message: 'Gmail API sync: Synchronized message thread.',
          details: 'Retrieved header index and snippet for message ID: msg_' + Math.random().toString(36).substring(2, 8)
        },
        {
          type: 'sync' as const,
          level: 'info' as const,
          message: 'Google Drive webhook listener triggered.',
          details: 'File metadata update detected for "Quarterly_Budget_Draft.xlsx".'
        },
        {
          type: 'sync' as const,
          level: 'success' as const,
          message: 'Google Calendar event sync completed.',
          details: 'Synced 5 upcoming agenda slots. Local timeline fully reconciled with Firestore.'
        },
        {
          type: 'sync' as const,
          level: 'warning' as const,
          message: 'Slow response from Contacts API.',
          details: 'People endpoint connections list query resolved in 1420ms. Proceeding to cache results.'
        },
        {
          type: 'auth' as const,
          level: 'success' as const,
          message: 'OAuth accessToken refreshed successfully.',
          details: 'Standard handshake verified with Google accounts servers. New token issued for 3600s.'
        },
        {
          type: 'auth' as const,
          level: 'info' as const,
          message: 'Active session audited.',
          details: 'Verified authorization signatures. User permission scopes (gmail, drive, calendar, contacts) match active database requirements.'
        },
        {
          type: 'system' as const,
          level: 'info' as const,
          message: 'Google Picker dialog component instantiated.',
          details: 'Client script injected into page DOM. Attached validated credentials header.'
        },
        {
          type: 'system' as const,
          level: 'success' as const,
          message: 'Firestore batch write committed.',
          details: 'Successfully mapped dirty data elements directly to users/{userId}/logs database path.'
        },
        {
          type: 'refresh' as const,
          level: 'success' as const,
          message: 'API Quota registries checked.',
          details: 'Developer dashboard stats polled successfully. Google Cloud Project resource utilization state: green.'
        },
        {
          type: 'system' as const,
          level: 'error' as const,
          message: 'GAPI load error. Retrying script initialization.',
          details: 'Failed to find window.google.picker namespace on first frame loop. Script fallback loader succeeded.'
        },
        {
          type: 'sync' as const,
          level: 'error' as const,
          message: 'OAuth Token expired or rejected by remote Google endpoint.',
          details: 'HTTP Status 401 Unauthorized. User session will require re-authorization popups to restore sync states.'
        },
        {
          type: 'auth' as const,
          level: 'warning' as const,
          message: 'User photoURL redirected.',
          details: 'Profile image resource redirected via lh3.googleusercontent.com fallback router.'
        }
      ];

      const newSpamLogs: LogEntry[] = [];
      for (let i = 0; i < count; i++) {
        const template = mockTemplates[Math.floor(Math.random() * mockTemplates.length)];
        const timeOffset = i * 2000; // staggered timestamps slightly for a realistic sequence
        newSpamLogs.push({
          id: `log_spam_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date(Date.now() - timeOffset).toISOString(),
          type: template.type,
          level: template.level,
          message: template.message,
          details: template.details
        });
      }

      // Add spam logs to existing logs
      serverLogs = [...newSpamLogs, ...serverLogs].slice(0, 100);
      return NextResponse.json({ success: true, logs: serverLogs });
    }

    if (action === 'add') {
      const newLog: LogEntry = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        type: type || 'system',
        level: level || 'info',
        message: message || 'General Event triggered',
        details: details || 'No additional details provided.'
      };

      serverLogs = [newLog, ...serverLogs].slice(0, 100);
      return NextResponse.json({ success: true, log: newLog, logs: serverLogs });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('API Log Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

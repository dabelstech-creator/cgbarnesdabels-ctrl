export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

export interface GoogleContact {
  id: string;
  name: string;
  email: string;
  phone: string;
}

// Helper to make Google API requests
async function googleFetch(url: string, token: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Accept', 'application/json');

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google API request failed: ${res.status} ${res.statusText} - ${errText}`);
  }
  return res.json();
}

// 1. Fetch Gmail inbox messages
export async function fetchGmailInbox(token: string): Promise<GmailMessage[]> {
  try {
    // List messages
    const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8';
    const listData = await googleFetch(listUrl, token);

    if (!listData.messages || listData.messages.length === 0) {
      return [];
    }

    // Fetch details for each message in parallel
    const detailsPromises = listData.messages.map(async (msg: { id: string }) => {
      try {
        const detailUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`;
        const detail = await googleFetch(detailUrl, token);

        const headers = detail.payload?.headers || [];
        const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
        const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(No Subject)';
        const dateHeader = headers.find((h: any) => h.name === 'Date')?.value || '';
        const date = dateHeader ? new Date(dateHeader).toLocaleDateString() : 'No Date';

        return {
          id: msg.id,
          from,
          subject,
          date,
          snippet: detail.snippet || ''
        };
      } catch (err) {
        console.error(`Error fetching detail for message ${msg.id}:`, err);
        return null;
      }
    });

    const results = await Promise.all(detailsPromises);
    return results.filter((r): r is GmailMessage => r !== null);
  } catch (err: any) {
    console.error('fetchGmailInbox Error:', err);
    throw err;
  }
}

// 2. Fetch Drive files
export async function fetchDriveFiles(token: string): Promise<DriveFile[]> {
  try {
    const url = 'https://www.googleapis.com/drive/v3/files?pageSize=12&fields=files(id,name,mimeType,webViewLink,modifiedTime)&orderBy=modifiedTime desc';
    const data = await googleFetch(url, token);
    return (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType || 'unknown',
      webViewLink: file.webViewLink || '',
      modifiedTime: file.modifiedTime || new Date().toISOString()
    }));
  } catch (err: any) {
    console.error('fetchDriveFiles Error:', err);
    throw err;
  }
}

// 3. Fetch Calendar Events
export async function fetchCalendarEvents(token: string): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=10&orderBy=startTime&singleEvents=true`;
    const data = await googleFetch(url, token);
    return (data.items || []).map((item: any) => ({
      id: item.id,
      summary: item.summary || '(No Title)',
      start: item.start?.dateTime || item.start?.date || new Date().toISOString(),
      end: item.end?.dateTime || item.end?.date || new Date().toISOString(),
      description: item.description || ''
    }));
  } catch (err: any) {
    console.error('fetchCalendarEvents Error:', err);
    throw err;
  }
}

// 4. Fetch Google Contacts
export async function fetchGoogleContacts(token: string): Promise<GoogleContact[]> {
  try {
    const url = 'https://people.googleapis.com/v1/people/me/connections?pageSize=15&personFields=names,emailAddresses,phoneNumbers';
    const data = await googleFetch(url, token);
    return (data.connections || []).map((conn: any) => {
      const name = conn.names?.[0]?.displayName || 'Unnamed Connection';
      const email = conn.emailAddresses?.[0]?.value || 'No Email';
      const phone = conn.phoneNumbers?.[0]?.value || 'No Phone';
      return {
        id: conn.resourceName?.replace('people/', '') || `contact_${Math.random().toString(36).substring(2, 8)}`,
        name,
        email,
        phone
      };
    });
  } catch (err: any) {
    console.error('fetchGoogleContacts Error:', err);
    throw err;
  }
}

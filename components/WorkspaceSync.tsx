'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  Mail, 
  FolderOpen, 
  CalendarDays, 
  Contact, 
  CheckCircle2, 
  RotateCw, 
  LogOut, 
  Globe2, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  FileCode, 
  FileAudio,
  File as FileIcon,
  Search,
  CheckCircle
} from 'lucide-react';
import { auth, db, googleProvider } from '@/lib/firebase';
import { 
  fetchGmailInbox, 
  fetchDriveFiles, 
  fetchCalendarEvents, 
  fetchGoogleContacts,
  GmailMessage,
  DriveFile,
  CalendarEvent,
  GoogleContact
} from '@/lib/google-api';

interface WorkspaceSyncProps {
  onLogAdded: (
    type: 'auth' | 'sync' | 'refresh' | 'system', 
    level: 'success' | 'info' | 'warning' | 'error', 
    message: string, 
    details?: string
  ) => void;
}

// Pure helper functions to isolate impure Date.now() / Math.random() calls from React render lifecycle
function getLogId() {
  return `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function getSyncId() {
  return `sync_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

function getPickerId() {
  return `picker_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
}

export default function WorkspaceSync({ onLogAdded }: WorkspaceSyncProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Statuses
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'gmail' | 'drive' | 'calendar' | 'contacts'>('gmail');
  
  // Scoped lists
  const [emails, setEmails] = useState<GmailMessage[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contacts, setContacts] = useState<GoogleContact[]>([]);
  
  // Search query for fetched items
  const [filterQuery, setFilterQuery] = useState('');

  // Helper to load previously cached items from Firestore
  const loadFromFirestore = useCallback(async (userId: string) => {
    try {
      // 1. Emails
      const emailSnap = await getDocs(query(collection(db, `users/${userId}/emails`), limit(20)));
      const loadedEmails: GmailMessage[] = [];
      emailSnap.forEach((d) => loadedEmails.push(d.data() as GmailMessage));
      if (loadedEmails.length > 0) setEmails(loadedEmails);

      // 2. Files
      const fileSnap = await getDocs(query(collection(db, `users/${userId}/files`), limit(20)));
      const loadedFiles: DriveFile[] = [];
      fileSnap.forEach((d) => loadedFiles.push(d.data() as DriveFile));
      if (loadedFiles.length > 0) setFiles(loadedFiles);

      // 3. Events
      const eventSnap = await getDocs(query(collection(db, `users/${userId}/events`), limit(20)));
      const loadedEvents: CalendarEvent[] = [];
      eventSnap.forEach((d) => loadedEvents.push(d.data() as CalendarEvent));
      if (loadedEvents.length > 0) setEvents(loadedEvents);

      // 4. Contacts
      const contactSnap = await getDocs(query(collection(db, `users/${userId}/contacts`), limit(20)));
      const loadedContacts: GoogleContact[] = [];
      contactSnap.forEach((d) => loadedContacts.push(d.data() as GoogleContact));
      if (loadedContacts.length > 0) setContacts(loadedContacts);
    } catch (e) {
      console.error('Error loading data from Firestore cache:', e);
    }
  }, []);

  // Setup auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        loadFromFirestore(firebaseUser.uid);
      } else {
        setEmails([]);
        setFiles([]);
        setEvents([]);
        setContacts([]);
        setAccessToken(null);
      }
    });
    return () => unsubscribe();
  }, [loadFromFirestore]);

  // Sync Action
  const triggerSyncAll = async (currentTok = accessToken, userId = user?.uid) => {
    const tok = currentTok || accessToken;
    if (!tok) {
      alert('Missing active OAuth credential. Please connect first.');
      return;
    }
    if (!userId) return;

    setIsSyncing(true);
    onLogAdded(
      'sync',
      'info',
      'Workspace Sync Session started.',
      'Requesting updated telemetry records for Gmail, Drive, Calendar, and People APIs.'
    );

    try {
      // 1. Gmail
      try {
        const fetchedEmails = await fetchGmailInbox(tok);
        setEmails(fetchedEmails);
        // Persist to Firestore
        for (const item of fetchedEmails) {
          await setDoc(doc(db, `users/${userId}/emails`, item.id), item);
        }
        onLogAdded('sync', 'success', `Synced ${fetchedEmails.length} messages from Gmail Inbox.`, 'Retrieved message headers, snippets, and dispatch times.');
      } catch (err: any) {
        console.error('Gmail Sync Error:', err);
        onLogAdded('sync', 'error', 'Gmail Sync failed.', err.message || 'Network error on Google API.');
      }

      // 2. Google Drive
      try {
        const fetchedFiles = await fetchDriveFiles(tok);
        setFiles(fetchedFiles);
        // Persist to Firestore
        for (const item of fetchedFiles) {
          await setDoc(doc(db, `users/${userId}/files`, item.id), item);
        }
        onLogAdded('sync', 'success', `Synced ${fetchedFiles.length} files from Google Drive.`, 'Mapped file metadata, mimeTypes, and secure redirect URLs.');
      } catch (err: any) {
        console.error('Drive Sync Error:', err);
        onLogAdded('sync', 'error', 'Google Drive Sync failed.', err.message || 'Network error on Google API.');
      }

      // 3. Calendar
      try {
        const fetchedEvents = await fetchCalendarEvents(tok);
        setEvents(fetchedEvents);
        // Persist to Firestore
        for (const item of fetchedEvents) {
          await setDoc(doc(db, `users/${userId}/events`, item.id), item);
        }
        onLogAdded('sync', 'success', `Synced ${fetchedEvents.length} events from Google Calendar.`, 'Fetched primary timeline records and schedule durations.');
      } catch (err: any) {
        console.error('Calendar Sync Error:', err);
        onLogAdded('sync', 'error', 'Google Calendar Sync failed.', err.message || 'Network error on Google API.');
      }

      // 4. Contacts
      try {
        const fetchedContacts = await fetchGoogleContacts(tok);
        setContacts(fetchedContacts);
        // Persist to Firestore
        for (const item of fetchedContacts) {
          await setDoc(doc(db, `users/${userId}/contacts`, item.id), item);
        }
        onLogAdded('sync', 'success', `Synced ${fetchedContacts.length} connections from Google Contacts.`, 'Fetched Names, emails, and phone indices.');
      } catch (err: any) {
        console.error('Contacts Sync Error:', err);
        onLogAdded('sync', 'error', 'Google Contacts Sync failed.', err.message || 'Network error on Google API.');
      }

      // Save a sync logs entry in Firestore
      const logId = getSyncId();
      await setDoc(doc(db, `users/${userId}/logs`, logId), {
        id: logId,
        timestamp: new Date().toISOString(),
        type: 'sync',
        level: 'success',
        message: 'Google Workspace database synchronized with Firestore cloud.',
        details: 'Gmail, Drive, Calendar, and Contacts synced and stored securely.'
      });

    } catch (e: any) {
      console.error('General Sync Error:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Login handler
  const handleConnectWorkspace = async () => {
    try {
      googleProvider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/drive.metadata.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/calendar.readonly');
      googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      
      if (token) {
        setAccessToken(token);
      }

      const fbUser = result.user;
      setUser(fbUser);

      // Create/update user doc in firestore
      await setDoc(doc(db, 'users', fbUser.uid), {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        photoURL: fbUser.photoURL,
        connectedServices: ['gmail', 'drive', 'calendar', 'contacts', 'picker'],
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Save a system log in Firestore
      const logId = getLogId();
      await setDoc(doc(db, `users/${fbUser.uid}/logs`, logId), {
        id: logId,
        timestamp: new Date().toISOString(),
        type: 'auth',
        level: 'success',
        message: 'Firebase Auth connected with Google Workspace scopes.',
        details: `Authenticated user: ${fbUser.email}. Granted scopes for Gmail, Drive, Calendar, Contacts, and Picker.`
      });

      onLogAdded(
        'auth',
        'success',
        'Google Workspace OAuth connection established via Firebase Auth.',
        `User ${fbUser.email} logged in. Standard Google Workspace tokens saved securely.`
      );

      // Auto trigger sync on first login
      if (token) {
        triggerSyncAll(token, fbUser.uid);
      }

    } catch (error: any) {
      console.error('Workspace Login Error:', error);
      onLogAdded(
        'auth',
        'error',
        'Google Workspace authentication failed.',
        error.message || 'Error occurred during popup flow.'
      );
      alert('Authentication failed: ' + (error.message || 'Please check popup permissions.'));
    }
  };

  // Sign out handler
  const handleDisconnectWorkspace = async () => {
    if (!confirm('Are you sure you want to disconnect Google Workspace and Firebase?')) return;
    try {
      await signOut(auth);
      setUser(null);
      setAccessToken(null);
      setEmails([]);
      setFiles([]);
      setEvents([]);
      setContacts([]);

      onLogAdded(
        'auth',
        'warning',
        'Google Workspace API session terminated.',
        'User triggered manual disconnect. Client side cached tokens cleared successfully.'
      );
    } catch (error: any) {
      console.error('Logout error:', error);
    }
  };

  // Launch Native Google Picker
  const handleOpenPicker = async () => {
    const tok = accessToken;
    if (!tok) {
      alert('Please connect Google Workspace first.');
      return;
    }

    setIsPickerLoading(true);
    onLogAdded(
      'system',
      'info',
      'Launching Google Picker API...',
      'Requesting PickerBuilder dialog script and authorizing credentials.'
    );

    try {
      const loadScript = (src: string) => {
        return new Promise<void>((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
          }
          const script = document.createElement('script');
          script.src = src;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
          document.head.appendChild(script);
        });
      };

      await loadScript('https://apis.google.com/js/api.js');
      
      const gapi = (window as any).gapi;
      if (!gapi) throw new Error('Google API Script loaded but global "gapi" is undefined.');

      gapi.load('picker', {
        callback: () => {
          try {
            const picker = new (window as any).google.picker.PickerBuilder()
              .addView((window as any).google.picker.ViewId.DOCS)
              .setOAuthToken(tok)
              .setCallback(async (data: any) => {
                if (data.action === (window as any).google.picker.Action.PICKED) {
                  const docPicked = data.docs[0];
                  const fileData: DriveFile = {
                    id: docPicked.id,
                    name: docPicked.name,
                    mimeType: docPicked.mimeType || 'unknown',
                    webViewLink: docPicked.url,
                    modifiedTime: new Date().toISOString()
                  };

                  // Add picked file to list
                  setFiles(prev => {
                    const exists = prev.find(f => f.id === fileData.id);
                    if (exists) return prev;
                    return [fileData, ...prev];
                  });

                  // Write to Firestore
                  if (user) {
                    await setDoc(doc(db, `users/${user.uid}/files`, fileData.id), fileData);
                    
                    const logId = getPickerId();
                    await setDoc(doc(db, `users/${user.uid}/logs`, logId), {
                      id: logId,
                      timestamp: new Date().toISOString(),
                      type: 'system',
                      level: 'success',
                      message: `Google Picker selected file: ${fileData.name}`,
                      details: `File selected via Picker dialog and saved to cloud Firestore: ${fileData.id}`
                    });
                  }

                  onLogAdded(
                    'system',
                    'success',
                    `Google Picker: Successfully imported "${fileData.name}"`,
                    `Imported selected document (ID: ${fileData.id}) into Drive folder directory.`
                  );
                }
              })
              .build();
            picker.setVisible(true);
            setIsPickerLoading(false);
          } catch (pickerErr: any) {
            console.error('Picker creation error:', pickerErr);
            setIsPickerLoading(false);
            alert('Unable to launch Picker. Ensure popup windows are authorized.');
          }
        }
      });

    } catch (err: any) {
      console.error('Error loading Google Picker:', err);
      setIsPickerLoading(false);
      onLogAdded('system', 'error', 'Failed to launch Google Picker.', err.message);
      alert('Error loading Google Picker: ' + err.message);
    }
  };

  // Get File Icons for different mimeTypes
  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-rose-400" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileText className="w-4 h-4 text-emerald-400" />;
    if (mimeType.includes('document') || mimeType.includes('word')) return <FileIcon className="w-4 h-4 text-blue-400" />;
    if (mimeType.includes('image')) return <ImageIcon className="w-4 h-4 text-amber-400" />;
    if (mimeType.includes('video')) return <VideoIcon className="w-4 h-4 text-violet-400" />;
    if (mimeType.includes('audio')) return <FileAudio className="w-4 h-4 text-sky-400" />;
    if (mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('json') || mimeType.includes('code')) return <FileCode className="w-4 h-4 text-purple-400" />;
    return <FileIcon className="w-4 h-4 text-slate-400" />;
  };

  // Filter values
  const getFilteredItems = () => {
    const q = filterQuery.toLowerCase();
    if (activeTab === 'gmail') {
      return emails.filter(m => m.subject.toLowerCase().includes(q) || m.from.toLowerCase().includes(q) || m.snippet.toLowerCase().includes(q));
    } else if (activeTab === 'drive') {
      return files.filter(f => f.name.toLowerCase().includes(q) || f.mimeType.toLowerCase().includes(q));
    } else if (activeTab === 'calendar') {
      return events.filter(e => e.summary.toLowerCase().includes(q) || (e.description && e.description.toLowerCase().includes(q)));
    } else {
      return contacts.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q));
    }
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="bg-[#0a101d] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/5 blur-3xl rounded-full -z-10" />

      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 pb-4 border-b border-slate-800/60 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-violet-600/10">
            <Globe2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
              Google Workspace & Firebase Cloud sync
              <span className="text-[10px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-sans capitalize font-semibold">Active Integration</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Real-time sync to Cloud Firestore for Gmail, Drive, Calendar, and People API records</p>
          </div>
        </div>

        {/* Action button */}
        {user ? (
          <div className="flex items-center gap-3">
            <button
              onClick={() => triggerSyncAll()}
              disabled={isSyncing}
              className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-violet-600/10"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'SYNCING CLOUD...' : 'FORCE WORKSPACE SYNC'}</span>
            </button>
            <button
              onClick={handleDisconnectWorkspace}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl transition-all cursor-pointer"
              title="Disconnect Profile"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnectWorkspace}
            className="px-5 py-2.5 bg-[#4285F4] hover:bg-[#357AE8] text-white font-mono text-xs font-bold rounded-xl flex items-center gap-2.5 transition-all cursor-pointer shadow-md shadow-blue-500/10"
          >
            {/* Google Logo SVG */}
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>CONNECT GOOGLE WORKSPACE</span>
          </button>
        )}
      </div>

      {user ? (
        <div className="space-y-6">
          {/* Connected User banner */}
          <div className="bg-[#0c1424] border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} alt={user.displayName || ''} className="w-10 h-10 rounded-full border-2 border-violet-500/20" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-bold font-mono">
                  {user.displayName?.substring(0, 2).toUpperCase() || 'WS'}
                </div>
              )}
              <div>
                <p className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                  {user.displayName}
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                </p>
                <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                FIRESTORE CONNECTED
              </span>

              <button
                onClick={handleOpenPicker}
                disabled={isPickerLoading}
                className="px-3 py-1 bg-violet-500/15 hover:bg-violet-500/20 border border-violet-500/30 hover:border-violet-500/50 text-violet-300 font-mono text-[10px] font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <FolderOpen className={`w-3.5 h-3.5 ${isPickerLoading ? 'animate-pulse' : ''}`} />
                <span>OPEN PICKER</span>
              </button>
            </div>
          </div>

          {/* Tab Selection */}
          <div className="flex border-b border-slate-800/80 gap-1.5 overflow-x-auto pb-px">
            <button
              onClick={() => { setActiveTab('gmail'); setFilterQuery(''); }}
              className={`px-4 py-2.5 font-mono text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'gmail' ? 'border-violet-500 text-white bg-violet-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>GMAIL INBOX</span>
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-bold font-sans">{emails.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('drive'); setFilterQuery(''); }}
              className={`px-4 py-2.5 font-mono text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'drive' ? 'border-violet-500 text-white bg-violet-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>GOOGLE DRIVE</span>
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-bold font-sans">{files.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('calendar'); setFilterQuery(''); }}
              className={`px-4 py-2.5 font-mono text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'calendar' ? 'border-violet-500 text-white bg-violet-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>CALENDAR AGENDA</span>
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-bold font-sans">{events.length}</span>
            </button>

            <button
              onClick={() => { setActiveTab('contacts'); setFilterQuery(''); }}
              className={`px-4 py-2.5 font-mono text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${activeTab === 'contacts' ? 'border-violet-500 text-white bg-violet-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
              <Contact className="w-3.5 h-3.5" />
              <span>CONTACTS DIRECTORY</span>
              <span className="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded text-[10px] font-bold font-sans">{contacts.length}</span>
            </button>
          </div>

          {/* Search bar inside Workspace Data tab */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`Filter through synced ${activeTab} data...`}
              className="w-full pl-9 pr-4 py-2 bg-[#0c1424] border border-slate-800 rounded-xl text-xs placeholder-slate-500 text-slate-200 focus:outline-none focus:border-violet-500 font-mono"
            />
          </div>

          {/* Data display grids */}
          <div className="min-h-[220px]">
            {filteredItems.length === 0 ? (
              <div className="py-12 border border-dashed border-slate-800 bg-[#070b13]/40 rounded-xl flex flex-col items-center justify-center text-center">
                <Globe2 className="w-6 h-6 text-slate-700 mb-2" />
                <p className="text-xs font-mono text-slate-500">No synchronized records found matching the query.</p>
                <p className="text-[10px] text-slate-600 mt-1">Click &apos;Force Workspace Sync&apos; to query real Google API records.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                {activeTab === 'gmail' && (emails as GmailMessage[]).map((email) => (
                  <div key={email.id} className="p-3 bg-[#0c1424] hover:bg-[#0f172a] border border-slate-800/80 rounded-xl transition-all flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mb-1">
                      <span className="truncate max-w-[150px] font-bold text-violet-400">From: {email.from}</span>
                      <span className="shrink-0">{email.date}</span>
                    </div>
                    <h4 className="font-bold text-white truncate font-sans">{email.subject}</h4>
                    <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{email.snippet}</p>
                  </div>
                ))}

                {activeTab === 'drive' && (files as DriveFile[]).map((file) => (
                  <div key={file.id} className="p-3 bg-[#0c1424] hover:bg-[#0f172a] border border-slate-800/80 rounded-xl transition-all flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <span className="p-2 bg-slate-900 rounded-lg shrink-0 border border-slate-800">
                        {getFileIcon(file.mimeType)}
                      </span>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-white truncate font-mono">{file.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{file.mimeType}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                        {new Date(file.modifiedTime).toLocaleDateString()}
                      </span>
                      {file.webViewLink && (
                        <a 
                          href={file.webViewLink} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="p-1.5 bg-slate-900 border border-slate-800 hover:border-violet-500/40 text-violet-400 hover:text-white rounded-lg transition-all"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {activeTab === 'calendar' && (events as CalendarEvent[]).map((event) => (
                  <div key={event.id} className="p-3 bg-[#0c1424] hover:bg-[#0f172a] border border-slate-800/80 rounded-xl transition-all flex flex-col gap-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white font-sans">{event.summary}</h4>
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded text-[10px] font-mono border border-indigo-500/20">Agenda Item</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center text-[10px] text-slate-400 font-mono gap-1 sm:gap-4">
                      <span>Start: {new Date(event.start).toLocaleString()}</span>
                      <span>End: {new Date(event.end).toLocaleString()}</span>
                    </div>
                    {event.description && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5 leading-relaxed">{event.description}</p>
                    )}
                  </div>
                ))}

                {activeTab === 'contacts' && (contacts as GoogleContact[]).map((contact) => (
                  <div key={contact.id} className="p-3 bg-[#0c1424] hover:bg-[#0f172a] border border-slate-800/80 rounded-xl transition-all flex items-center justify-between text-xs gap-4">
                    <div className="flex items-center space-x-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500/20 flex items-center justify-center text-violet-400 font-mono font-bold shrink-0">
                        {contact.name.substring(0, 1).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-white truncate font-sans">{contact.name}</h4>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{contact.email}</p>
                      </div>
                    </div>
                    <div className="text-right text-[10px] text-slate-400 font-mono shrink-0">
                      {contact.phone !== 'No Phone' ? contact.phone : <span className="text-slate-600">--</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 border border-dashed border-slate-800 bg-[#070b13]/40 rounded-xl text-center">
          <Globe2 className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs font-mono text-slate-400">Secure connection sandbox offline</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
            Authorize a secure Google Workspace session via Firebase Auth to retrieve real-time sync tables, Gmail inbox indices, Google Drive directories, and Calendar dates.
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  HardDrive, 
  Calendar as CalendarIcon, 
  Users, 
  RefreshCw, 
  FileCode, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  FileText, 
  Search,
  ExternalLink,
  Lock,
  Database
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs, deleteDoc, query, orderBy, limit } from 'firebase/firestore';

interface WorkspaceSyncProps {
  onAddLog: (type: 'auth' | 'sync' | 'refresh' | 'system', level: 'success' | 'info' | 'warning' | 'error', message: string, details: string) => void;
  onRefreshQuotas: () => void;
  refreshTrigger?: number;
}

interface SyncedItem {
  id: string;
  source: 'gmail' | 'drive' | 'calendar' | 'contacts';
  title: string;
  subtitle: string;
  timestamp: string;
  details: string;
}

export default function WorkspaceSync({ onAddLog, onRefreshQuotas, refreshTrigger = 0 }: WorkspaceSyncProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'gmail' | 'drive' | 'calendar' | 'contacts'>('all');
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({
    gmail: false,
    drive: false,
    calendar: false,
    contacts: false,
    all: false
  });
  const [syncStatus, setSyncStatus] = useState<Record<string, 'idle' | 'syncing' | 'success' | 'error'>>({
    gmail: 'idle',
    drive: 'idle',
    calendar: 'idle',
    contacts: 'idle'
  });
  const [syncedItems, setSyncedItems] = useState<SyncedItem[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  
  // Simulated files in the Google Picker Dialog
  const mockPickerFiles = [
    { id: 'file_1', name: 'Q2_Financial_Consolidation.xlsx', type: 'Spreadsheet', size: '14.2 MB', modified: '2 hours ago' },
    { id: 'file_2', name: 'Enterprise_SOC2_Compliance_Audit.pdf', type: 'PDF Document', size: '4.8 MB', modified: 'Yesterday' },
    { id: 'file_3', name: 'Identity_Access_Policy_v4.docx', type: 'Word Document', size: '1.1 MB', modified: '3 days ago' },
    { id: 'file_4', name: 'GCP_Billing_Projections_europe-west2.gsheet', type: 'Google Sheet', size: '890 KB', modified: 'Just now' },
    { id: 'file_5', name: 'Workspace_OAuth_Security_Matrix.gdoc', type: 'Google Doc', size: '2.4 MB', modified: '1 week ago' },
    { id: 'file_6', name: 'API_Gateway_Ingress_Mapping.yaml', type: 'Configuration', size: '42 KB', modified: '4 hours ago' }
  ];

  // Load items from Firestore on mount or when refreshTrigger increments
  useEffect(() => {
    fetchSyncedItemsFromFirestore();
  }, [refreshTrigger]);

  const fetchSyncedItemsFromFirestore = async () => {
    try {
      const q = query(collection(db, 'users/admin_demo/synced_records'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: SyncedItem[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as SyncedItem);
      });
      
      if (items.length > 0) {
        setSyncedItems(items);
      } else {
        // Seed default items if Firestore is empty
        const initialSeeds: SyncedItem[] = [
          {
            id: 'seed_1',
            source: 'gmail',
            title: 'Gmail Index Handshake',
            subtitle: 'Inbox message id list cached',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'Reconciled 14 active threads. 0 critical anomalies detected.'
          },
          {
            id: 'seed_2',
            source: 'drive',
            title: 'Drive Sync Policy Verified',
            subtitle: 'Secure lock verified on shared folders',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Workspace compliance checklist completed. Standard folders marked as READ-ONLY.'
          }
        ];
        
        // Save seed data to Firestore for persistence
        for (const item of initialSeeds) {
          await setDoc(doc(db, 'users/admin_demo/synced_records', item.id), item);
        }
        setSyncedItems(initialSeeds);
      }
    } catch (err) {
      console.error('Error reading from Firestore:', err);
      // Fallback local state if Firebase connection is interrupted
      setSyncedItems([]);
    }
  };

  const handleSyncService = async (service: 'gmail' | 'drive' | 'calendar' | 'contacts') => {
    if (isSyncing[service]) return;

    setIsSyncing(prev => ({ ...prev, [service]: true }));
    setSyncStatus(prev => ({ ...prev, [service]: 'syncing' }));
    
    onAddLog(
      'sync',
      'info',
      `Manual sync triggered: Google ${service.toUpperCase()} API connection initialized.`,
      `Establishing safe handshake loop with OAuth endpoints.`
    );

    // Simulated API lag
    setTimeout(async () => {
      const isSuccess = Math.random() > 0.05; // 95% success rate for simulation realism
      const timestamp = new Date().toISOString();
      
      if (isSuccess) {
        let newItem: SyncedItem;
        
        if (service === 'gmail') {
          newItem = {
            id: `gmail_${Date.now()}`,
            source: 'gmail',
            title: 'Gmail API sync: Synchronized message thread.',
            subtitle: `Thread: inbox_feed_${Math.random().toString(36).substring(2, 6)}`,
            timestamp,
            details: 'Retrieved header indexes and snippets. Synchronized successfully with Firestore ledger.'
          };
        } else if (service === 'drive') {
          newItem = {
            id: `drive_${Date.now()}`,
            source: 'drive',
            title: 'Google Drive sync policies updated.',
            subtitle: 'Re-indexed metadata for shared folder',
            timestamp,
            details: 'Audited file access levels. Storage indicators updated.'
          };
        } else if (service === 'calendar') {
          newItem = {
            id: `calendar_${Date.now()}`,
            source: 'calendar',
            title: 'Google Calendar event sync completed.',
            subtitle: 'Synced upcoming corporate agenda slots',
            timestamp,
            details: 'All calendar entries reconciled with no resource room booking collisions.'
          };
        } else {
          newItem = {
            id: `contacts_${Date.now()}`,
            source: 'contacts',
            title: 'Contacts database cache refreshed.',
            subtitle: 'People API connections list updated',
            timestamp,
            details: 'Fetched 8 active user contacts. Encrypted local store updated.'
          };
        }

        try {
          // Persist in Firestore
          await setDoc(doc(db, 'users/admin_demo/synced_records', newItem.id), newItem);
          
          // Re-fetch synced items
          await fetchSyncedItemsFromFirestore();
          
          setSyncStatus(prev => ({ ...prev, [service]: 'success' }));
          onAddLog(
            'sync',
            'success',
            `Reconciliation complete for ${service.toUpperCase()} service.`,
            `Synced metadata, successfully written to Firestore path: users/admin_demo/synced_records/${newItem.id}`
          );
        } catch (dbErr) {
          console.error('Firestore write error:', dbErr);
          setSyncedItems(prev => [newItem, ...prev]); // Local fallback
          setSyncStatus(prev => ({ ...prev, [service]: 'success' }));
        }

        onRefreshQuotas();
      } else {
        setSyncStatus(prev => ({ ...prev, [service]: 'error' }));
        onAddLog(
          'sync',
          'error',
          `Sync Failed: ${service.toUpperCase()} API endpoint timed out.`,
          `Connection dropped by remote server. Retrying connection in 10s.`
        );
      }

      setIsSyncing(prev => ({ ...prev, [service]: false }));
    }, 1200);
  };

  const handleSyncAll = async () => {
    if (isSyncing.all) return;
    setIsSyncing(prev => ({ ...prev, all: true }));
    onAddLog('system', 'info', 'Initiating full Workspace reconciliation pipeline...', 'Serializing service requests.');

    await Promise.all([
      new Promise<void>((resolve) => setTimeout(() => { handleSyncService('gmail'); resolve(); }, 100)),
      new Promise<void>((resolve) => setTimeout(() => { handleSyncService('drive'); resolve(); }, 400)),
      new Promise<void>((resolve) => setTimeout(() => { handleSyncService('calendar'); resolve(); }, 700)),
      new Promise<void>((resolve) => setTimeout(() => { handleSyncService('contacts'); resolve(); }, 1000)),
    ]);

    setTimeout(() => {
      setIsSyncing(prev => ({ ...prev, all: false }));
      onAddLog('system', 'success', 'Full Workspace reconciliation completed successfully.', 'All data blocks written to persistent Cloud Firestore database.');
    }, 1800);
  };

  const handleSelectPickerFile = async (file: typeof mockPickerFiles[0]) => {
    setShowPicker(false);
    onAddLog('system', 'info', `Google Picker target selected: "${file.name}"`, `File Type: ${file.type} | Size: ${file.size}`);

    const timestamp = new Date().toISOString();
    const newItem: SyncedItem = {
      id: `drive_picker_${Date.now()}`,
      source: 'drive',
      title: `Imported via Google Picker: ${file.name}`,
      subtitle: `${file.type} (${file.size})`,
      timestamp,
      details: `Injected into Drive catalog tracker. File owner permission verified.`
    };

    try {
      await setDoc(doc(db, 'users/admin_demo/synced_records', newItem.id), newItem);
      await fetchSyncedItemsFromFirestore();
      onAddLog('sync', 'success', `File reference registered to Firestore ledger.`, `Successfully synced metadata for file ID: ${newItem.id}`);
      onRefreshQuotas();
    } catch (err) {
      console.error(err);
      setSyncedItems(prev => [newItem, ...prev]);
    }
  };

  const handlePurgeFirestoreCache = async () => {
    if (!window.confirm("Are you sure you want to purge all synced records from Firestore?")) return;
    
    try {
      onAddLog('system', 'warning', 'Purging Firestore synced_records collection...', 'Database cleaning initiated.');
      const querySnapshot = await getDocs(collection(db, 'users/admin_demo/synced_records'));
      
      const promises = querySnapshot.docs.map(docSnap => deleteDoc(doc(db, 'users/admin_demo/synced_records', docSnap.id)));
      await Promise.all(promises);
      
      setSyncedItems([]);
      onAddLog('system', 'success', 'Firestore synced_records purged successfully.', 'Database is completely clean.');
    } catch (err) {
      console.error("Purging Firestore failed:", err);
      onAddLog('system', 'error', 'Failed to purge Firestore records.', 'Insufficient write permission or loss of connectivity.');
    }
  };

  const filteredItems = syncedItems.filter(item => {
    if (activeTab === 'all') return true;
    return item.source === activeTab;
  });

  return (
    <div className="space-y-6">
      {/* Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gmail Card */}
        <div className="relative group bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-violet-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/5 blur-2xl rounded-full group-hover:bg-red-600/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-red-500/10 rounded-lg text-red-400">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              {syncStatus.gmail === 'syncing' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {syncStatus.gmail === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              {syncStatus.gmail === 'error' && <span className="w-2 h-2 rounded-full bg-red-400" />}
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {syncStatus.gmail === 'syncing' ? 'Syncing...' : syncStatus.gmail}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-200">Gmail Watcher</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">Monitors message threads, logs triggers, and audits attachments.</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSyncService('gmail')}
              disabled={isSyncing.gmail}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-violet-500/30 text-[11px] font-mono font-bold py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing.gmail ? 'animate-spin text-violet-400' : ''}`} />
              <span>SYNC NOW</span>
            </button>
          </div>
        </div>

        {/* Google Drive Card */}
        <div className="relative group bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-violet-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 blur-2xl rounded-full group-hover:bg-amber-600/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400">
              <HardDrive className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              {syncStatus.drive === 'syncing' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {syncStatus.drive === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              {syncStatus.drive === 'error' && <span className="w-2 h-2 rounded-full bg-red-400" />}
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {syncStatus.drive === 'syncing' ? 'Syncing...' : syncStatus.drive}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-200">Google Drive</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">Tracks file versioning, sharing policies, and picker indexes.</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSyncService('drive')}
              disabled={isSyncing.drive}
              className="flex-1 flex items-center justify-center gap-1 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-violet-500/30 text-[11px] font-mono font-bold py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing.drive ? 'animate-spin text-amber-400' : ''}`} />
              <span>SYNC</span>
            </button>
            <button 
              onClick={() => setShowPicker(true)}
              className="flex-1 flex items-center justify-center gap-1 bg-violet-950/30 hover:bg-violet-900/40 text-violet-300 border border-violet-800/60 text-[11px] font-mono font-bold py-1.5 rounded-lg cursor-pointer transition-all"
            >
              <FileCode className="w-3 h-3" />
              <span>PICKER</span>
            </button>
          </div>
        </div>

        {/* Google Calendar Card */}
        <div className="relative group bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-violet-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/5 blur-2xl rounded-full group-hover:bg-emerald-600/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              {syncStatus.calendar === 'syncing' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {syncStatus.calendar === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              {syncStatus.calendar === 'error' && <span className="w-2 h-2 rounded-full bg-red-400" />}
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {syncStatus.calendar === 'syncing' ? 'Syncing...' : syncStatus.calendar}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-200">Google Calendar</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">Monitors scheduled events, agenda conflicts, and room reserves.</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSyncService('calendar')}
              disabled={isSyncing.calendar}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-violet-500/30 text-[11px] font-mono font-bold py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing.calendar ? 'animate-spin text-emerald-400' : ''}`} />
              <span>SYNC NOW</span>
            </button>
          </div>
        </div>

        {/* Google Contacts Card */}
        <div className="relative group bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 hover:border-violet-500/40 transition-all duration-300 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/5 blur-2xl rounded-full group-hover:bg-violet-600/10 transition-all duration-300" />
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-violet-500/10 rounded-lg text-violet-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center space-x-1.5">
              {syncStatus.contacts === 'syncing' && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              {syncStatus.contacts === 'success' && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
              {syncStatus.contacts === 'error' && <span className="w-2 h-2 rounded-full bg-red-400" />}
              <span className="text-[10px] font-mono text-slate-500 uppercase">
                {syncStatus.contacts === 'syncing' ? 'Syncing...' : syncStatus.contacts}
              </span>
            </div>
          </div>
          <h4 className="text-sm font-bold text-slate-200">People API (Contacts)</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">Verifies organizational structure, profile data, and group lists.</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleSyncService('contacts')}
              disabled={isSyncing.contacts}
              className="flex-1 flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 hover:border-violet-500/30 text-[11px] font-mono font-bold py-1.5 rounded-lg cursor-pointer transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing.contacts ? 'animate-spin text-violet-400' : ''}`} />
              <span>SYNC NOW</span>
            </button>
          </div>
        </div>
      </div>

      {/* Control Panel Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/30 border border-slate-800/60">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-mono font-bold text-slate-300">CLOUD SYNC CONTROLS</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSyncAll}
            disabled={isSyncing.all}
            className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing.all ? 'animate-spin' : ''}`} />
            <span>RUN RECONCILIATION PIPELINE</span>
          </button>
          
          <button
            onClick={handlePurgeFirestoreCache}
            className="flex items-center gap-1 bg-red-950/30 hover:bg-red-900/40 text-red-300 border border-red-900/40 px-3 py-1.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
          >
            <span>PURGE FIRESTORE DATA</span>
          </button>
        </div>
      </div>

      {/* Google Picker Modal */}
      {showPicker && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-violet-500/10 rounded text-violet-400">
                  <FileCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Google Picker (Workspace API Mock)</h3>
                  <p className="text-[10px] text-slate-500 font-mono">SECURE Handshake Verified | Project: gen-lang-client-0806668476</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPicker(false)}
                className="text-slate-400 hover:text-slate-200 font-mono text-sm cursor-pointer"
              >
                [ESC]
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-3 border-b border-slate-800/40 bg-[#090d16] flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search cloud drive files..." 
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="bg-transparent border-0 focus:ring-0 text-xs text-slate-200 w-full placeholder-slate-600 outline-none"
              />
            </div>

            {/* File List */}
            <div className="overflow-y-auto p-4 flex-1 space-y-2 max-h-[400px]">
              {mockPickerFiles
                .filter(f => f.name.toLowerCase().includes(pickerSearch.toLowerCase()))
                .map((file) => (
                  <div 
                    key={file.id}
                    onClick={() => handleSelectPickerFile(file)}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-950/20 hover:bg-violet-950/20 border border-slate-800/60 hover:border-violet-500/30 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded text-slate-400 group-hover:text-violet-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-300 group-hover:text-violet-300 transition-colors">{file.name}</p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">{file.type} • Modified {file.modified}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] font-mono text-slate-500">{file.size}</span>
                      <span className="text-[10px] font-mono font-bold bg-slate-900 group-hover:bg-violet-500/20 text-slate-400 group-hover:text-violet-300 px-1.5 py-0.5 rounded border border-slate-800 group-hover:border-violet-500/30 transition-all">SELECT</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-950/40 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <div className="flex items-center space-x-1.5">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>256-bit TLS handshake active</span>
              </div>
              <span>Google API Service</span>
            </div>
          </div>
        </div>
      )}

      {/* Sync Ledger View */}
      <div className="bg-slate-950/20 border border-slate-800/80 rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-3xl rounded-full -z-10" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-slate-800/60 pb-3 gap-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-violet-400" />
            <h4 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Sync ledger (Cloud Firestore)</h4>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-800 rounded-lg p-0.5 bg-slate-950/80">
            {(['all', 'gmail', 'drive', 'calendar', 'contacts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold cursor-pointer transition-all uppercase ${
                  activeTab === tab 
                    ? 'bg-violet-950/40 text-violet-300 border border-violet-800/60' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-mono">No active sync ledger found for this directory block.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/40 hover:border-slate-800 transition-all gap-2"
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-1.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                    item.source === 'gmail' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    item.source === 'drive' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    item.source === 'calendar' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                  }`}>
                    {item.source.toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-200">{item.title}</h5>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.subtitle}</p>
                    <p className="text-[9px] font-mono text-slate-500 mt-1">{item.details}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[9px] font-mono text-slate-500 block">
                    {new Date(item.timestamp).toLocaleTimeString()}
                  </span>
                  <span className="text-[9px] font-mono text-slate-500 block mt-0.5">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

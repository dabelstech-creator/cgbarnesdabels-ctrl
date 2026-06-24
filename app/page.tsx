"use client";

import React, { useState, useEffect } from 'react';
import { 
  Terminal, 
  Cpu, 
  Settings, 
  ShieldAlert, 
  Layers, 
  Info, 
  RefreshCw, 
  Flame, 
  Trash2, 
  Play, 
  Pause,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Shield,
  BookOpen,
  Activity,
  UserCheck,
  Bot,
  Send,
  Key
} from 'lucide-react';
import WorkspaceSync from '@/components/WorkspaceSync';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'sync' | 'refresh' | 'system';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details: string;
}

export default function Home() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [healthStatus, setHealthStatus] = useState<'Stable' | 'Degraded' | 'Offline'>('Stable');
  const [healthLatency, setHealthLatency] = useState<number | null>(null);
  const [simulateLatency, setSimulateLatency] = useState<boolean>(false);
  const [quotaGmail, setQuotaGmail] = useState(48);
  const [quotaDrive, setQuotaDrive] = useState(62);
  const [quotaCalendar, setQuotaCalendar] = useState(31);
  const [quotaContacts, setQuotaContacts] = useState(15);
  const [isAutoSpamming, setIsAutoSpamming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');

  // Auth0 Authentication Validator states
  const [auth0Domain, setAuth0Domain] = useState('dev-workspace-portal.us.auth0.com');
  const [auth0ClientId, setAuth0ClientId] = useState('a0_client_8497dfd_7812_4da2');
  const [isAuth0Validating, setIsAuth0Validating] = useState(false);
  const [auth0Status, setAuth0Status] = useState<'unverified' | 'success' | 'failed'>('unverified');
  const [auth0User, setAuth0User] = useState<any>(null);

  // Workspace Bot Automation states
  const [botMessage, setBotMessage] = useState('');
  const [botResponse, setBotResponse] = useState<string>('');
  const [isBotResponding, setIsBotResponding] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Load initial logs
  useEffect(() => {
    fetchLogs();
  }, []);

  // Monitor Firestore connection health and latency
  useEffect(() => {
    let active = true;
    
    const checkFirestoreHealth = async () => {
      const startTime = performance.now();
      try {
        const healthDocRef = doc(db, 'system', 'heartbeat');
        await getDoc(healthDocRef);
        
        const endTime = performance.now();
        let latency = Math.round(endTime - startTime);
        
        if (simulateLatency) {
          latency += 450;
          await new Promise(resolve => setTimeout(resolve, 450));
        }
        
        if (!active) return;
        
        setHealthLatency(latency);
        if (latency < 300) {
          setHealthStatus('Stable');
        } else {
          setHealthStatus('Degraded');
        }
      } catch (err) {
        console.error('Firestore health probe failed:', err);
        if (!active) return;
        setHealthLatency(null);
        setHealthStatus('Offline');
      }
    };

    checkFirestoreHealth();
    const interval = setInterval(checkFirestoreHealth, 12000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [simulateLatency]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  // Auto-Spammer effect to simulate ongoing traffic activity
  useEffect(() => {
    if (!isAutoSpamming) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'spam',
            count: 1
          })
        });
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);

          // Gently randomize active meters slightly to simulate live active traffic load
          if (Math.random() > 0.4) {
            setQuotaGmail(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 3) - 1)));
            setQuotaDrive(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 2) - 1)));
            setQuotaCalendar(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 3) - 1)));
            setQuotaContacts(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 2) - 1)));
          }
        }
      } catch (err) {
        console.error('Failed to auto-spam:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isAutoSpamming]);

  const handleSpamBatch = async () => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'spam',
          count: 12
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        handleAddLocalLog('system', 'success', 'Batch injection trigger completed.', 'Inserted 12 diagnostic Workspace logs into the pipeline.');
      }
    } catch (err) {
      console.error('Failed to spam batch logs:', err);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear'
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogs([]);
      }
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const handleAddLocalLog = async (
    type: LogEntry['type'],
    level: LogEntry['level'],
    message: string,
    details: string
  ) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          type,
          level,
          message,
          details
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to push log to server:', err);
    }
  };

  const handleRefreshQuotas = () => {
    // Re-adjust quotas randomly to simulate standard live usage fluctuations
    setQuotaGmail(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 5) - 2)));
    setQuotaDrive(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 4) - 2)));
    setQuotaCalendar(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 5) - 2)));
    setQuotaContacts(prev => Math.min(100, Math.max(0, prev + Math.floor(Math.random() * 3) - 1)));
  };

  const runAiSecurityAudit = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAiAnalysis('');
    handleAddLocalLog('system', 'info', 'Gemini AI compliance sweep triggered.', 'Analyzing workspace log indexes for potential threats.');

    try {
      const res = await fetch('/app/api/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });
      
      // Fallback if routing directly fails or if there's a file resolution edge-case
      const finalRes = res.ok ? res : await fetch('/api/security/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs })
      });

      const data = await finalRes.json();
      if (data.analysis) {
        setAiAnalysis(data.analysis);
        handleAddLocalLog('system', 'success', 'Gemini AI security sweep completed successfully.', 'Report output rendered.');
      } else {
        setAiAnalysis('### Audit Aborted\n\nNo structured analysis returned from Workspace Compliance Auditor.');
      }
    } catch (err) {
      console.error('AI Security Audit failed:', err);
      setAiAnalysis('### Audit Pipeline Blocked\n\nFailed to establish connection with server analysis route. Ensure server environment is online and initialized.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleValidateAuth0 = async () => {
    if (isAuth0Validating) return;
    setIsAuth0Validating(true);
    setAuth0Status('unverified');
    
    handleAddLocalLog('auth', 'info', 'Auth0 federated credential handshake initiated.', `Target Domain: ${auth0Domain}`);

    try {
      const res = await fetch('/api/auth/auth0/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain: auth0Domain,
          clientId: auth0ClientId
        })
      });
      const data = await res.json();
      if (data.success) {
        setAuth0Status('success');
        setAuth0User(data.user);
        
        // Push OIDC validation logs to the main audit ledger
        if (data.logs && Array.isArray(data.logs)) {
          for (const log of data.logs) {
            handleAddLocalLog(log.type, log.level, log.message, log.details);
          }
        }
      } else {
        setAuth0Status('failed');
        handleAddLocalLog('auth', 'error', 'Auth0 federated handshake failed.', data.error || 'Signature check failed.');
      }
    } catch (err: any) {
      setAuth0Status('failed');
      console.error(err);
      handleAddLocalLog('auth', 'error', 'Auth0 endpoint connection failed.', err.message || 'Network timeout.');
    } finally {
      setIsAuth0Validating(false);
    }
  };

  const handleBotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botMessage.trim() || isBotResponding) return;

    const userMsg = botMessage;
    setBotMessage('');
    setIsBotResponding(true);
    setBotResponse('');

    // Log user request
    handleAddLocalLog('system', 'info', `Workspace Automation request received: "${userMsg}"`, `Processing via Gemini AI agent...`);

    try {
      const res = await fetch('/api/bot/automate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          logContext: logs.slice(0, 10)
        })
      });
      const data = await res.json();
      if (data.success) {
        setBotResponse(data.reply);
        
        // Check if an automation action needs to be executed
        if (data.action && data.action !== 'NONE') {
          handleAddLocalLog('system', 'warning', `Bot Action Authorized: executing [${data.action}]`, `Target: ${data.actionTarget || 'None'}`);
          
          if (data.action === 'CLEAR_LOGS') {
            await handleClearLogs();
            handleAddLocalLog('system', 'success', `Bot completed action: cleared log buffer.`, `All logs purged from system memory.`);
          } else if (data.action === 'SPAM_BATCH') {
            await handleSpamBatch();
          } else if (data.action === 'SYNC_SERVICE') {
            const target = data.actionTarget || 'all';
            handleAddLocalLog('sync', 'info', `Bot completed action: synced service [${target.toUpperCase()}].`, `Calling remote OAuth connectors.`);
            handleRefreshQuotas();
          } else if (data.action === 'ADD_SYNC_ITEM' && data.syncItem) {
            // Write structured item directly to Firestore
            const { source, title, subtitle, details } = data.syncItem;
            const newItemId = `${source}_bot_${Date.now()}`;
            
            try {
              const docRef = doc(db, 'users/admin_demo/synced_records', newItemId);
              await setDoc(docRef, {
                id: newItemId,
                source,
                title,
                subtitle,
                timestamp: new Date().toISOString(),
                details
              });
              
              setRefreshTrigger(prev => prev + 1);
              handleAddLocalLog('sync', 'success', `Bot completed action: inserted new sync record.`, `Firestore Path: users/admin_demo/synced_records/${newItemId}`);
              handleRefreshQuotas();
            } catch (fsErr: any) {
              console.error('Firestore Bot Write Error:', fsErr);
              handleAddLocalLog('system', 'error', 'Bot action failed: insufficient Firestore write permission.', fsErr.message);
            }
          }
        }
      } else {
        setBotResponse("I could not compile my automation reasoning at this time. Please make sure the server environment is healthy.");
      }
    } catch (err: any) {
      console.error(err);
      setBotResponse("An unexpected network error occurred while reaching the workspace automation bot.");
    } finally {
      setIsBotResponding(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-violet-500/30 selection:text-white pb-12">
      {/* Top Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-violet-600/10 blur-[150px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/30">
              <span className="absolute inline-flex h-2 w-2 rounded-full bg-violet-400 animate-ping opacity-75 top-1 right-1" />
              <Layers className="w-4 h-4 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">Workspace Sync</h1>
                <span className="bg-violet-500/10 border border-violet-500/30 text-violet-300 font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                  v2.0-FIRESTORE
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono">Enterprise Workspace Integration & Audit Ledger</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* System Health Status Indicator */}
            <button 
              onClick={() => {
                setSimulateLatency(!simulateLatency);
                handleAddLocalLog(
                  'system', 
                  !simulateLatency ? 'warning' : 'success', 
                  !simulateLatency ? 'Artificial latency simulation activated.' : 'Artificial latency simulation cleared.', 
                  !simulateLatency ? 'System health transition test sequence initiated (added +450ms lag).' : 'Returning system health probe to real-time sync metrics.'
                );
              }}
              className={`flex items-center space-x-2.5 bg-slate-900/60 hover:bg-slate-900/95 px-3 py-1.5 rounded-lg border transition-all cursor-pointer group ${
                healthStatus === 'Stable' ? 'border-emerald-500/20 hover:border-emerald-500/40' :
                healthStatus === 'Degraded' ? 'border-amber-500/20 hover:border-amber-500/40' :
                'border-red-500/20 hover:border-red-500/40'
              }`}
              title={simulateLatency ? "Click to disable high latency simulation" : "Click to simulate network latency / degraded state"}
              id="system-health-indicator"
            >
              <span className="relative flex h-2 w-2">
                {healthStatus === 'Stable' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
                {healthStatus === 'Degraded' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </>
                )}
                {healthStatus === 'Offline' && (
                  <>
                    <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </>
                )}
              </span>
              
              <div className="flex flex-col items-start leading-none text-left">
                <span className="text-[9px] font-mono text-slate-500 uppercase font-bold tracking-wider">
                  FIRESTORE STATUS
                </span>
                <span className={`text-[10px] font-mono font-bold uppercase mt-0.5 flex items-center gap-1 ${
                  healthStatus === 'Stable' ? 'text-emerald-400' :
                  healthStatus === 'Degraded' ? 'text-amber-400' :
                  'text-red-400'
                }`}>
                  {healthStatus}
                  {healthLatency !== null && (
                    <span className="text-slate-500 font-normal">
                      ({healthLatency}ms)
                    </span>
                  )}
                </span>
              </div>
              
              <span className="text-[8px] font-mono text-slate-600 group-hover:text-violet-400 transition-colors hidden sm:inline ml-1 uppercase pl-1.5 border-l border-slate-800">
                {simulateLatency ? "DISARM LAG" : "TEST LAG"}
              </span>
            </button>

            <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 font-mono bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>GCP PROJECT: gen-lang-client-0806668476</span>
            </div>
            
            <a 
              href="https://console.cloud.google.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 hover:border-slate-700 transition-all cursor-pointer"
              title="Open Google Cloud Console"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Main Page Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        
        {/* Left Side: Services Sync and Logs */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Quota Progress Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950/20 border border-slate-800/80 p-4 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full -z-10" />
            
            {/* Gmail Quota */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>GMAIL RESPONSES</span>
                <span className="text-violet-400">{quotaGmail}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-violet-500 rounded-full transition-all duration-500" 
                  style={{ width: `${quotaGmail}%` }} 
                />
              </div>
            </div>

            {/* Drive Quota */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>DRIVE TRANSFER</span>
                <span className="text-amber-400">{quotaDrive}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-500 rounded-full transition-all duration-500" 
                  style={{ width: `${quotaDrive}%` }} 
                />
              </div>
            </div>

            {/* Calendar Quota */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>CALENDAR SHIELDS</span>
                <span className="text-emerald-400">{quotaCalendar}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                  style={{ width: `${quotaCalendar}%` }} 
                />
              </div>
            </div>

            {/* Contacts Quota */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono font-bold text-slate-400">
                <span>CONTACT BUFFERS</span>
                <span className="text-blue-400">{quotaContacts}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-900 border border-slate-800/80 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${quotaContacts}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Core Interactive Component: WorkspaceSync */}
          <WorkspaceSync onAddLog={handleAddLocalLog} onRefreshQuotas={handleRefreshQuotas} refreshTrigger={refreshTrigger} />

          {/* Audit Trail Terminal Console */}
          <div className="bg-[#040915] border border-slate-800 rounded-xl overflow-hidden relative shadow-lg">
            
            {/* Console Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-800/80 bg-slate-950/60 gap-3">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Live integration audit trail</h3>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                {/* Auto-Spam Toggle */}
                <button 
                  onClick={() => setIsAutoSpamming(!isAutoSpamming)}
                  className={`flex items-center gap-1.5 border px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
                    isAutoSpamming 
                      ? 'bg-violet-950/40 border-violet-500/50 text-violet-300 hover:border-violet-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-violet-500/30 hover:text-slate-200'
                  }`}
                  title="Simulate continuous traffic streaming"
                >
                  {isAutoSpamming ? (
                    <>
                      <span className="relative flex h-1.5 w-1.5 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-violet-400"></span>
                      </span>
                      <Pause className="w-3 h-3 text-violet-400 shrink-0" />
                      <span>SPAMMING...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>AUTO-SPAM</span>
                    </>
                  )}
                </button>

                {/* Spam Batch */}
                <button 
                  onClick={handleSpamBatch}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/30 hover:text-rose-300 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all text-slate-400"
                  title="Spam a burst of 12 Workspace integration logs"
                >
                  <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                  <span>SPAM BATCH</span>
                </button>

                {/* Clear Logs */}
                <button 
                  onClick={handleClearLogs}
                  className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-red-500/30 hover:text-red-400 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all text-slate-400"
                  title="Purge logs from memory buffer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400 shrink-0" />
                  <span>CLEAR</span>
                </button>

                <div className="hidden sm:flex items-center space-x-1 font-mono text-[9px] text-slate-500 border-l border-slate-800/80 pl-2">
                  <Cpu className="w-3 h-3" />
                  <span>LIVE BUFFER</span>
                </div>
              </div>
            </div>

            {/* Console Log Area */}
            <div className="p-4 font-mono text-[11px] leading-relaxed max-h-[400px] overflow-y-auto space-y-1.5 bg-slate-950/60">
              {logs.length === 0 ? (
                <div className="py-12 text-center text-slate-600">
                  <span className="block">&gt; Audit trail buffer is clean. No traffic recorded.</span>
                  <span className="block mt-1 text-[10px]">Click AUTO-SPAM or run a sync pipeline to populate.</span>
                </div>
              ) : (
                logs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex flex-col sm:flex-row sm:items-start p-2 rounded bg-slate-950/40 border border-slate-900 hover:border-slate-800/60 transition-all gap-2"
                  >
                    {/* Timestamp & Level */}
                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="text-slate-600 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span className={`inline-flex rounded-full h-2 w-2 ${
                        log.level === 'success' ? 'bg-emerald-500' :
                        log.level === 'warning' ? 'bg-amber-500' :
                        log.level === 'error' ? 'bg-red-500' :
                        'bg-blue-400'
                      }`} />
                      <span className={`text-[10px] font-bold ${
                        log.level === 'success' ? 'text-emerald-400/80' :
                        log.level === 'warning' ? 'text-amber-400/80' :
                        log.level === 'error' ? 'text-red-400/80' :
                        'text-blue-400/80'
                      }`}>
                        {log.level.toUpperCase()}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <span className="text-slate-400 font-bold">[{log.type.toUpperCase()}]</span>{' '}
                      <span className="text-slate-200">{log.message}</span>
                      {log.details && (
                        <div className="text-[10px] text-slate-500 mt-0.5 border-l border-slate-800 pl-2 ml-1">
                          {log.details}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Security Analysis & Info */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI Security Auditor Panel */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/5 blur-2xl rounded-full" />
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Gemini Compliance Auditor</h3>
              </div>
              <Shield className="w-4 h-4 text-slate-500" />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Leverage Google Gemini LLM intelligence to evaluate the integration buffer logs for permission leaks, scope anomalies, or rate limits.
            </p>

            <button
              onClick={runAiSecurityAudit}
              disabled={isAnalyzing || logs.length === 0}
              className="w-full flex items-center justify-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>ANALYZING LOG BUFFER...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>RUN COMPLIANCE AUDIT</span>
                </>
              )}
            </button>

            {/* AI Report Render Space */}
            <div className="mt-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 min-h-[150px] font-mono whitespace-pre-line leading-relaxed max-h-[350px] overflow-y-auto">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-violet-400" />
                  <span>Synthesizing compliance matrix...</span>
                </div>
              ) : aiAnalysis ? (
                <div>
                  {aiAnalysis}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-slate-600 text-center">
                  <ShieldAlert className="w-6 h-6 text-slate-700 mb-2" />
                  <span>No audit reports generated.</span>
                  <span className="text-[10px] mt-1">Populate logs and click above to run report.</span>
                </div>
              )}
            </div>
          </div>

          {/* Live Workspace Automation Bot */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
              <div className="flex items-center space-x-2">
                <Bot className="w-4 h-4 text-violet-400" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Workspace Automation Bot</h3>
              </div>
              <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">LIVE BOT</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Type actions like <code className="text-violet-400 font-bold">"Draft follow up email on finance"</code> or <code className="text-violet-400 font-bold">"Schedule compliance review on calendar"</code>.
            </p>

            <form onSubmit={handleBotSubmit} className="flex gap-2">
              <input
                type="text"
                value={botMessage}
                onChange={(e) => setBotMessage(e.target.value)}
                placeholder="Ask bot to automate something..."
                disabled={isBotResponding}
                className="flex-1 bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-violet-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 outline-none transition-all"
              />
              <button
                type="submit"
                disabled={isBotResponding || !botMessage.trim()}
                className="bg-violet-600 hover:bg-violet-500 disabled:bg-slate-900 disabled:text-slate-600 text-white p-2.5 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all shrink-0"
              >
                {isBotResponding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </form>

            {/* Response space */}
            {botResponse && (
              <div className="mt-4 p-4 rounded-lg bg-slate-950/40 border border-slate-800/80 text-xs text-slate-300 font-mono leading-relaxed max-h-[220px] overflow-y-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="font-bold text-violet-400 mb-1 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5" />
                  <span>Gemini Assistant:</span>
                </div>
                <div className="whitespace-pre-wrap">{botResponse}</div>
              </div>
            )}
          </div>

          {/* Auth0 Authentication Validator */}
          <div className="bg-[#0b0f19] border border-slate-800 rounded-xl p-5 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 blur-2xl rounded-full pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 border-b border-slate-800/60 pb-3">
              <div className="flex items-center space-x-2">
                <Key className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Auth0 OIDC Validator</h3>
              </div>
              
              <div className="flex items-center space-x-1">
                {auth0Status === 'success' && (
                  <span className="flex items-center gap-1 text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                    <UserCheck className="w-3 h-3" /> VERIFIED
                  </span>
                )}
                {auth0Status === 'failed' && (
                  <span className="text-[9px] font-mono text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">FAILED</span>
                )}
                {auth0Status === 'unverified' && (
                  <span className="text-[9px] font-mono text-slate-500 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">UNVERIFIED</span>
                )}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">AUTH0 TENANT DOMAIN</label>
                <input
                  type="text"
                  value={auth0Domain}
                  onChange={(e) => setAuth0Domain(e.target.value)}
                  placeholder="domain.auth0.com"
                  disabled={isAuth0Validating}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-500 mb-1">OIDC CLIENT ID</label>
                <input
                  type="text"
                  value={auth0ClientId}
                  onChange={(e) => setAuth0ClientId(e.target.value)}
                  placeholder="Auth0 client identification ID"
                  disabled={isAuth0Validating}
                  className="w-full bg-slate-950/60 border border-slate-800 hover:border-slate-700 focus:border-amber-500/50 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={handleValidateAuth0}
              disabled={isAuth0Validating || !auth0Domain || !auth0ClientId}
              className="w-full flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 hover:border-transparent py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-all"
            >
              {isAuth0Validating ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>VALIDATING AUTH0...</span>
                </>
              ) : (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>VALIDATE AUTH0 SESSION</span>
                </>
              )}
            </button>

            {auth0Status === 'success' && auth0User && (
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/10 border border-emerald-900/40 text-xs text-slate-300 font-mono animate-in fade-in duration-200">
                <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>OIDC Session Verified:</span>
                </div>
                <div className="text-[11px] space-y-0.5 mt-1 text-slate-400">
                  <p>Email: <strong className="text-slate-200">{auth0User.email}</strong></p>
                  <p>Provider: <span className="text-amber-400 font-bold">auth0</span> (Enterprise SSO)</p>
                  <p>Subject: <span className="text-slate-300">{auth0User.id}</span></p>
                </div>
              </div>
            )}
          </div>

          {/* Compliance & Governance Info Card */}
          <div className="bg-slate-950/20 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800/60 pb-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono text-slate-300 uppercase">Compliance Guide</h4>
            </div>

            <div className="space-y-3 text-[11px] text-slate-400 leading-relaxed font-mono">
              <div className="flex gap-2">
                <span className="text-emerald-400 shrink-0">1.</span>
                <p><strong className="text-slate-200">Least Privilege:</strong> Only grant <span className="text-amber-500 font-bold">.readonly</span> scopes for simple monitoring applications. Avoid read-write scopes unless critical.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 shrink-0">2.</span>
                <p><strong className="text-slate-200">Rate Limiting:</strong> Enforce back-off routines on Workspace syncing actions to avoid HTTP 429 quota exhaustion errors.</p>
              </div>
              <div className="flex gap-2">
                <span className="text-emerald-400 shrink-0">3.</span>
                <p><strong className="text-slate-200">Persistence:</strong> Synchronized data ledger is safely cached via Firestore multi-tab client persistence for high offline capability.</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}

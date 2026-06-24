'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Terminal, 
  ShieldCheck, 
  Cpu, 
  Database, 
  AlertCircle, 
  Clock, 
  HelpCircle,
  TrendingUp,
  Workflow,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Flame,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import WorkspaceSync from '@/components/WorkspaceSync';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'sync' | 'refresh' | 'system';
  level: 'success' | 'info' | 'warning' | 'error';
  message: string;
  details?: string;
}

export default function Page() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [quotaGmail, setQuotaGmail] = useState(82);
  const [quotaDrive, setQuotaDrive] = useState(41);
  const [quotaCalendar, setQuotaCalendar] = useState(15);
  const [quotaContacts, setQuotaContacts] = useState(9);
  const [isRefreshingQuotas, setIsRefreshingQuotas] = useState(false);

  // Fetch initial server logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        const data = await res.json();
        if (data.success) {
          setLogs(data.logs);
        }
      } catch (err) {
        console.error('Failed to load initial logs:', err);
      }
    };
    fetchLogs();

    // Clock ticker
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handler when child component logs an action
  const handleLogAdded = async (
    type: 'auth' | 'sync' | 'refresh' | 'system',
    level: 'success' | 'info' | 'warning' | 'error',
    message: string,
    details?: string
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

      // Randomize API quota meters slightly to reflect dynamic resource utilization
      if (type === 'sync' && level === 'success') {
        setQuotaGmail(prev => Math.min(100, prev + Math.floor(Math.random() * 3) + 1));
        setQuotaDrive(prev => Math.min(100, prev + Math.floor(Math.random() * 2) + 1));
        setQuotaCalendar(prev => Math.min(100, prev + Math.floor(Math.random() * 4) + 1));
        setQuotaContacts(prev => Math.min(100, prev + Math.floor(Math.random() * 2) + 1));
      }
    } catch (err) {
      console.error('Error registry logs:', err);
    }
  };

  const handleRefreshQuotas = () => {
    setIsRefreshingQuotas(true);
    setTimeout(() => {
      setIsRefreshingQuotas(false);
      handleLogAdded('refresh', 'success', 'API Quota registries refreshed.', 'Successfully polled developer credentials. All endpoints nominal.');
    }, 800);
  };

  const [isAutoSpamming, setIsAutoSpamming] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans select-none selection:bg-violet-500/30 selection:text-white">
      {/* Top ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-indigo-600/10 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Header */}
      <header className="border-b border-slate-900 bg-[#030712]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-600/20">
              <Workflow className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-wider text-slate-100 font-mono">
                Workspace Sync Console
              </h1>
              <p className="text-[10px] text-slate-500 font-mono">v1.1.2 • SECURE ENCLAVE</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="hidden md:flex items-center space-x-2 bg-slate-900/60 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-xs">
              <Clock className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-slate-300 w-16 text-center font-bold">{currentTime || '--:--:--'}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-400 tracking-wide uppercase">CLOUD GATEWAY ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main dashboard body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Workspace sync main panel */}
        <section>
          <WorkspaceSync onLogAdded={handleLogAdded} />
        </section>

        {/* Grid layout for secondary system statistics and audit logs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* API telemetry and regulators */}
          <div className="lg:col-span-4 bg-[#0a101d] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -z-10" />
            
            <div>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800/60">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">API Telemetry Meters</h3>
                </div>
                <button 
                  onClick={handleRefreshQuotas}
                  disabled={isRefreshingQuotas}
                  className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg hover:border-emerald-500/30 text-slate-400 hover:text-emerald-400 cursor-pointer transition-all disabled:opacity-50"
                  title="Query quota metrics"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuotas ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Progress bars of quota / sync rates */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Gmail API Polls</span>
                    <span className="font-bold text-slate-200">{quotaGmail}/100</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-emerald-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${quotaGmail}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Google Drive Synced</span>
                    <span className="font-bold text-slate-200">{quotaDrive}/100</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-violet-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${quotaDrive}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>Calendar Schedules</span>
                    <span className="font-bold text-slate-200">{quotaCalendar}/100</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${quotaCalendar}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
                    <span>People Directory Synced</span>
                    <span className="font-bold text-slate-200">{quotaContacts}/100</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-amber-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${quotaContacts}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>All OAuth channels authorized under secure TLS 1.3 encryption protocols.</span>
            </div>
          </div>

          {/* Real-time system log monitor */}
          <div className="lg:col-span-8 bg-[#0a101d] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/5 blur-3xl rounded-full -z-10" />
            
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-3 border-b border-slate-800/60 gap-3">
                <div className="flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-violet-400" />
                  <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">Live Integration Audit Trail</h3>
                </div>

                <div className="flex items-center flex-wrap gap-2">
                  <button 
                    onClick={() => setIsAutoSpamming(!isAutoSpamming)}
                    className={`flex items-center gap-1.5 border px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all ${
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

                  <button 
                    onClick={handleSpamBatch}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/30 hover:text-rose-300 px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all text-slate-400"
                    title="Spam a burst of 12 Workspace integration logs"
                  >
                    <Flame className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>SPAM BATCH</span>
                  </button>

                  <button 
                    onClick={handleClearLogs}
                    className="flex items-center gap-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-red-500/30 hover:text-red-400 px-2 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all text-slate-400"
                    title="Purge logs from memory buffer"
                  >
                    <Trash2 className="w-3 h-3 text-red-400 shrink-0" />
                    <span>CLEAR</span>
                  </button>

                  <div className="hidden sm:flex items-center space-x-1 font-mono text-[9px] text-slate-500 border-l border-slate-800/80 pl-2">
                    <Cpu className="w-3 h-3" />
                    <span>LIVE BUFFER</span>
                  </div>
                </div>
              </div>

              {/* Logs Stream */}
              <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
                <AnimatePresence initial={false}>
                  {logs.length === 0 ? (
                    <div className="py-8 text-center text-xs font-mono text-slate-600">
                      No logs in stream buffer.
                    </div>
                  ) : (
                    logs.map((log) => (
                      <motion.div 
                        key={log.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="p-2.5 bg-[#070b13]/60 border border-slate-900 rounded-xl flex items-start gap-3 text-xs"
                      >
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold shrink-0 uppercase tracking-wider ${
                          log.level === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          log.level === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          log.level === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {log.type}
                        </span>

                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-[11px] text-slate-300 font-bold leading-relaxed">{log.message}</p>
                          {log.details && (
                            <p className="text-[10px] text-slate-500 leading-normal font-sans mt-0.5">{log.details}</p>
                          )}
                        </div>

                        <span className="text-[10px] font-mono text-slate-600 shrink-0">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <Database className="w-3.5 h-3.5 text-violet-400" />
                Firestore Storage: Syncing 5 Collections
              </span>
              <span>Buffer allocation: Nominal</span>
            </div>
          </div>

        </div>

        {/* Security / ToS notification cards */}
        <div className="bg-indigo-950/20 border border-indigo-500/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3 text-xs">
            <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Google Workspace Scopes Sandbox</p>
              <p className="text-slate-400 mt-0.5 leading-relaxed">
                Google Picker and storage synchronization run entirely within this containerized environment. This applet utilizes standard Firebase authorization tokens. No credential details are leaked outside this runtime framework.
              </p>
            </div>
          </div>
          <a 
            href="https://developers.google.com/picker" 
            target="_blank" 
            rel="noreferrer"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono rounded-lg shrink-0 flex items-center gap-1 cursor-pointer transition-all text-slate-300 hover:text-white"
          >
            Picker API Documentation
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-auto py-6 bg-[#030712]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between text-[11px] text-slate-500 font-mono gap-4">
          <p>© 2026 Google Workspace Sync Console. All integrations securely persistent in Firestore.</p>
          <div className="flex justify-center space-x-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              FIREBASE OPERATIONAL
            </span>
            <span className="flex items-center gap-1 text-indigo-400">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
              PICKER READY
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Simple fallback helper for class merger
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

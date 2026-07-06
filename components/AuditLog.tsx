import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, ShieldAlert, Clock, ShieldCheck, Activity } from 'lucide-react';
import { format } from 'date-fns';
import useAuth from '../hooks/use-auth';

interface AuthLog {
  id: string;
  type: string;
  message: string;
  level: string;
  timestamp: Date;
}

export default function AuditLog() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  useEffect(() => {
    // We can also fetch even if user is not loaded yet if security rules allow,
    // but the rule is: allow read: if isSignedIn();
    if (!db || !user) {
      if (!user) setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'logs'),
      where('type', '==', 'auth'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsArray: AuthLog[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        logsArray.push({
          id: doc.id,
          type: data.type,
          message: data.message,
          level: data.level || 'info',
          timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
        });
      });
      setLogs(logsArray);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching audit logs:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <div className="bg-[#090d16] border border-slate-800 rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center space-y-3">
          <Activity className="w-6 h-6 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-mono text-xs animate-pulse tracking-widest uppercase">Fetching Audit Stream...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#090d16] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-full max-h-[400px]">
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Authentication Events</h3>
        </div>
        <div className="text-[10px] text-emerald-500 font-mono uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Live Sync</span>
        </div>
      </div>
      <div className="p-2 overflow-y-auto flex-1">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 font-mono text-xs">
            No authentication events found.
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map(log => {
              const isError = log.level === 'error' || log.message.toLowerCase().includes('fail');
              const isWarning = log.level === 'warning';
              
              return (
                <div key={log.id} className="flex items-start space-x-3 p-3 hover:bg-slate-800/30 rounded-lg transition-colors border border-transparent hover:border-slate-800/50 group">
                  <div className="mt-0.5">
                    {isError ? (
                      <ShieldAlert className="w-4 h-4 text-red-400" />
                    ) : isWarning ? (
                      <ShieldAlert className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-medium truncate ${
                        isError ? 'text-red-300' : isWarning ? 'text-amber-300' : 'text-slate-300'
                      }`}>
                        {log.message}
                      </p>
                      <div className="flex items-center space-x-1 ml-2 text-[10px] text-slate-500 font-mono">
                        <Clock className="w-3 h-3" />
                        <span>{format(log.timestamp, 'HH:mm:ss')}</span>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center space-x-2">
                      <span className={`text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                        isError 
                          ? 'bg-red-900/30 text-red-400 border border-red-500/20' 
                          : isWarning
                            ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-900/30 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {isError ? 'FAILURE' : isWarning ? 'WARNING' : 'SUCCESS'}
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {format(log.timestamp, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

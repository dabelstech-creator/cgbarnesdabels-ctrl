"use client";

import React from "react";
import { CheckCircle, Info, AlertTriangle, XCircle, Clock } from "lucide-react";

interface LogEntry {
  id: string;
  type: "auth" | "sync" | "refresh" | "system";
  level: "success" | "info" | "warning" | "error";
  message: string;
  details: string;
  timestamp: any;
}

interface LogViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
  theme?: "dark" | "light";
}

export default function LogViewer({ logs, isLoading, theme = "dark" }: LogViewerProps) {
  const getIcon = (level: string) => {
    switch (level) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case "error":
        return <XCircle className="h-4 w-4 text-rose-400" />;
      default:
        return <Info className="h-4 w-4 text-cyan-400" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "success":
        return "text-emerald-400";
      case "warning":
        return "text-amber-400";
      case "error":
        return "text-rose-400";
      default:
        return "text-cyan-400";
    }
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return "--:--:--";
    try {
      const date = ts.toDate ? ts.toDate() : new Date(ts);
      return date.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return "--:--:--";
    }
  };

  return (
    <div className={`border rounded-xl overflow-hidden h-[400px] flex flex-col transition-colors duration-500 ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`flex items-start space-x-3 p-3 rounded-lg animate-pulse border transition-colors ${theme === 'dark' ? 'bg-slate-950/30 border-slate-800/50' : 'bg-slate-50 border-slate-200'}`}>
              <div className={`h-4 w-4 rounded-full mt-0.5 ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className={`h-3 w-16 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                  <div className={`h-3 w-12 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                </div>
                <div className={`h-4 w-3/4 rounded ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-200'}`} />
                <div className={`h-2 w-1/2 rounded ${theme === 'dark' ? 'bg-slate-800/50' : 'bg-slate-100'}`} />
              </div>
            </div>
          ))
        ) : logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Clock className={`h-8 w-8 ${theme === 'dark' ? 'opacity-20' : 'opacity-40'}`} />
            <p className="text-sm font-mono uppercase tracking-widest">Awaiting system telemetry...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`group flex items-start space-x-3 p-3 rounded-lg border transition-all ${theme === 'dark' ? 'bg-slate-950/50 border-slate-800/50 hover:border-slate-700/50' : 'bg-slate-50 border-slate-100 hover:border-slate-200 hover:bg-white shadow-sm'}`}>
              <div className="mt-0.5">{getIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getLevelColor(log.level)} ${theme === 'dark' ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
                    {log.type}
                  </span>
                  <span className={`text-[10px] font-mono flex items-center space-x-1 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </span>
                </div>
                <p className={`text-xs font-medium leading-relaxed transition-colors ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{log.message}</p>
                <p className={`text-[10px] font-mono mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                  {log.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

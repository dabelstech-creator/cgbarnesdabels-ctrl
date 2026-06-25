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
}

export default function LogViewer({ logs }: LogViewerProps) {
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
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden h-[400px] flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Clock className="h-8 w-8 opacity-20" />
            <p className="text-sm font-mono uppercase tracking-widest">Awaiting system telemetry...</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="group flex items-start space-x-3 p-3 rounded-lg bg-slate-950/50 border border-slate-800/50 hover:border-slate-700/50 transition-all">
              <div className="mt-0.5">{getIcon(log.level)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${getLevelColor(log.level)} bg-slate-900/50`}>
                    {log.type}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimestamp(log.timestamp)}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">{log.message}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-1 leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity">
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

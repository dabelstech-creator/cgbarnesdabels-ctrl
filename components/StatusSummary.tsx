import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { Activity, Zap, RefreshCw } from 'lucide-react';

interface LogEntry {
  id: string;
  type: string;
  level: string;
  message: string;
  details?: string;
  timestamp: any;
}

interface StatusSummaryProps {
  logs: LogEntry[];
  theme?: 'dark' | 'light';
  isLoading?: boolean;
}

export default function StatusSummary({ logs, theme = 'dark', isLoading = false }: StatusSummaryProps) {
  const chartData = useMemo(() => {
    // Group logs by time or simply by type to show some "sync metrics"
    // Since logs might be sparse, let's just create a distribution of the last N logs by type
    // Or we could create a time-series of events
    
    // For a nice chart, let's group by log type
    const counts = { sync: 0, auth: 0, system: 0, ai: 0, other: 0 };
    logs.forEach(log => {
      const type = log.type?.toLowerCase();
      if (type === 'sync') counts.sync++;
      else if (type === 'auth') counts.auth++;
      else if (type === 'system') counts.system++;
      else if (type === 'ai') counts.ai++;
      else counts.other++;
    });

    return [
      { name: 'Sync', count: counts.sync },
      { name: 'Auth', count: counts.auth },
      { name: 'System', count: counts.system },
      { name: 'AI', count: counts.ai },
      { name: 'Other', count: counts.other }
    ];
  }, [logs]);

  const recentSyncs = logs.filter(l => l.type === 'sync').length;

  if (isLoading) {
    return (
      <div className={`border rounded-2xl p-5 shadow-md flex flex-col h-full transition-colors duration-500 ${theme === 'dark' ? 'bg-[#090d16] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-32 bg-slate-800/50 rounded animate-pulse" />
          <div className="h-4 w-4 bg-slate-800/50 rounded animate-pulse" />
        </div>
        <div className="flex items-center space-x-6 mb-6">
          <div>
            <div className="h-8 w-16 bg-slate-800/50 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-slate-800/50 rounded animate-pulse" />
          </div>
          <div>
            <div className="h-8 w-16 bg-slate-800/50 rounded animate-pulse mb-1" />
            <div className="h-3 w-20 bg-slate-800/50 rounded animate-pulse" />
          </div>
        </div>
        <div className="flex-1 min-h-[150px] flex items-end justify-between space-x-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-1 flex flex-col justify-end h-full">
              <div className="w-full bg-slate-800/50 rounded-t animate-pulse" style={{ height: `${Math.max(20, Math.random() * 100)}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded-2xl p-5 shadow-md flex flex-col h-full transition-colors duration-500 ${theme === 'dark' ? 'bg-[#090d16] border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-[10px] font-bold tracking-widest uppercase font-mono transition-colors ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
          Real-time Sync Metrics
        </h3>
        <RefreshCw className={`w-4 h-4 ${recentSyncs > 0 ? 'text-emerald-500 animate-spin-slow' : 'text-slate-500'}`} />
      </div>

      <div className="flex items-center space-x-6 mb-6">
        <div>
          <div className="text-2xl font-bold font-mono text-emerald-500">{recentSyncs}</div>
          <div className="text-[10px] uppercase font-mono text-slate-500">Recent Syncs</div>
        </div>
        <div>
          <div className="text-2xl font-bold font-mono text-amber-500">{logs.length}</div>
          <div className="text-[10px] uppercase font-mono text-slate-500">Total Events</div>
        </div>
      </div>

      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#1e293b' : '#e2e8f0'} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
              style={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke={theme === 'dark' ? '#64748b' : '#94a3b8'} 
              style={{ fontSize: 10, fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: theme === 'dark' ? '#1e293b' : '#f1f5f9' }}
              contentStyle={{ 
                backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', 
                borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                borderRadius: '8px',
                fontFamily: 'monospace',
                fontSize: '12px'
              }}
            />
            <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

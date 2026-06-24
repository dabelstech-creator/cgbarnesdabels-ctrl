"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";

interface WorkspaceChartsProps {
  biometricData: any[];
  biometricChartType: string;
}

export default function WorkspaceCharts({
  biometricData,
  biometricChartType,
}: WorkspaceChartsProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {biometricChartType === "combined" ? (
        <LineChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorHr" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSteps" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              if (typeof time === 'string') {
                try {
                  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  return time;
                }
              }
              return "";
            }} 
            stroke="#64748b" 
            style={{ fontSize: 9, fontFamily: 'monospace' }}
          />
          <YAxis yAxisId="left" stroke="#f43f5e" style={{ fontSize: 9, fontFamily: 'monospace' }} domain={[40, 'auto']} />
          <YAxis yAxisId="right" orientation="right" stroke="#10b981" style={{ fontSize: 9, fontFamily: 'monospace' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
            itemStyle={{ fontSize: 11 }}
            labelFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString();
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString();
              }
              return time;
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }} />
          <Line yAxisId="left" type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey="steps" name="Cumulative Steps" stroke="#10b981" strokeWidth={2} dot={false} />
          <Line yAxisId="right" type="monotone" dataKey="calories" name="Calories (kcal)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
        </LineChart>
      ) : biometricChartType === "heartRate" ? (
        <AreaChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorHrArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              if (typeof time === 'string') {
                try {
                  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  return time;
                }
              }
              return "";
            }} 
            stroke="#64748b" 
            style={{ fontSize: 9, fontFamily: 'monospace' }}
          />
          <YAxis stroke="#f43f5e" style={{ fontSize: 9, fontFamily: 'monospace' }} domain={[50, 'auto']} />
          <Tooltip
            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
            itemStyle={{ fontSize: 11, color: '#f43f5e' }}
            labelFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString();
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString();
              }
              return time;
            }}
          />
          <Area type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorHrArea)" activeDot={{ r: 5 }} />
        </AreaChart>
      ) : (
        <BarChart data={biometricData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis 
            dataKey="timestamp" 
            tickFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              }
              if (typeof time === 'string') {
                try {
                  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  return time;
                }
              }
              return "";
            }} 
            stroke="#64748b" 
            style={{ fontSize: 9, fontFamily: 'monospace' }}
          />
          <YAxis yAxisId="left" stroke="#10b981" style={{ fontSize: 9, fontFamily: 'monospace' }} />
          <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" style={{ fontSize: 9, fontFamily: 'monospace' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: 8 }}
            labelStyle={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10 }}
            itemStyle={{ fontSize: 11 }}
            labelFormatter={(time) => {
              if (time instanceof Date) return time.toLocaleTimeString();
              if (time && typeof time === 'object' && 'toDate' in time) {
                return (time as any).toDate().toLocaleTimeString();
              }
              return time;
            }}
          />
          <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace', paddingTop: 10 }} />
          <Bar yAxisId="left" dataKey="steps" name="Cumulative Steps" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="calories" name="Calories (kcal)" stroke="#f59e0b" strokeWidth={2.5} dot={true} />
        </BarChart>
      )}
    </ResponsiveContainer>
  );
}

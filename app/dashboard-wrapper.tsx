"use client";

import nextDynamic from "next/dynamic";

const DashboardClient = nextDynamic(() => import("./dashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center font-sans">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-lg blur-sm opacity-50 animate-pulse"></div>
          <div className="relative bg-slate-900 border border-violet-500 p-3 rounded-lg">
            <svg className="animate-spin h-8 w-8 text-violet-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        </div>
        <h2 className="text-xl font-semibold tracking-tight text-white">Loading Workspace Portal...</h2>
        <p className="text-xs text-slate-400 font-mono">Initializing secure orchestration core</p>
      </div>
    </div>
  ),
});

export default function DashboardWrapper() {
  return <DashboardClient />;
}

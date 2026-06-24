"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center font-sans p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-amber-500 rounded-lg blur-md opacity-35 animate-pulse"></div>
          <div className="relative bg-slate-900 border border-red-500 p-6 rounded-lg font-mono text-4xl font-bold text-red-400 tracking-wider">
            404
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">Security Perimeter Violation</h2>
          <p className="text-sm text-slate-400">
            The requested workspace coordinate or orchestration command is unrecognized or restricted.
          </p>
        </div>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-violet-500 bg-violet-950/40 text-violet-300 font-medium text-sm hover:bg-violet-600 hover:text-white transition-all duration-200 shadow-md shadow-violet-950/20"
          >
            Return to Dashboard Core
          </Link>
        </div>
      </div>
    </div>
  );
}

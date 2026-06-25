'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/use-auth';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Activity,
  ChevronRight,
  Lock,
  RefreshCw
} from 'lucide-react';

export default function AuthInterface() {
  const { user, loading, loginWithGoogle, loginWithMock, logout } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full"
          />
          <RefreshCw className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-amber-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-6 space-y-6"
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-900/20 mb-2">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white uppercase font-mono">Workspace Protocol</h2>
              <p className="text-slate-400 text-xs max-w-[240px] font-mono leading-relaxed">
                Authentication required for administrative terminal access.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={loginWithGoogle}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 active:scale-[0.98] font-mono shadow-xl"
              >
                <img 
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                  alt="Google" 
                  className="w-4 h-4"
                />
                <span>Authorize with Google</span>
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">OR</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button
                onClick={loginWithMock}
                className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 border border-slate-700 active:scale-[0.98] font-mono"
              >
                <Lock className="w-4 h-4" />
                <span>Mock OIDC Handshake</span>
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center space-x-4 text-[9px] uppercase tracking-[0.2em] text-slate-600 font-bold font-mono">
              <span className="flex items-center space-x-1.5">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                <span>AES-256</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <div className="w-1 h-1 bg-amber-500 rounded-full"></div>
                <span>SEC-PORT</span>
              </span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="p-6"
          >
            <div className="flex items-center space-x-4 bg-slate-800/30 p-4 rounded-2xl border border-slate-800/50">
              <div className="relative">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`}
                  alt={user.displayName || "User"}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/10 border border-slate-700 shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate font-mono uppercase tracking-tight">
                  {user.displayName || "Administrator"}
                </h3>
                <p className="text-[10px] text-slate-500 truncate font-mono tracking-tighter">
                  {user.email}
                </p>
              </div>
              <button 
                onClick={logout}
                className="p-2.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20"
                title="Terminate Session"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-600 font-mono">
              <span className="flex items-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                SESSION ACTIVE
              </span>
              <span className="bg-slate-800/50 px-2 py-0.5 rounded border border-slate-700/50">ID: {user.uid.substring(0, 8)}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

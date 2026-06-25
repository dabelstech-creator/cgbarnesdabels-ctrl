'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/use-auth';
import { useMockAuth } from '../hooks/use-mock-auth';
import { 
  Shield, 
  LogIn, 
  LogOut, 
  User as UserIcon, 
  Settings, 
  Activity,
  ChevronRight,
  Lock
} from 'lucide-react';

export default function AuthInterface() {
  const { user, loading: authLoading, loginWithGoogle, logout } = useAuth();
  const { mockUser, loading: mockLoading, loginWithMockOAuth, logoutMockOAuth } = useMockAuth();
  
  const currentUser = user || mockUser;
  const handleLogout = user ? logout : logoutMockOAuth;
  const loading = authLoading || mockLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-8 shadow-2xl overflow-hidden relative"
          >
            {/* Background Accents */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl"></div>

            <div className="relative space-y-6">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-900/20 mb-2">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Secure Portal Access</h2>
                <p className="text-slate-400 text-sm max-w-[240px]">
                  Authorize your session to access workspace automation and bot orchestration.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={loginWithGoogle}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-medium transition-all duration-200 shadow-sm active:scale-[0.98]"
                >
                  <img 
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                    alt="Google" 
                    className="w-5 h-5"
                  />
                  <span>Authorize with Google</span>
                </button>
                <button
                  onClick={loginWithMockOAuth}
                  className="w-full flex items-center justify-center space-x-3 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-all duration-200 border border-slate-700 active:scale-[0.98]"
                >
                  <Lock className="w-5 h-5" />
                  <span>Mock Login (Development)</span>
                </button>
              </div>

              <div className="pt-4 flex items-center justify-center space-x-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                <span className="flex items-center space-x-1">
                  <Lock className="w-3 h-3" />
                  <span>256-BIT AES</span>
                </span>
                <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                <span className="flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>SECURE CHANNEL</span>
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img 
                  src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt={user.displayName || "User"}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-violet-500/20"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-slate-900 rounded-full shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-white truncate">
                  {currentUser.displayName || "Administrator"}
                </h3>
                <p className="text-xs text-slate-400 truncate">
                  {currentUser.email}
                </p>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all text-slate-300">
                <Activity className="w-4 h-4 mb-2 text-violet-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Metrics</span>
              </button>
              <button className="flex flex-col items-center justify-center p-3 bg-slate-800/40 hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-all text-slate-300">
                <Settings className="w-4 h-4 mb-2 text-indigo-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Config</span>
              </button>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <span className="flex items-center">
                <div className="w-1.5 h-1.5 bg-violet-500 rounded-full mr-2 animate-pulse"></div>
                SESSION ACTIVE
              </span>
              <span>UID: {currentUser.uid.substring(0, 8)}...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

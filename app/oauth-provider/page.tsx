'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Activity, Shield, Heart, Zap, CheckCircle } from 'lucide-react';

function OAuthProviderContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get('provider') || 'googlefit';
  const clientId = searchParams.get('client_id') || 'mock_client';
  const redirectUri = searchParams.get('redirect_uri') || '';
  const scope = searchParams.get('scope') || 'read';
  const state = searchParams.get('state') || '';

  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(false);
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);

  const scopesList = scope ? scope.split(' ') : [];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSelectedScopes(scope ? scope.split(' ') : []);
    }, 0);
    return () => clearTimeout(timer);
  }, [scope]);

  // Handle toggling individual scopes
  const toggleScope = (sc: string) => {
    if (selectedScopes.includes(sc)) {
      setSelectedScopes(selectedScopes.filter(s => s !== sc));
    } else {
      setSelectedScopes([...selectedScopes, sc]);
    }
  };

  // Human names and styling configuration
  const providerDetails: Record<
    string,
    {
      name: string;
      logo: string;
      bgColor: string;
      btnColor: string;
      textColor: string;
      brandGradient: string;
      icon: React.ReactNode;
    }
  > = {
    googlefit: {
      name: 'Google Fit',
      logo: 'G',
      bgColor: 'bg-white',
      btnColor: 'bg-blue-600 hover:bg-blue-700 text-white',
      textColor: 'text-gray-900',
      brandGradient: 'from-blue-500 via-red-500 to-yellow-500',
      icon: <Activity className="w-5 h-5 text-blue-500" />
    },
    fitbit: {
      name: 'Fitbit',
      logo: '♦',
      bgColor: 'bg-[#002e3c]',
      btnColor: 'bg-[#00b0b9] hover:bg-[#0096a0] text-white',
      textColor: 'text-white',
      brandGradient: 'from-teal-600 to-[#00b0b9]',
      icon: <Heart className="w-5 h-5 text-[#00b0b9]" />
    },
    strava: {
      name: 'Strava',
      logo: '▲',
      bgColor: 'bg-[#fc4c02]',
      btnColor: 'bg-black hover:bg-gray-900 text-white',
      textColor: 'text-white',
      brandGradient: 'from-orange-600 to-red-500',
      icon: <Zap className="w-5 h-5 text-orange-400" />
    }
  };

  const currentProvider = providerDetails[provider] || providerDetails.googlefit;

  const handleApprove = () => {
    setLoading(true);
    // Simulate slight network delay
    setTimeout(() => {
      setApproved(true);
      // Redirect popup back to our callback route
      const callbackCode = `code_${Math.random().toString(36).substring(2, 12)}`;
      const callbackUrl = new URL(redirectUri || `${window.location.origin}/api/auth/callback`);
      
      callbackUrl.searchParams.append('code', callbackCode);
      callbackUrl.searchParams.append('provider', provider);
      callbackUrl.searchParams.append('scope', selectedScopes.join(' '));
      callbackUrl.searchParams.append('state', state);

      window.location.href = callbackUrl.toString();
    }, 1200);
  };

  const handleDeny = () => {
    window.close();
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${provider === 'fitbit' ? 'bg-[#06121a]' : 'bg-slate-900'}`}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-800 ${provider === 'googlefit' ? 'bg-slate-50' : 'bg-slate-950 text-slate-100'}`}>
        
        {/* Brand Banner */}
        <div className={`h-3 bg-gradient-to-r ${currentProvider.brandGradient}`} />
        
        {/* Content */}
        <div className="p-6 md:p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold font-mono border border-slate-800 shadow-md ${provider === 'googlefit' ? 'bg-slate-100 text-blue-600' : 'bg-[#112233] text-teal-400'}`}>
                {currentProvider.logo}
              </span>
              <div>
                <h2 className={`text-lg font-bold leading-none ${provider === 'googlefit' ? 'text-slate-900' : 'text-slate-100'}`}>
                  {currentProvider.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1 font-mono">OAuth 2.0 Consent Service</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-xs font-medium font-mono">
              <Shield className="w-3.5 h-3.5" />
              <span>SECURE</span>
            </div>
          </div>

          {/* Invitation details */}
          <div className="mb-6">
            <h3 className={`text-base font-semibold ${provider === 'googlefit' ? 'text-slate-800' : 'text-slate-200'}`}>
              Authorize <span className="text-violet-500 font-semibold font-mono">Health & Auth Sync</span>?
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              An application is requesting permission to access your biometric health statistics and synchronizations logs on your behalf.
            </p>
          </div>

          {/* Connected email (Personalized context) */}
          <div className={`p-3 rounded-xl border mb-6 flex items-center space-x-3 ${provider === 'googlefit' ? 'bg-slate-100 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs">
              CB
            </div>
            <div className="overflow-hidden">
              <p className={`text-xs font-semibold truncate ${provider === 'googlefit' ? 'text-slate-700' : 'text-slate-300'}`}>
                cgbarnesdabels@gmail.com
              </p>
              <p className="text-[10px] text-slate-500 font-mono">Primary Sync Profile</p>
            </div>
          </div>

          {/* Scopes Section */}
          <div className="mb-8">
            <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${provider === 'googlefit' ? 'text-slate-500' : 'text-slate-400'}`}>
              Requested Permissions
            </p>
            
            <div className="space-y-2.5">
              {scopesList.map((sc, idx) => (
                <label 
                  key={idx}
                  className={`flex items-start p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedScopes.includes(sc)
                      ? provider === 'googlefit'
                        ? 'bg-blue-50/50 border-blue-200'
                        : 'bg-slate-900 border-slate-800'
                      : 'opacity-50 border-transparent'
                  }`}
                  onClick={() => toggleScope(sc)}
                >
                  <input 
                    type="checkbox" 
                    checked={selectedScopes.includes(sc)}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-400 text-violet-600 focus:ring-violet-500 h-3.5 w-3.5"
                  />
                  <div className="ml-3">
                    <p className={`text-xs font-semibold ${provider === 'googlefit' ? 'text-slate-800' : 'text-slate-200'}`}>
                      {sc.replace('https://www.googleapis.com/auth/fitness.', '').replace('.read', '').toUpperCase()}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed font-mono">
                      Allow syncing physical logs related to this key parameter.
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              onClick={handleApprove}
              disabled={loading || approved}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center justify-center ${currentProvider.btnColor}`}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-l-white rounded-full animate-spin" />
                  <span>Granting Access...</span>
                </div>
              ) : approved ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span>Approved ✓</span>
                </div>
              ) : (
                <span>Approve & Authorize</span>
              )}
            </button>
            
            <button
              onClick={handleDeny}
              disabled={loading || approved}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition-all ${
                provider === 'googlefit'
                  ? 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
              }`}
            >
              Cancel Consent
            </button>
          </div>

          {/* Privacy footer */}
          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>Client ID: {clientId.substring(0, 15)}...</span>
            <span>SameSite: None | Secure</span>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function OAuthProviderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-violet-500/30 border-l-violet-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-xs">Initializing Safe Consent Sandbox...</p>
        </div>
      </div>
    }>
      <OAuthProviderContent />
    </Suspense>
  );
}

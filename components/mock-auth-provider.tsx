'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

/**
 * Mock user structure representing the payload returned from a simulated OIDC/OAuth provider
 */
interface MockUser {
  id: string;
  name: string;
  email: string;
  picture: string;
  role: string;
  sub: string;
  token: string;
  lastLogin: string;
}

/**
 * Audit event levels for integration with the system logs
 */
type AuditLevel = 'info' | 'success' | 'warning' | 'error';

interface MockAuthContextType {
  mockUser: MockUser | null;
  isMockAuthenticated: boolean;
  isProcessing: boolean;
  authStatus: 'Unverified' | 'Authenticating' | 'Verified';
  login: () => Promise<void>;
  logout: () => Promise<void>;
  triggerMFA: () => Promise<boolean>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export function MockAuthProvider({ children }: { children: React.ReactNode }) {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [authStatus, setAuthStatus] = useState<'Unverified' | 'Authenticating' | 'Verified'>('Unverified');

  const login = useCallback(async () => {
    setIsProcessing(true);
    setAuthStatus('Authenticating');
    
    // Simulate complex OAuth handshake and JWKS verification
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const user: MockUser = {
      id: "auth0|956275618639",
      name: "Workspace Administrator",
      email: "admin@workspace.internal",
      picture: `https://api.dicebear.com/7.x/bottts/svg?seed=administrator`,
      role: "Super Admin",
      sub: "956275618639-oidc-internal",
      token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1EazVSREU1TlRNNVJFSTVNRVEwTVVReVJEUkNNREpEUVVSRFFrVXpSREpFTkRVME5rUXpSZyJ9...",
      lastLogin: new Date().toISOString()
    };
    
    setMockUser(user);
    setAuthStatus('Verified');
    setIsProcessing(false);
  }, []);

  const logout = useCallback(async () => {
    setIsProcessing(true);
    // Simulate clearing remote session caches
    await new Promise(resolve => setTimeout(resolve, 1000));
    setMockUser(null);
    setAuthStatus('Unverified');
    setIsProcessing(false);
  }, []);

  const triggerMFA = useCallback(async () => {
    setIsProcessing(true);
    // Simulate biometric or hardware key verification
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    return true;
  }, []);

  return (
    <MockAuthContext.Provider value={{ 
      mockUser, 
      isMockAuthenticated: !!mockUser, 
      isProcessing, 
      authStatus,
      login, 
      logout,
      triggerMFA
    }}>
      {children}
    </MockAuthContext.Provider>
  );
}

export function useMockAuth() {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
}

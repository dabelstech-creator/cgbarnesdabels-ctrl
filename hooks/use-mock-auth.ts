'use client';

import { useState, useEffect } from 'react';

export interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export function useMockAuth() {
  const [mockUser, setMockUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('mockUser');
    if (storedUser) {
      setMockUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginWithMockOAuth = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newUser: MockUser = {
      uid: 'mock-' + Math.random().toString(36).substr(2, 9),
      email: 'user@example.com',
      displayName: 'Mock Administrator',
      photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mock-user',
    };
    
    sessionStorage.setItem('mockUser', JSON.stringify(newUser));
    setMockUser(newUser);
    setLoading(false);
  };

  const logoutMockOAuth = () => {
    sessionStorage.removeItem('mockUser');
    setMockUser(null);
  };

  return { mockUser, loading, loginWithMockOAuth, logoutMockOAuth };
}

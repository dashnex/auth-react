'use client';

import { createContext, useEffect, useState } from 'react';
import { DashnexUser, DashNexAuthClientConfig } from '.';
import { useDashNexClient } from './useDashNexClient';

type AuthContextType = {
  user: DashnexUser | null;
  isLoading: boolean;
  isAuthenticated: boolean,
  login: () => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

type AuthProviderProps = {
  children: React.ReactNode;
  config: DashNexAuthClientConfig;
};

export const DashNexAuthProvider = ({ children, config }: AuthProviderProps) => {
  const { client } = useDashNexClient(config);
  const [ user, setUser ] = useState<DashnexUser | null>(null);
  const [ isLoading, setIsLoading ] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a code in the URL (after OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          await client.exchangeCodeForToken(code);
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsLoading(false);
        }  
        
      } catch (error) {
        console.warn('Auth check failed', error);
        setUser(null);
        setIsLoading(false);
      } 
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const loadUser = async() => {
      const currentUser = await client.getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    }

    if (client.isAuthenticated) {
      if (!user) {
        loadUser();
      }
    } else {
      setIsLoading(false);
    }
  }, [client.isAuthenticated])

  const login = () => {
    window.location.href = client.getAuthorizationUrl();;
  };

  const logout = () => {
    setUser(null);
    client.logout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: client.isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 
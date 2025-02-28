'use client';

import { createContext, useEffect, useState } from 'react';
import { DashnexUser, DashNexAuthClientConfig } from '.';
import { useDashNexAuth } from './useDashNexAuth';

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
  // const [client] = useState(() => new DashNexOauthClient(config));
  const { getCurrentUser, isAuthenticated, exchangeCodeForToken, getAuthorizationUrl, logout: dashNexLogout} = useDashNexAuth(config);
  const [user, setUser] = useState<DashnexUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if we have a code in the URL (after OAuth redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
          await exchangeCodeForToken(code);
          window.history.replaceState({}, document.title, window.location.pathname);
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
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setIsLoading(false);
    }
    console.log('isAuthenticated', isAuthenticated)  

    if (isAuthenticated) {
      if (!user) {
        loadUser();
      }
    } else {
      setIsLoading(false);
    }
}, [isAuthenticated])


  const login = () => {
    window.location.href = getAuthorizationUrl();;
  };

  const logout = () => {
    setUser(null);
    dashNexLogout();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 
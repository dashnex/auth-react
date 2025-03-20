import { useAuth } from "./useAuth";
import { DashNexAuthProvider } from "./AuthContext";
import { useAuthLocalStorage } from "./storage";
import { LoginWithDashnexButton } from "./components/LoginWithDashnexButton";

import { useDashNexClient } from './useDashNexClient';
import { DashNexOauthClient } from './DashNexOauthClient';

export { useAuth, useDashNexClient, DashNexAuthProvider, useAuthLocalStorage, LoginWithDashnexButton, DashNexOauthClient };

export type DashnexLicense = {
  product: string;
  activationLimit: number;
  activatedCount: number;
};
  
export type DashnexUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  referralHash: string;
  canImpersonate: boolean;
  licenses: DashnexLicense[];
};

export type TokenStorage = {
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
  getCodeVerifier: () => string | null;
  getState: () => string | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  setCodeVerifier?: (verifier: string | null) => void;
  setState?: (state: string | null) => void;
  clearTokens: () => void;
};

export type DashNexAuthClientConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseUrl?: string;
  tokenStorage: TokenStorage
};

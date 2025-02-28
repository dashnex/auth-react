import { useAuth } from "./useAuth";
import { DashNexAuthProvider } from "./AuthContext";
import { useAuthLocalStorage } from "./storage";
import { LoginWithDashnexButton } from "./components/LoginWithDashnexButton";

export { useAuth, DashNexAuthProvider, useAuthLocalStorage, LoginWithDashnexButton };

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
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
};

export type DashNexAuthClientConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseUrl?: string;
  tokenStorage: TokenStorage
};

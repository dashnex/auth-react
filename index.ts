import { useAuth } from "./src/useAuth";
import { DashNexAuthProvider } from "./src/AuthContext";
import { useAuthLocalStorage } from "./src/storage/useAuthLocalStorage";
import { DashNexAuthClientConfig } from './src/DashNexOauthClient';
import { LoginWithDashnexButton } from "./src/components/LoginWithDashnexButton";

export { useAuth, DashNexAuthProvider, useAuthLocalStorage, LoginWithDashnexButton };

export type { DashNexAuthClientConfig };
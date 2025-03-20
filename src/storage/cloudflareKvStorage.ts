import type { TokenStorage } from '../index';

// Cloudflare Workers types
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface CloudflareKvStorageConfig {
  namespace: KVNamespace;
  prefix: string;
}

export const createCloudflareKvStorage = (config: CloudflareKvStorageConfig): TokenStorage => {
  const { namespace, prefix } = config;

  const getAccessToken = async () => {
    return await namespace.get(`${prefix}_access_token`);
  };

  const getRefreshToken = async () => {
    return await namespace.get(`${prefix}_refresh_token`);
  };

  const getCodeVerifier = async () => {
    return await namespace.get(`${prefix}_code_verifier`);
  };

  const getState = async () => {
    return await namespace.get(`${prefix}_state`);
  };

  const setAccessToken = async (token: string) => {
    await namespace.put(`${prefix}_access_token`, token);
  };

  const setRefreshToken = async (token: string) => {
    await namespace.put(`${prefix}_refresh_token`, token);
  };

  const setCodeVerifier = async (verifier: string | null) => {
    if (verifier) {
      await namespace.put(`${prefix}_code_verifier`, verifier);
    } else {
      await namespace.delete(`${prefix}_code_verifier`);
    }
  };

  const setTokens = async (access: string, refresh: string) => {
    await Promise.all([
      setAccessToken(access),
      setRefreshToken(refresh)
    ]);
  };

  const clearTokens = async () => {
    await Promise.all([
      namespace.delete(`${prefix}_access_token`),
      namespace.delete(`${prefix}_refresh_token`),
      namespace.delete(`${prefix}_code_verifier`),
      namespace.delete(`${prefix}_state`)
    ]);
  };

  const setState = async (state: string | null) => {
    if (state) {
      await namespace.put(`${prefix}_state`, state);
    } else {
      await namespace.delete(`${prefix}_state`);
    }
  };

  // Create a proxy to handle async getters
  const storage = new Proxy({}, {
    get: (target, prop) => {
      switch (prop) {
        case 'accessToken':
          return getAccessToken();
        case 'refreshToken':
          return getRefreshToken();
        case 'codeVerifier':
          return getCodeVerifier();
        case 'state':
          return getState();
        default:
          return target[prop as keyof typeof target];
      }
    }
  });

  // Add methods to the storage object
  Object.assign(storage, {
    setAccessToken,
    setRefreshToken,
    setTokens,
    clearTokens,
    setCodeVerifier,
    setState
  });

  return storage as TokenStorage;
}; 
import { useCallback, useMemo, useState } from 'react';
import { Buffer } from 'buffer';
import { createHash } from 'crypto';

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

export type ActivationStatus = {
  product: string;
  activationLimit: number;
  activatedCount: number;
  activations: {
    id: number;
    domain: string;
  }[];
};

export type TokenStorage = {
  accessToken: string | null;
  refreshToken: string | null;
  setTokens: (access: string, refresh: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
};

export type DashNexAuthConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseUrl?: string;
  tokenStorage: TokenStorage;
};

export const useDashNexAuth = (config: DashNexAuthConfig) => {
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);
  
  const {
    clientId,
    clientSecret,
    redirectUri,
    baseUrl = 'https://dashnex.com',
    tokenStorage
  } = config;

  const isAuthenticated = useMemo(() => {
    return !!tokenStorage.accessToken;
  }, [tokenStorage.accessToken]);

  const generateRandomState = useCallback((): string => {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }, []);

  const generateCodeVerifier = useCallback((): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }, []);

  const generateCodeChallenge = useCallback((verifier: string): string => {
    return createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }, []);

  const getAuthorizationUrl = useCallback((): string => {
    const state = generateRandomState();
    const params: Record<string, string> = {
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: '',
      state,
    };

    if (!clientSecret) {
      const newCodeVerifier = generateCodeVerifier();
      setCodeVerifier(newCodeVerifier);
      const codeChallenge = generateCodeChallenge(newCodeVerifier);
      params.code_challenge = codeChallenge;
      params.code_challenge_method = 'S256';
    }

    return `${baseUrl}/oauth/v2/auth?${new URLSearchParams(params).toString()}`;
  }, [clientId, clientSecret, redirectUri, baseUrl]);

  const request = useCallback(async (path: string, options: RequestInit = {}): Promise<any> => {
    const accessToken = tokenStorage.accessToken;

    if (!accessToken) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401 && tokenStorage.refreshToken) {
      await refreshAccessToken();
      return request(path, options);
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }, [baseUrl, tokenStorage]);

  const refreshAccessToken = useCallback(async (): Promise<void> => {
    const refreshToken = tokenStorage.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${baseUrl}/oauth/v2/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      tokenStorage.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    tokenStorage.setTokens(data.access_token, data.refresh_token);
  }, [baseUrl, clientId, clientSecret, tokenStorage]);

  const exchangeCodeForToken = useCallback(async (code: string): Promise<void> => {
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret!,
    };

    if (codeVerifier) {
      params.code_verifier = codeVerifier;
    }

    const url = `${baseUrl}/oauth/v2/token?${new URLSearchParams(params).toString()}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!clientSecret && !codeVerifier) {
      throw new Error(`Set code verifier or Client ID/Client Secret first.`);
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    tokenStorage.setTokens(data.access_token, data.refresh_token);
    setCodeVerifier(null);

    return data;
  }, [baseUrl, clientId, clientSecret, codeVerifier, redirectUri, tokenStorage]);

  const getCurrentUser = useCallback(async (): Promise<DashnexUser> => {
    return request('/api/oauth/v2/user');
  }, [request]);

  const getActivationStatus = useCallback(async (productCode: string): Promise<ActivationStatus> => {
    return request(`/api/oauth/v2/activations/${productCode}/status`);
  }, [request]);

  const activateDomain = useCallback(async (productCode: string, domain: string): Promise<{ id: number }> => {
    return request(`/api/oauth/v2/activations/${productCode}/activate`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }, [request]);

  const revokeActivation = useCallback(async (activationId: number): Promise<void> => {
    await request(`/api/oauth/v2/activations/${activationId}/revoke`, {
      method: 'DELETE',
    });
  }, [request]);

  const revokeActivationByDomain = useCallback(async (productCode: string, domain: string): Promise<{ id: number }> => {
    return request(`/api/oauth/v2/activations/${productCode}/domain/revoke`, {
      method: 'DELETE',
      body: JSON.stringify({ domain }),
    });
  }, [request]);

  const logout = useCallback(() => {
    return tokenStorage.clearTokens();
  }, [tokenStorage]);

  return {
    isAuthenticated,
    getAuthorizationUrl,
    exchangeCodeForToken,
    getCurrentUser,
    getActivationStatus,
    activateDomain,
    revokeActivation,
    revokeActivationByDomain,
    logout,
  };
}; 
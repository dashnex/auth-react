import { Buffer } from 'buffer';
import { createHash } from 'crypto-browserify';

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

export type DashNexAuthClientConfig = {
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  baseUrl?: string;
  tokenStorage: TokenStorage
};

export class DashNexOauthClient {
  private clientId: string;
  private clientSecret: string | null;
  private redirectUri: string;
  private baseUrl: string;
  private codeVerifier: string | null;
  private tokenStorage: TokenStorage;

  // private isAuthenticated: boolean;

  constructor(config: DashNexAuthClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret || null;
    this.redirectUri = config.redirectUri;
    this.baseUrl = config.baseUrl || 'https://dashnex.com';
    this.codeVerifier = null;
    this.tokenStorage = config.tokenStorage;

    // this.isAuthenticated = !!this.tokenStorage.accessToken;
  }

  get isAuthenticated() : boolean {
    return !!this.tokenStorage.accessToken;
  }

  // Generate authorization URL for OAuth flow
  getAuthorizationUrl(): string {
    const state = this.generateRandomState();
    const params: Record<string, string> = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: '',
      state,
    };

    if (!this.clientSecret) { // try PKCE
      this.codeVerifier = this.generateCodeVerifier();
      const codeChallenge = this.generateCodeChallenge(this.codeVerifier);
      params.code_challenge = codeChallenge;
      params.code_challenge_method = 'S256';
    }

    return `${this.baseUrl}/oauth/v2/auth?${new URLSearchParams(params).toString()}`;
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code: string): Promise<void> {
    const params: Record<string, string> = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      client_id: this.clientId,
      client_secret: this.clientSecret!,
    };

    if (this.codeVerifier) {  // PKCE flow
      params.code_verifier = this.codeVerifier;
    }

    let url = `${this.baseUrl}/oauth/v2/token?${new URLSearchParams(params).toString()}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.clientId && this.clientSecret) { // Normal flow
      // const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      // headers['Authorization'] = `Bearer ${credentials}`;
    } else if (!this.codeVerifier) { 
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
    this.tokenStorage.setTokens(data.access_token, data.refresh_token);
    this.codeVerifier = null; // Clear the code verifier after use
  }

  // Get current user information
  async getCurrentUser(): Promise<DashnexUser> {
    return this.request('/api/oauth/v2/user');
  }

  async logout() {
    return this.tokenStorage.clearTokens();
  }

  // Get activation status for a product
  async getActivationStatus(productCode: string): Promise<ActivationStatus> {
    return this.request(`/api/oauth/v2/activations/${productCode}/status`);
  }

  // Activate a domain for a product
  async activateDomain(productCode: string, domain: string): Promise<{ id: number }> {
    return this.request(`/api/oauth/v2/activations/${productCode}/activate`, {
      method: 'POST',
      body: JSON.stringify({ domain }),
    });
  }

  // Revoke activation by ID
  async revokeActivation(activationId: number): Promise<void> {
    await this.request(`/api/oauth/v2/activations/${activationId}/revoke`, {
      method: 'DELETE',
    });
  }

  // Revoke activation by domain
  async revokeActivationByDomain(productCode: string, domain: string): Promise<{ id: number }> {
    return this.request(`/api/oauth/v2/activations/${productCode}/domain/revoke`, {
      method: 'DELETE',
      body: JSON.stringify({ domain }),
    });
  }


  // Helper method for making authenticated requests
  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const accessToken = this.tokenStorage.accessToken;

    if (!accessToken) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401 && this.tokenStorage.refreshToken) {
      await this.refreshAccessToken();
      return this.request(path, options);
    }

    if (!response.ok) {
      throw new Error(`Request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Refresh access token using refresh token
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.tokenStorage.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }),
    });

    if (!response.ok) {
      this.tokenStorage.clearTokens();
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    this.tokenStorage.setTokens(data.access_token, data.refresh_token);
  }

  // Generate random state for OAuth flow
  private generateRandomState(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate random code verifier for PKCE
  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Buffer.from(array)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate code challenge from verifier
  private generateCodeChallenge(verifier: string): string {
    const hash = createHash('sha256')
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    return hash;
  }
} 
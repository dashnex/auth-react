import { Buffer } from 'buffer';
import { sha256 } from 'sha.js';
import type { TokenStorage, DashNexAuthClientConfig , DashnexUser } from './index';

export class DashNexOauthClient {
  private clientId: string;
  private clientSecret: string | null;
  private redirectUri: string;
  private baseUrl: string;
  private codeVerifier: string | null;
  private tokenStorage: TokenStorage;

  constructor(config: DashNexAuthClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret || null;
    this.redirectUri = config.redirectUri;
    this.baseUrl = config.baseUrl || 'https://dashnex.com';
    this.codeVerifier = null;
    this.tokenStorage = config.tokenStorage;
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
    // Generate 16 random bytes using custom random generation
    const bytes = new Uint8Array(16);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Generate random code verifier for PKCE
  private generateCodeVerifier(): string {
    // Generate 32 random bytes using custom random generation
    const array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    
    return Buffer.from(array)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  // Generate code challenge from verifier
  private generateCodeChallenge(verifier: string): string {

    const hash = new sha256()
      .update(verifier)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
      
    return hash;
  }
} 
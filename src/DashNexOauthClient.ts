import { Buffer } from 'buffer';
import { sha256 } from 'sha.js';
import type { TokenStorage, DashNexAuthClientConfig , DashnexUser } from './index';

// Utility function for cross-platform base64 encoding
function toBase64String(array: Uint8Array): string {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return btoa(String.fromCharCode(...Array.from(array)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  // Node.js environment
  return Buffer.from(array)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

export class DashNexOauthClient {
  private clientId: string;
  private clientSecret: string | null;
  private redirectUri: string;
  private baseUrl: string;
  private tokenStorage: TokenStorage;

  constructor(config: DashNexAuthClientConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret || null;
    this.redirectUri = config.redirectUri;
    this.baseUrl = config.baseUrl || 'https://dashnex.com';
    this.tokenStorage = config.tokenStorage;

    // // without these Next.js will not be able to bind context
    // this.getAuthorizationUrl = this.getAuthorizationUrl.bind(this);
    // this.exchangeCodeForToken = this.exchangeCodeForToken.bind(this);
    // this.getCurrentUser = this.getCurrentUser.bind(this);
    // this.logout = this.logout.bind(this);
  }

  async isAuthenticated(): Promise<boolean> {
    return !!(await this.tokenStorage.getAccessToken());
  }

  // Generate authorization URL for OAuth flow
  getAuthorizationUrl(scope: string = ''): string {
    // Generate 16 random bytes using custom random generation
    const state = Array(32).fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join('');

    const params: Record<string, string> = {
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope,
      state,
    };

    // Use PKCE if client secret is not provided AND token storage supports code verifier
    if (!this.clientSecret && this.tokenStorage.setCodeVerifier) {
      const codeVerifier = this.generateCodeVerifier();

      if (this.tokenStorage.setCodeVerifier) {  
        this.tokenStorage.setCodeVerifier(codeVerifier);
      } else {
        throw new Error('Token storage does not support code verifier');
      }

      const codeChallenge = this.generateCodeChallenge(codeVerifier);
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
    };

    // Only add client secret if provided
    if (this.clientSecret) {
      params.client_secret = this.clientSecret;
    }

    // Add code verifier if available in storage
    const storedCodeVerifier = await this.tokenStorage.getCodeVerifier();
    if (storedCodeVerifier) {
      params.code_verifier = storedCodeVerifier;
    }

    // Validate we have either client secret or code verifier
    if (!this.clientSecret && !storedCodeVerifier) {
      throw new Error('Either client secret or code verifier must be provided');
    }
    
    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'DNX'
      },
      body: new URLSearchParams(params).toString(),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.tokenStorage.setTokens(data.access_token, data.refresh_token);
    
    if (data.state && this.tokenStorage.setState) {
      const state = await this.tokenStorage.getState();
      if (state !== data.state) {
        throw new Error('State mismatch!');
      }
      this.tokenStorage.setState(null);
    }

    // Clear code verifier if storage supports it
    if (this.tokenStorage.setCodeVerifier) {
      this.tokenStorage.setCodeVerifier(null);
    }
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
    const accessToken = await this.tokenStorage.getAccessToken();

    if (!accessToken) {
      throw new Error('Not authenticated.');
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DNX',
        ...options.headers,
      },
    });

    if (response.status === 401) {
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
    const refreshToken = await this.tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${this.baseUrl}/oauth/v2/token`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DNX'
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

  // Generate random code verifier for PKCE
  private generateCodeVerifier(): string {
    // Generate 32 random bytes using custom random generation
    const array = new Uint8Array(32);
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    
    return toBase64String(array);
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
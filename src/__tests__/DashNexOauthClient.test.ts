/// <reference types="jest" />

import { DashNexOauthClient } from '../DashNexOauthClient';
import type { TokenStorage } from '../index';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock implementation of TokenStorage
class MockTokenStorage implements TokenStorage {
  private _accessToken: string | null = null;
  private _refreshToken: string | null = null;
  private _codeVerifier: string | null = null;
  private _state: string | null = null;

  get accessToken(): string | null {
    return this._accessToken;
  }

  get refreshToken(): string | null {
    return this._refreshToken;
  }

  get codeVerifier(): string | null {
    return this._codeVerifier;
  }

  get state(): string | null {
    return this._state;
  }

  setAccessToken(token: string): void {
    this._accessToken = token;
  }

  setRefreshToken(token: string): void {
    this._refreshToken = token;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this._accessToken = accessToken;
    this._refreshToken = refreshToken;
  }

  clearTokens(): void {
    this._accessToken = null;
    this._refreshToken = null;
  }

  setCodeVerifier(codeVerifier: string | null): void {
    this._codeVerifier = codeVerifier;
  }

  setState(state: string | null): void {
    this._state = state;
  }
}

describe('DashNexOauthClient', () => {
  let client: DashNexOauthClient;
  let mockTokenStorage: MockTokenStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTokenStorage = new MockTokenStorage();
    client = new DashNexOauthClient({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      baseUrl: 'https://test.dashnex.com',
      tokenStorage: mockTokenStorage,
    });
  });

  describe('constructor', () => {
    it('should initialize with provided configuration', () => {
      expect(client).toBeDefined();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when no access token is present', () => {
      expect(client.isAuthenticated).toBe(false);
    });

    it('should return true when access token is present', () => {
      mockTokenStorage.setTokens('test-access-token', 'test-refresh-token');
      expect(client.isAuthenticated).toBe(true);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('should generate authorization URL with client credentials', () => {
      const url = client.getAuthorizationUrl('test-scope');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback');
      expect(url).toContain('response_type=code');
      expect(url).toContain('scope=test-scope');
    });

    it('should include PKCE parameters when client secret is not provided', () => {
      const clientWithoutSecret = new DashNexOauthClient({
        clientId: 'test-client-id',
        redirectUri: 'http://localhost:3000/callback',
        tokenStorage: mockTokenStorage,
      });

      const url = clientWithoutSecret.getAuthorizationUrl();
      expect(url).toContain('code_challenge=');
      expect(url).toContain('code_challenge_method=S256');
    });
  });

  describe('exchangeCodeForToken', () => {
    it('should exchange code for tokens successfully', async () => {
      const mockResponse = {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      await client.exchangeCodeForToken('test-code');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.dashnex.com/oauth/v2/token',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        })
      );

      expect(mockTokenStorage.accessToken).toBe('new-access-token');
      expect(mockTokenStorage.refreshToken).toBe('new-refresh-token');
    });

    it('should throw error when token exchange fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Bad Request',
      });

      await expect(client.exchangeCodeForToken('test-code')).rejects.toThrow(
        'Token exchange failed: Bad Request'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user data', async () => {
      const mockUser = {
        id: 123,
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        referralHash: 'abc123',
        canImpersonate: false,
        licenses: [],
      };

      mockTokenStorage.setTokens('test-access-token', 'test-refresh-token');

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUser),
      });

      const user = await client.getCurrentUser();

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test.dashnex.com/api/oauth/v2/user',
        expect.objectContaining({
          headers: {
            'Authorization': 'Bearer test-access-token',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(user).toEqual(mockUser);
    });

    it('should throw error when not authenticated', async () => {
      await expect(client.getCurrentUser()).rejects.toThrow('Not authenticated.');
    });
  });

  describe('logout', () => {
    it('should clear tokens', async () => {
      mockTokenStorage.setTokens('test-access-token', 'test-refresh-token');
      await client.logout();
      expect(mockTokenStorage.accessToken).toBeNull();
      expect(mockTokenStorage.refreshToken).toBeNull();
    });
  });
}); 
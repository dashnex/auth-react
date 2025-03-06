import { DashNexOauthClient } from '../src/DashNexOauthClient';
import { createCloudflareKvStorage } from '../src/storage/cloudflareKvStorage';

// Cloudflare Workers types
interface KVNamespace {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export interface Env {
  DASHNEX_KV: KVNamespace;
  DASHNEX_CLIENT_ID: string;
  DASHNEX_CLIENT_SECRET: string;
  DASHNEX_REDIRECT_URI: string;
  DASHNEX_BASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize the OAuth client with Cloudflare KV storage
    const client = new DashNexOauthClient({
      clientId: env.DASHNEX_CLIENT_ID,
      clientSecret: env.DASHNEX_CLIENT_SECRET,
      redirectUri: env.DASHNEX_REDIRECT_URI,
      tokenStorage: createCloudflareKvStorage({
        namespace: env.DASHNEX_KV,
        prefix: 'dashnex_auth'
      })
    });

    // Handle login
    if (path === '/login') {
      return Response.redirect(client.getAuthorizationUrl());
    }

    // Handle callback
    if (path === '/callback') {
      const code = url.searchParams.get('code');
      if (!code) {
        return new Response('No code provided', { status: 400 });
      }

      try {
        await client.exchangeCodeForToken(code);
        return Response.redirect(new URL('/', request.url));
      } catch (error: any) {
        return new Response(`Authentication failed: ${error.message}`, { status: 500 });
      }
    }

    // Handle logout
    if (path === '/logout') {
      await client.logout();
      return Response.redirect(new URL('/', request.url));
    }

    // Check authentication status
    if (client.isAuthenticated) {
      try {
        const user = await client.getCurrentUser();
        return new Response(`
          <html>
            <body>
              <h1>Welcome, ${user.firstName}!</h1>
              <p>You are logged in.</p>
              <a href="/logout">Logout</a>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      } catch (error: any) {
        return new Response(`Failed to get user info: ${error.message}`, { status: 500 });
      }
    }

    // Show login page
    return new Response(`
      <html>
        <body>
          <h1>Welcome to DashNex OAuth Example</h1>
          <p>Please log in to continue.</p>
          <a href="/login">Login with DashNex</a>
        </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}; 
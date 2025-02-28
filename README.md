
# DashNex OAuth Client

A TypeScript OAuth 2.0 client implementation for DashNex authentication, supporting both standard OAuth flow and PKCE (Proof Key for Code Exchange).

## Features

- OAuth 2.0 Authorization Code Flow
- PKCE Support for Enhanced Security
- Token Storage Management
- TypeScript Support
- Configurable Base URL for testing

## Installation

```bash
npm install @dashnex.com/auth-react
yarn add @dashnex.com/auth-react
```

## Quick Start with JavaScript

```typescript
import { DashNexOauthClient } from '@dashnex.com/auth-react';

const client = new DashNexOauthClient({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret', // Optional for PKCE flow
  redirectUri: 'https://your-app.com/callback',
  baseUrl: 'https://dashnex.com', // Optional, defaults to https://dashnex.com
  tokenStorage: createAuthLocalStorage('your-app-name'), // use your own unique name
});

function startAuthentication() {
    window.location.href = client.getAuthorizationUrl();
}

function logout() {
    client.logout();
}

// if we are redirected back from DashNex with a code
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');

if (code) {
    await exchangeCodeForToken(code);
    window.history.replaceState({}, document.title, window.location.pathname);

    const user = await client.getCurrentUser();
    // Do something with the user

    // Check authentication status
    const isAuthenticated = client.isAuthenticated;
} 

```

## Quick Start with React

```typescript
import { useAuth, DashNexAuthProvider, DashNexAuthClientConfig, useAuthLocalStorage, LoginWithDashnexButton } from "@dashnex.com/auth-react";


export default function RootLayout() {

  const config: DashNexAuthClientConfig = {
    clientId: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_REDIRECT_URI!,
    baseUrl: process.env.NEXT_PUBLIC_DASHNEX_URI,
    tokenStorage: useAuthLocalStorage('your-app-name'), // use your own unique name
  };

  return (
    <html lang="en">
      <body>
        <DashNexAuthProvider config={config}>
          <Home/>
        </DashNexAuthProvider>
      </body>
    </html>
  );
}

export function Home() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading....</div>
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      {user ? (
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800">Welcome, {user.firstName}</h1>
          <a href="" onClick={logout}>Logout</a>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center">
          <LoginWithDashnexButton /> or <a onClick={login}>Login directly</a>
        </div>
      )}
    </main>
  );
}

```

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string | Yes | Your OAuth client ID |
| clientSecret | string | No | Your OAuth client secret (not required for PKCE flow) |
| redirectUri | string | Yes | Your application's callback URL |
| baseUrl | string | No | DashNex API base URL |
| tokenStorage | TokenStorage | Yes | Implementation for token storage |
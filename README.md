
# DashNex OAuth Client

A TypeScript OAuth 2.0 client implementation for DashNex authentication, supporting both standard OAuth flow and PKCE (Proof Key for Code Exchange).

## Features

- OAuth 2.0 Authorization Code Flow
- PKCE Support for Enhanced Security
- Token Storage Management
- TypeScript Support
- React Hooks and Components
- Configurable Base URL for testing
- Automatic Token Refresh

## Get OAuth Client credentials

1. Create a product on DashNex (Hosting app), create Variant: Access, Hosting app, 1
2. Go to Product Info -> OAuth clients, Create client. Set Redirect URI, choose Variant, Grant type: Authorization code

## Installation

```bash
npm install @dashnex.com/auth-react
# or
yarn add @dashnex.com/auth-react
```

## Usage with React

### Basic Setup

1. First, wrap your application with the `DashNexAuthProvider`:

```typescript
import { DashNexAuthProvider, useAuthLocalStorage } from "@dashnex.com/auth-react";

export default function App() {
  const config = {
    clientId: "your-client-id",
    redirectUri: "https://your-app.com/callback",
    baseUrl: "https://dashnex.com", // Optional, defaults to https://dashnex.com
    tokenStorage: useAuthLocalStorage("your-app-name"), // Use your own unique name
  };

  return (
    <DashNexAuthProvider config={config}>
      <YourApp />
    </DashNexAuthProvider>
  );
}
```

2. Use the `useAuth` hook in your components:

```typescript
import { useAuth, LoginWithDashnexButton } from "@dashnex.com/auth-react";

function LoginPage() {
  const { user, isLoading, login, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {user ? (
        <div>
          <h1>Welcome, {user.firstName}</h1>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <div>
          <LoginWithDashnexButton />
          {/* or */}
          <button onClick={login}>Login with DashNex</button>
        </div>
      )}
    </div>
  );
}
```

## Usage with Vanilla JavaScript

1. Include the library in your HTML:

```html
<script src="https://cdn.jsdelivr.net/npm/@dashnex.com/auth-react@latest/dist/browser.global.js"></script>
```

2. Initialize and use the client:

```javascript
const { DashNexOauthClient, createAuthLocalStorage } = DashNex;

// Initialize the client
const client = new DashNexOauthClient({
  clientId: "your-client-id",
  redirectUri: "https://your-app.com/callback",
  tokenStorage: createAuthLocalStorage("your-app-name"),
  baseUrl: "https://dashnex.com", // Optional
});

// Handle login
function startLogin() {
  window.location.href = client.getAuthorizationUrl();
}

// Handle logout
async function logout() {
  await client.logout();
}

// Handle the OAuth callback
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get("code");

if (code) {
  try {
    await client.exchangeCodeForToken(code);
    // Clean up the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Get user information
    const user = await client.getCurrentUser();
    console.log("Logged in user:", user);
  } catch (error) {
    console.error("Authentication error:", error);
  }
}
```

## Configuration Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| clientId | string | Yes | Your OAuth client ID |
| clientSecret | string | No | Your OAuth client secret (not required for PKCE flow) |
| redirectUri | string | Yes | Your application's callback URL |
| baseUrl | string | No | DashNex API base URL (defaults to https://dashnex.com) |
| tokenStorage | TokenStorage | Yes | Implementation for token storage |

## Token Storage

The library provides two token storage implementations:

1. `useAuthLocalStorage` - For React applications using localStorage
2. `createAuthLocalStorage` - For Vanilla JavaScript applications using localStorage

Both implementations handle:
- Access token storage
- Refresh token storage
- PKCE code verifier storage
- State parameter storage for security

## Development

```bash
npm run serve
# or
yarn serve
# or
bun run serve
```

Open `example.html` file and set up your OAuth client.

## Security Considerations

- The library supports PKCE (Proof Key for Code Exchange) for enhanced security
- All tokens are stored securely in localStorage with a unique prefix
- State parameters are used to prevent CSRF attacks
- Automatic token refresh is handled internally

## License

MIT License - See LICENSE file for details
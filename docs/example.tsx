'use client';

import { useAuth, DashNexAuthProvider, DashNexAuthClientConfig, useAuthLocalStorage, LoginWithDashnexButton } from "@dashnex.com/auth-react";


export default function RootLayout() {

  const config: DashNexAuthClientConfig = {
    clientId: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_CLIENT_ID!,
    clientSecret: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_CLIENT_SECRET!,
    redirectUri: process.env.NEXT_PUBLIC_DASHNEX_OAUTH_REDIRECT_URI!,
    baseUrl: process.env.NEXT_PUBLIC_DASHNEX_URI,
    tokenStorage: useAuthLocalStorage(),
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



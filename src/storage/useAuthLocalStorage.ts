'use client';

import { useLocalStorage } from '@dashnex/hooks';

export const useAuthLocalStorage = () => {
  const [accessToken, setAccessToken, removeAccessToken] = useLocalStorage<string | null>(
    'dashnex_access_token',
    null
  );
  const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage<string | null>(
    'dashnex_refresh_token',
    null
  );

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  const clearTokens = () => {
    removeAccessToken();
    removeRefreshToken();
  };

  return {
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    setTokens,
    clearTokens,
  };
}; 
'use client';

import { useLocalStorage } from 'usehooks-ts';

export const useAuthLocalStorage = (prefix: string) => {
  const [accessToken, setAccessToken, removeAccessToken] = useLocalStorage<string | null>(
    `${prefix}_access_token`,
    null
  );
  const [refreshToken, setRefreshToken, removeRefreshToken] = useLocalStorage<string | null>(
    `${prefix}_refresh_token`,
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
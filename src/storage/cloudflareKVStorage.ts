'use client';

import { KVNamespace } from '@cloudflare/workers-types';

export const createAuthKVStorage = (namespace: KVNamespace, prefix: string) => {
  const getAccessToken = async () => {
    return namespace.get(`${prefix}_access_token`);
  };

  const getRefreshToken = async () => {
    return namespace.get(`${prefix}_refresh_token`);
  };

  const setAccessToken = async (token: string) => {
    await namespace.put(`${prefix}_access_token`, token);
  };

  const setRefreshToken = async (token: string) => {
    await namespace.put(`${prefix}_refresh_token`, token);
  };

  const setTokens = async (access: string, refresh: string) => {
    await Promise.all([
      setAccessToken(access),
      setRefreshToken(refresh)
    ]);
  };

  const clearTokens = async () => {
    await Promise.all([
      namespace.delete(`${prefix}_access_token`),
      namespace.delete(`${prefix}_refresh_token`)
    ]);
  };

  return {
    getAccessToken,
    getRefreshToken,
    setAccessToken,
    setRefreshToken, 
    setTokens,
    clearTokens
  };
};
import { useMemo, useState } from 'react';
import type { DashNexAuthClientConfig  } from '..';
import { DashNexOauthClient } from './DashNexOauthClient';

export const useDashNexAuth = (config: DashNexAuthClientConfig) => {

  const {
    isAuthenticated,
    getAuthorizationUrl,
    exchangeCodeForToken,
    getCurrentUser,
    logout,
  } = useMemo(() => {
    return new DashNexOauthClient(config);
  }, [config]);
  
  return {
    isAuthenticated,
    getAuthorizationUrl,
    exchangeCodeForToken,
    getCurrentUser,
    logout,
  };
}; 
import { useMemo } from 'react';
import { type DashNexAuthClientConfig, DashNexOauthClient  } from './index';

export const useDashNexClient = (config: DashNexAuthClientConfig) => {

  const client = useMemo(() => {
    return new DashNexOauthClient(config);
  }, [config]);
  
  return { client };
}; 
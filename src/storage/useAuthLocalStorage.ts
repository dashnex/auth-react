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

  const [codeVerifier, setCodeVerifier, removeCodeVerifier] = useLocalStorage<string | null>(`${prefix}_code_verifier`, null)
  const [state, setState, removeState] = useLocalStorage<string | null>(`${prefix}_state`, null)

  const setTokens = (access: string, refresh: string) => {
    setAccessToken(access);
    setRefreshToken(refresh);
  };

  const clearTokens = () => {
    removeAccessToken();
    removeRefreshToken();
    removeCodeVerifier();
    removeState();
  };

  return {
    accessToken,
    refreshToken,
    setAccessToken,
    setRefreshToken,
    setTokens,
    clearTokens,
    codeVerifier,
    setCodeVerifier: (verifier: string | null) => {
      if (verifier) {
        setCodeVerifier(verifier);
      } else {
        removeCodeVerifier();
      }
    },
    state,
    setState: (state: string | null) => {
      if (state) {
        setState(state);
      } else {
        removeState();
      }
    }
  };
}; 
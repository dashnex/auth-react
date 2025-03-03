const createAuthLocalStorage = (prefix: string) => {
    const getAccessToken = () => localStorage.getItem(`${prefix}_access_token`);
    const getRefreshToken = () => localStorage.getItem(`${prefix}_refresh_token`);
    const getCodeVerifier = () => localStorage.getItem(`${prefix}_code_verifier`);
    const getState = () => localStorage.getItem(`${prefix}_state`);
    
    const setAccessToken = (token: string) => {
        localStorage.setItem(`${prefix}_access_token`, token);
    };

    const setRefreshToken = (token: string) => {
        localStorage.setItem(`${prefix}_refresh_token`, token);
    };

    const setCodeVerifier = (verifier: string | null) => {
        if (verifier) {
            localStorage.setItem(`${prefix}_code_verifier`, verifier);
        } else {
            localStorage.removeItem(`${prefix}_code_verifier`);
        }
    };

    const setTokens = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
    };

    const clearTokens = () => {
        localStorage.removeItem(`${prefix}_access_token`);
        localStorage.removeItem(`${prefix}_refresh_token`);
        localStorage.removeItem(`${prefix}_code_verifier`);
        localStorage.removeItem(`${prefix}_state`);
    };

    // Base storage object
    const storage: any = {
        get accessToken() { return getAccessToken(); },
        get refreshToken() { return getRefreshToken() },
        get codeVerifier() { return getCodeVerifier() },
        get state() { return getState() },
        setCodeVerifier,
        setAccessToken,
        setRefreshToken,
        setTokens,
        clearTokens,
    };

    storage.setCodeVerifier = (verifier: string | null) => {
        if (verifier) {
            localStorage.setItem(`${prefix}_code_verifier`, verifier);
        } else {
            localStorage.removeItem(`${prefix}_code_verifier`);
        }
    };

    storage.setState = (state: string | null) => {
        if (state) {
            localStorage.setItem(`${prefix}_state`, state);
        } else {
            localStorage.removeItem(`${prefix}_state`);
        }
    };

    return storage;
};
  
export {
    createAuthLocalStorage
};
  
const createAuthLocalStorage = (prefix: string) => {
    const getAccessToken = () => localStorage.getItem(`${prefix}_access_token`);
    const getRefreshToken = () => localStorage.getItem(`${prefix}_refresh_token`);

    const setAccessToken = (token: string) => {
        localStorage.setItem(`${prefix}_access_token`, token);
    };

    const setRefreshToken = (token: string) => {
        localStorage.setItem(`${prefix}_refresh_token`, token);
    };

    const setTokens = (access: string, refresh: string) => {
        setAccessToken(access);
        setRefreshToken(refresh);
    };

    const clearTokens = () => {
        localStorage.removeItem(`${prefix}_access_token`);
        localStorage.removeItem(`${prefix}_refresh_token`);
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
  
export {
    createAuthLocalStorage
};
  
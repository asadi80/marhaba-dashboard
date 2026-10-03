
// src/utils/auth.js

export const TOKEN_KEYS = {
  ACCESS_TOKEN: "authToken",
  REFRESH_TOKEN: "refreshToken",
  USER: "user",
  USER_TYPE: "userType",
  USER_ID: "userId",
  TOKEN_EXPIRY: "tokenExpiry",
};

// Backend API URL
const API_URL =
  import.meta.env.VITE_API_URL || "https://api.mar-haba.ly";

// ---------------------------------------------------------
// SAVE TOKENS
// ---------------------------------------------------------

export const saveTokens = (tokens = {}) => {
  console.log("💾 Saving tokens");

  const accessToken =
    tokens.accessToken ||
    tokens.access_token;

  const refreshToken =
    tokens.refreshToken ||
    tokens.refresh_token;

  const expiresIn =
    tokens.expiresIn ??
    tokens.expires_in;

  if (accessToken) {
    localStorage.setItem(
      TOKEN_KEYS.ACCESS_TOKEN,
      accessToken
    );
  }

  if (refreshToken) {
    localStorage.setItem(
      TOKEN_KEYS.REFRESH_TOKEN,
      refreshToken
    );
  }

  // Save access-token expiration time.
  //
  // IMPORTANT:
  // This expiration belongs ONLY to the access token.
  // We NEVER delete the refresh token just because this expires.
  if (expiresIn !== undefined && expiresIn !== null) {
    const expiryTime =
      Date.now() + Number(expiresIn) * 1000;

    localStorage.setItem(
      TOKEN_KEYS.TOKEN_EXPIRY,
      expiryTime.toString()
    );
  }
};

// ---------------------------------------------------------
// SAVE USER
// ---------------------------------------------------------

export const saveUser = (user) => {
  if (!user) return;

  console.log("💾 Saving user:", user);

  localStorage.setItem(
    TOKEN_KEYS.USER,
    JSON.stringify(user)
  );

  if (user.role) {
    localStorage.setItem(
      TOKEN_KEYS.USER_TYPE,
      user.role
    );
  }

  if (user.id) {
    localStorage.setItem(
      TOKEN_KEYS.USER_ID,
      user.id
    );
  }
};

// ---------------------------------------------------------
// GET TOKENS
// ---------------------------------------------------------

export const getAccessToken = () => {
  return localStorage.getItem(
    TOKEN_KEYS.ACCESS_TOKEN
  );
};

export const getRefreshToken = () => {
  return localStorage.getItem(
    TOKEN_KEYS.REFRESH_TOKEN
  );
};

export const getUser = () => {
  const user = localStorage.getItem(
    TOKEN_KEYS.USER
  );

  if (!user) return null;

  try {
    return JSON.parse(user);
  } catch (error) {
    console.error(
      "❌ Invalid stored user data:",
      error
    );

    localStorage.removeItem(TOKEN_KEYS.USER);

    return null;
  }
};

// ---------------------------------------------------------
// ACCESS TOKEN EXPIRY
// ---------------------------------------------------------

export const isTokenExpired = () => {
  const expiry = localStorage.getItem(
    TOKEN_KEYS.TOKEN_EXPIRY
  );

  if (!expiry) {
    // We don't know the expiry.
    // Do NOT automatically destroy the session.
    return false;
  }

  return Date.now() >= Number(expiry);
};

// ---------------------------------------------------------
// CLEAR AUTH DATA
// ---------------------------------------------------------

export const clearAuthData = () => {
  console.log("🧹 Clearing authentication data");

  Object.values(TOKEN_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  sessionStorage.clear();
};

// ---------------------------------------------------------
// CLEAR ONLY ACCESS TOKEN
// ---------------------------------------------------------
//
// Useful when access token expires but refresh token
// is still available.
//

export const clearAccessToken = () => {
  localStorage.removeItem(
    TOKEN_KEYS.ACCESS_TOKEN
  );

  localStorage.removeItem(
    TOKEN_KEYS.TOKEN_EXPIRY
  );
};

// ---------------------------------------------------------
// BUILD API URL
// ---------------------------------------------------------

const buildApiUrl = (url) => {
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  return `${API_URL}${
    url.startsWith("/") ? url : `/${url}`
  }`;
};

// ---------------------------------------------------------
// REFRESH ACCESS TOKEN
// ---------------------------------------------------------

let refreshPromise = null;

export const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    console.warn(
      "⚠️ No refresh token available"
    );

    return null;
  }

  // Prevent multiple simultaneous refresh requests.
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      console.log(
        "🔄 Refreshing access token..."
      );

      const refreshResponse = await fetch(
        `${API_URL}/api/v1/auth/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // IMPORTANT:
            // Backend expects refresh_token
            refresh_token: refreshToken,
          }),
        }
      );

      if (!refreshResponse.ok) {
        console.error(
          "❌ Refresh request failed:",
          refreshResponse.status
        );

        return null;
      }

      const data =
        await refreshResponse.json();

      console.log(
        "🔄 Refresh response received"
      );

      // Support both possible response shapes:
      //
      // { data: { tokens: {...} } }
      //
      // OR
      //
      // { tokens: {...} }

      const tokens =
        data?.data?.tokens ||
        data?.tokens;

      if (!tokens?.accessToken &&
          !tokens?.access_token) {
        console.error(
          "❌ Refresh response did not contain an access token"
        );

        return null;
      }

      saveTokens(tokens);

      console.log(
        "✅ Access token refreshed successfully"
      );

      return (
        tokens.accessToken ||
        tokens.access_token
      );
    } catch (error) {
      console.error(
        "❌ Token refresh error:",
        error
      );

      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// ---------------------------------------------------------
// CHECK AUTH
// ---------------------------------------------------------
//
// IMPORTANT:
// This does NOT delete auth data when the access token
// expires.
//
// The refresh token may still be valid.
//

export const checkAuth = async () => {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();

  // Nothing at all
  if (!accessToken && !refreshToken) {
    return false;
  }

  // Access token is still valid
  if (accessToken && !isTokenExpired()) {
    return true;
  }

  // Access token expired, but refresh token exists.
  if (refreshToken) {
    const newAccessToken =
      await refreshAccessToken();

    if (newAccessToken) {
      return true;
    }
  }

  // Only clear everything if the refresh token
  // is actually unusable.
  clearAuthData();

  return false;
};

// ---------------------------------------------------------
// AUTH FETCH
// ---------------------------------------------------------

export const authFetch = async (
  url,
  options = {}
) => {
  const requestUrl = buildApiUrl(url);

  let token = getAccessToken();

  const makeRequest = async (
    accessToken
  ) => {
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (accessToken) {
      headers.Authorization =
        `Bearer ${accessToken}`;
    }

    console.log(
      "🌐 API Request:",
      requestUrl
    );

    return fetch(requestUrl, {
      ...options,
      headers,
    });
  };

  // -------------------------------------------------------
  // BEFORE REQUEST
  // -------------------------------------------------------
  //
  // If access token is expired, refresh it BEFORE
  // sending the request.
  //

  if (
    token &&
    isTokenExpired()
  ) {
    console.log(
      "⏰ Access token expired. Refreshing..."
    );

    const newToken =
      await refreshAccessToken();

    if (newToken) {
      token = newToken;
    }
  }

  // -------------------------------------------------------
  // FIRST REQUEST
  // -------------------------------------------------------

  let response =
    await makeRequest(token);

  // -------------------------------------------------------
  // 401 → REFRESH → RETRY
  // -------------------------------------------------------

  if (response.status === 401) {
    console.log(
      "⚠️ API returned 401. Trying token refresh..."
    );

    const newToken =
      await refreshAccessToken();

    if (newToken) {
      token = newToken;

      console.log(
        "🔁 Retrying original request..."
      );

      response =
        await makeRequest(token);
    }
  }

  // -------------------------------------------------------
  // REFRESH FAILED
  // -------------------------------------------------------

  if (
    response.status === 401
  ) {
    console.warn(
      "❌ Authentication failed. Refresh token is no longer valid."
    );

    clearAuthData();

    if (
      window.location.pathname !==
      "/login"
    ) {
      window.location.href =
        "/login";
    }
  }

  return response;
};


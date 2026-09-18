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

// Save tokens
export const saveTokens = (tokens) => {
  console.log("💾 Saving tokens:", tokens);

  if (tokens.accessToken) {
    localStorage.setItem(
      TOKEN_KEYS.ACCESS_TOKEN,
      tokens.accessToken
    );
  }

  if (tokens.refreshToken) {
    localStorage.setItem(
      TOKEN_KEYS.REFRESH_TOKEN,
      tokens.refreshToken
    );
  }

  if (tokens.expiresIn) {
    const expiryTime =
      Date.now() + tokens.expiresIn * 1000;

    localStorage.setItem(
      TOKEN_KEYS.TOKEN_EXPIRY,
      expiryTime.toString()
    );
  }
};

// Save user data
export const saveUser = (user) => {
  console.log("💾 Saving user:", user);

  localStorage.setItem(
    TOKEN_KEYS.USER,
    JSON.stringify(user)
  );

  localStorage.setItem(
    TOKEN_KEYS.USER_TYPE,
    user.role
  );

  localStorage.setItem(
    TOKEN_KEYS.USER_ID,
    user.id
  );
};

// Get tokens
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

  return user ? JSON.parse(user) : null;
};

// Check if token is expired
export const isTokenExpired = () => {
  const expiry = localStorage.getItem(
    TOKEN_KEYS.TOKEN_EXPIRY
  );

  if (!expiry) return true;

  return Date.now() > parseInt(expiry);
};

// Clear all auth data
export const clearAuthData = () => {
  Object.values(TOKEN_KEYS).forEach((key) => {
    localStorage.removeItem(key);
  });

  sessionStorage.clear();
};

// Auto-logout if token expired
export const checkAuth = () => {
  const token = getAccessToken();

  if (!token || isTokenExpired()) {
    clearAuthData();
    return false;
  }

  return true;
};

// Convert relative API URL to backend URL
const buildApiUrl = (url) => {
  // Already an absolute URL
  if (
    url.startsWith("http://") ||
    url.startsWith("https://")
  ) {
    return url;
  }

  // Relative API URL
  return `${API_URL}${url.startsWith("/") ? url : `/${url}`}`;
};

// Auth fetch wrapper
export const authFetch = async (url, options = {}) => {
  const token = getAccessToken();

  // IMPORTANT:
  // Convert /api/v1/... into https://api.mar-haba.ly/api/v1/...
  const requestUrl = buildApiUrl(url);

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log("🌐 API Request:", requestUrl);

  let response = await fetch(requestUrl, {
    ...options,
    headers,
  });

  // If unauthorized, try to refresh token
  if (response.status === 401) {
    const refreshToken = getRefreshToken();

    if (refreshToken) {
      try {
        const refreshResponse = await fetch(
          `${API_URL}/api/v1/auth/refresh`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              refreshToken,
            }),
          }
        );

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();

          if (data.data?.tokens?.accessToken) {
            // Save new token
            saveTokens(data.data.tokens);

            // Update authorization header
            headers["Authorization"] =
              `Bearer ${data.data.tokens.accessToken}`;

            // Retry original request
            response = await fetch(requestUrl, {
              ...options,
              headers,
            });
          }
        } else {
          clearAuthData();

          window.location.href = "/login";

          throw new Error(
            "Session expired. Please login again."
          );
        }
      } catch (error) {
        clearAuthData();

        window.location.href = "/login";

        throw error;
      }
    } else {
      clearAuthData();

      window.location.href = "/login";

      throw new Error(
        "Please login to continue."
      );
    }
  }

  return response;
};
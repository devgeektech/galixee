"use client";

/**
 * Token Manager Utility
 * Handles storing, retrieving, and managing JWT/Session tokens
 * Especially for WebView access via URL parameters
 */

const TOKEN_KEY = "galixee_auth_token";
const TOKEN_TYPE_KEY = "galixee_token_type";
const USER_KEY = "galixee_user";
const TOKEN_EXPIRES_KEY = "galixee_token_expires";

/**
 * Store token locally
 */
export function storeToken(token, tokenType = "jwt", user = null, expiresAt = null) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(TOKEN_TYPE_KEY, tokenType);
    
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    
    if (expiresAt) {
      localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt);
    }

    console.log(`✅ Token stored (${tokenType})`);
  } catch (error) {
    console.error("Failed to store token:", error);
  }
}

/**
 * Retrieve stored token
 */
export function getToken() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error("Failed to retrieve token:", error);
    return null;
  }
}

/**
 * Retrieve token type
 */
export function getTokenType() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_TYPE_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Retrieve stored user from token
 */
export function getStoredUser() {
  if (typeof window === "undefined") return null;

  try {
    const userJson = localStorage.getItem(USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error("Failed to retrieve user:", error);
    return null;
  }
}

/**
 * Get token expiry time
 */
export function getTokenExpiry() {
  if (typeof window === "undefined") return null;

  try {
    return localStorage.getItem(TOKEN_EXPIRES_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is still valid (not expired)
 */
export function isTokenValid() {
  const token = getToken();
  if (!token) return false;

  const expiresAt = getTokenExpiry();
  if (!expiresAt) return true; // Assume valid if no expiry set

  try {
    const now = new Date();
    const expiry = new Date(expiresAt);
    return now < expiry;
  } catch (error) {
    return true; // Assume valid if parsing fails
  }
}

/**
 * Clear all stored tokens and user data
 */
export function clearToken() {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_EXPIRES_KEY);
    // Also clear old session token keys for backwards compatibility
    localStorage.removeItem("galixee_session_token");
    localStorage.removeItem("galixee_user");
    console.log("✅ Token cleared");
  } catch (error) {
    console.error("Failed to clear token:", error);
  }
}

/**
 * Get Authorization header value for API requests
 */
export function getAuthHeader() {
  const token = getToken();
  if (!token) return null;

  return `Bearer ${token}`;
}

/**
 * Add Authorization header to fetch options
 */
export function addAuthToFetch(options = {}) {
  const authHeader = getAuthHeader();
  
  if (!authHeader) {
    return options;
  }

  return {
    ...options,
    headers: {
      ...options.headers,
      "Authorization": authHeader,
    },
  };
}

/**
 * Authenticated fetch wrapper
 * Automatically adds Authorization header
 */
export async function authenticatedFetch(url, options = {}) {
  const fetchOptions = addAuthToFetch(options);
  
  const response = await fetch(url, fetchOptions);

  // If token expired (401), clear it
  if (response.status === 401) {
    console.warn("Token expired or invalid, clearing token");
    clearToken();
  }

  return response;
}

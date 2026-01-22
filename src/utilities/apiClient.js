/**
 * Client-side utility for making authenticated API requests
 * Automatically includes session token from localStorage in headers
 */
export async function authenticatedFetch(url, options = {}) {
  // Get session token from localStorage (set during signin)
  const sessionToken = typeof window !== "undefined" 
    ? localStorage.getItem("galixee_session_token") 
    : null;

  // Merge headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add session token to Authorization header if available
  if (sessionToken) {
    headers["Authorization"] = `Bearer ${sessionToken}`;
  }

  // Include credentials to send cookies (if any)
  const fetchOptions = {
    ...options,
    headers,
    credentials: "include",
  };

  return fetch(url, fetchOptions);
}

/**
 * Get session token from localStorage
 */
export function getSessionToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("galixee_session_token");
}

/**
 * Get full session data from localStorage
 */
export function getSessionData() {
  if (typeof window === "undefined") return null;
  
  const sessionStr = localStorage.getItem("galixee_session");
  if (!sessionStr) return null;
  
  try {
    return JSON.parse(sessionStr);
  } catch (error) {
    console.error("Failed to parse session data:", error);
    return null;
  }
}

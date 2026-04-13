"use client";

/**
 * Client-side logout handler
 * Clears local storage and redirects to login
 */
export async function logout() {
  try {
    // Clear local storage
    if (typeof window !== "undefined") {
      localStorage.removeItem("galixee_session_token");
      localStorage.removeItem("galixee_user");
      sessionStorage.clear();
    }

    // Call logout API
    const response = await fetch("/account/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Redirect to login regardless of response
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    // Still redirect even if there's an error
    if (typeof window !== "undefined") {
      window.location.href = "/account/signin";
    }
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  const sessionToken = localStorage.getItem("galixee_session_token");
  return !!sessionToken;
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const userJson = localStorage.getItem("galixee_user");
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Get session token from localStorage
 */
export function getSessionToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("galixee_session_token");
}

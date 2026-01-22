"use client";
import React, { useState } from "react";

function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const signInWithCredentials = async ({
    email,
    password,
    callbackUrl = "/",
    redirect = true,
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/signin-with-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 401) {
          throw new Error("Invalid email or password");
        }
        if (response.status === 429) {
          throw new Error("Too many attempts. Please try again later.");
        }
        throw new Error(errorData.error || "Sign in failed");
      }

      const result = await response.json();

      if (result.success && redirect) {
        window.location.href = callbackUrl;
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithCredentials = async ({
    email,
    password,
    callbackUrl = "/",
    redirect = true,
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/credentials-auth-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "signup",
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          throw new Error("An account with this email already exists");
        }
        if (response.status === 400) {
          throw new Error("Invalid email or password format");
        }
        throw new Error(errorData.error || "Sign up failed");
      }

      const result = await response.json();

      if (result.success && redirect) {
        window.location.href = callbackUrl;
      }

      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async ({
    callbackUrl = "/account/logout",
    redirect = true,
  } = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/session-persistence-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "logout",
        }),
      });

      if (!response.ok) {
        console.warn(
          "Logout request failed, but continuing with local cleanup",
        );
      }

      if (typeof window !== "undefined") {
        localStorage.removeItem("galixee_session");
        localStorage.removeItem("galixee_session_token");
        localStorage.removeItem("galixee_user");
        localStorage.removeItem("user_data");
      }

      if (redirect) {
        window.location.href = callbackUrl;
      }

      return { success: true };
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err.message);

      if (typeof window !== "undefined") {
        localStorage.removeItem("galixee_session");
        localStorage.removeItem("galixee_session_token");
        localStorage.removeItem("galixee_user");
        localStorage.removeItem("user_data");
      }

      if (redirect) {
        window.location.href = callbackUrl;
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    signInWithCredentials,
    signUpWithCredentials,
    signOut,
    loading,
    error,
    clearError,
  };
}

// Export as both named and default export for compatibility
export { useAuth };
export default useAuth;


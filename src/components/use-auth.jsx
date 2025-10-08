"use client";
import React from "react";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Added for redirection
import useAuth from "../components/use-auth"; // Adjust the path as needed


export default function Index() {
  return (function useAuth() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

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

      // Clear local storage
      if (typeof window !== "undefined") {
        localStorage.removeItem("galixee_session");
        localStorage.removeItem("user_data");
      }

      if (redirect) {
        window.location.href = callbackUrl;
      }

      return { success: true };
    } catch (err) {
      console.error("Sign out error:", err);
      setError(err.message);

      // Still clear local storage even if server request fails
      if (typeof window !== "undefined") {
        localStorage.removeItem("galixee_session");
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

function MainComponent({ variant = "default", showDemo = false }) {
  const {
    signInWithCredentials,
    signUpWithCredentials,
    signOut,
    loading,
    error,
    clearError,
  } = useAuth();
  const [formData, setFormData] = React.useState({ email: "", password: "" });
  const [actionType, setActionType] = React.useState("signin");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (actionType === "signin") {
        await signInWithCredentials({
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
      } else {
        await signUpWithCredentials({
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
      }

      setFormData({ email: "", password: "" });
    } catch (err) {
      console.error("Auth error:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  if (variant === "minimal") {
    return (
      <div className="inline-flex items-center space-x-2">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            loading
              ? "bg-blue-900/20 border border-blue-500/50 text-blue-400"
              : error
                ? "bg-red-900/20 border border-red-500/50 text-red-400"
                : "bg-green-900/20 border border-green-500/50 text-green-400"
          }`}
        >
          <i
            className={`fas ${loading ? "fa-spinner fa-spin" : error ? "fa-exclamation-triangle" : "fa-shield-check"} mr-1`}
          ></i>
          {loading ? "Processing..." : error ? "Error" : "Ready"}
        </div>
      </div>
    );
  }

  if (variant === "status") {
    return (
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
        <h3 className="text-lg font-medium text-white mb-4 flex items-center">
          <i className="fas fa-key text-[#6366F1] mr-2"></i>
          Auth Status
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Loading:</span>
            <span className={loading ? "text-yellow-400" : "text-green-400"}>
              {loading.toString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-400">Error:</span>
            <span className={error ? "text-red-400" : "text-green-400"}>
              {error || "none"}
            </span>
          </div>

          {error && (
            <button
              onClick={clearError}
              className="text-[#6366F1] hover:text-[#4F46E5] text-sm"
            >
              <i className="fas fa-times mr-1"></i>
              Clear Error
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-6 w-full max-w-md">
      <h3 className="text-xl font-medium text-white mb-6 flex items-center">
        <i className="fas fa-user-shield text-[#6366F1] mr-2"></i>
        Authentication
      </h3>

      {showDemo && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="flex bg-[#242424] rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActionType("signin")}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                actionType === "signin"
                  ? "bg-[#6366F1] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setActionType("signup")}
              className={`flex-1 py-2 px-4 rounded text-sm font-medium transition-colors ${
                actionType === "signup"
                  ? "bg-[#6366F1] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-4 py-3 bg-[#242424] border border-[#333333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#6366F1]"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full px-4 py-3 bg-[#242424] border border-[#333333] rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#6366F1]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-lg text-white font-medium transition-colors"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Processing...
              </>
            ) : actionType === "signin" ? (
              "Sign In"
            ) : (
              "Sign Up"
            )}
          </button>
        </form>
      )}

      <div className="space-y-3">
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="w-full bg-[#FF6B6B] hover:bg-[#FF5252] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-white font-medium transition-colors"
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              Signing Out...
            </>
          ) : (
            <>
              <i className="fas fa-sign-out-alt mr-2"></i>
              Sign Out
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-red-400 text-sm">{error}</span>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-300"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-[#333333]">
        <h4 className="text-sm font-medium text-gray-400 mb-2">
          Available Methods
        </h4>
        <div className="grid grid-cols-1 gap-2 text-xs">
          <div className="text-gray-500">
            • signInWithCredentials(email, password)
          </div>
          <div className="text-gray-500">
            • signUpWithCredentials(email, password)
          </div>
          <div className="text-gray-500">• signOut()</div>
        </div>
      </div>
    </div>
  );
}





function StoryComponent() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto p-8 space-y-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          useAuth Hook Variants
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">
              Default Component
            </h2>
            <MainComponent />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">With Demo Form</h2>
            <MainComponent showDemo={true} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">Status Variant</h2>
            <MainComponent variant="status" />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">Minimal Variant</h2>
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
              <MainComponent variant="minimal" />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Hook Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="text-[#6366F1] font-medium">
                Authentication Methods
              </h3>
              <ul className="text-gray-400 space-y-1">
                <li>• signInWithCredentials - Email/password sign in</li>
                <li>• signUpWithCredentials - Account creation</li>
                <li>• signOut - Session termination</li>
                <li>• clearError - Error state management</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-[#4FD1C5] font-medium">State Management</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• loading - Request state tracking</li>
                <li>• error - Error message handling</li>
                <li>• Automatic session cleanup</li>
                <li>• Flexible redirect options</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#242424] p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Usage Example</h3>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            {`const { signInWithCredentials, signOut, loading, error } = useAuth();

const handleSignIn = async () => {
  try {
    await signInWithCredentials({
      email: "user@example.com",
      password: "password123",
      callbackUrl: "/dashboard",
      redirect: true
    });
  } catch (err) {
    console.error("Sign in failed:", err);
  }
};`}
          </pre>
        </div>
      </div>
    </div>
  );
});
}
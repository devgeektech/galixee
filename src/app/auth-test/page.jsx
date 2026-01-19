"use client";
export const dynamic = 'force-dynamic';

import React, { useState } from "react";

import { useUser } from "../../components/use-user";
import { useAuth } from "../../components/use-auth";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const { signInWithCredentials, signOut } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState(null);

  const handleTestSignIn = async () => {
    setIsSigningIn(true);
    setError(null);

    try {
      await signInWithCredentials({
        email: "test@example.com",
        password: "password123",
        callbackUrl: "/auth-test",
        redirect: false,
      });
    } catch (err) {
      setError(err.message || "Failed to sign in");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setError(null);

    try {
      await signOut({
        callbackUrl: "/auth-test",
        redirect: false,
      });
    } catch (err) {
      setError(err.message || "Failed to sign out");
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-6">
          <a
            href="/welcome"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Back to Welcome
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          Authentication Test
        </h1>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Authentication Status */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1] flex items-center">
              <i className="fas fa-user-shield mr-2"></i>
              Authentication Status
            </h2>

            {userLoading ? (
              <div className="flex items-center justify-center py-12">
                <i className="fas fa-spinner fa-spin text-2xl text-[#6366F1] mr-3"></i>
                <span className="text-gray-400">Loading user data...</span>
              </div>
            ) : user ? (
              <div className="space-y-4">
                <div className="flex items-center mb-6">
                  <i className="fas fa-check-circle text-green-400 text-2xl mr-3"></i>
                  <span className="text-lg text-green-400 font-medium">
                    Authenticated
                  </span>
                </div>

                <div className="bg-[#242424] p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">User ID:</span>
                    <span className="text-white font-mono">{user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{user.email}</span>
                  </div>
                  {user.name && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Name:</span>
                      <span className="text-white">{user.name}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400">Session:</span>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center mb-6">
                  <i className="fas fa-times-circle text-red-400 text-2xl mr-3"></i>
                  <span className="text-lg text-red-400 font-medium">
                    Not Authenticated
                  </span>
                </div>

                <div className="bg-[#242424] p-4 rounded-lg">
                  <p className="text-gray-400">
                    No active user session detected. Please sign in to test
                    authentication.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Test Actions */}
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1] flex items-center">
              <i className="fas fa-vials mr-2"></i>
              Test Actions
            </h2>

            <div className="space-y-4">
              {!user ? (
                <>
                  <button
                    onClick={handleTestSignIn}
                    disabled={isSigningIn}
                    className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSigningIn ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Signing In...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-in-alt mr-2"></i>
                        Test Sign In
                      </>
                    )}
                  </button>

                  <div className="bg-[#242424] p-4 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">
                      Test Credentials:
                    </p>
                    <p className="text-sm text-white">
                      Email: test@example.com
                    </p>
                    <p className="text-sm text-white">Password: password123</p>
                  </div>

                  <div className="flex space-x-2">
                    <a
                      href="/account/signin"
                      className="flex-1 border border-[#333333] hover:border-[#6366F1] px-4 py-3 rounded-lg text-gray-300 hover:text-white transition-colors text-center"
                    >
                      Manual Sign In
                    </a>
                    <a
                      href="/account/signup"
                      className="flex-1 border border-[#333333] hover:border-[#6366F1] px-4 py-3 rounded-lg text-gray-300 hover:text-white transition-colors text-center"
                    >
                      Sign Up
                    </a>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="w-full bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isSigningOut ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        Signing Out...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-sign-out-alt mr-2"></i>
                        Test Sign Out
                      </>
                    )}
                  </button>

                  <a
                    href="/account/logout"
                    className="w-full border border-[#333333] hover:border-red-500 px-6 py-3 rounded-lg text-gray-300 hover:text-red-400 transition-colors text-center block"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Logout Page
                  </a>
                </>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-[#333333]">
              <h3 className="text-lg font-medium text-white mb-3">
                Quick Links
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <a
                  href="/auto-signin"
                  className="text-[#6366F1] hover:text-[#4F46E5] text-sm flex items-center"
                >
                  <i className="fas fa-magic mr-2"></i>
                  Auto Sign-In Handler
                </a>
                <button
                  onClick={() => window.location.reload()}
                  className="text-[#4FD1C5] hover:text-[#38B2AC] text-sm flex items-center text-left"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Debug Info */}
        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#6366F1] flex items-center">
            <i className="fas fa-bug mr-2"></i>
            Debug Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#242424] p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Loading States</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">User Loading:</span>
                  <span
                    className={
                      userLoading ? "text-yellow-400" : "text-green-400"
                    }
                  >
                    {userLoading ? "True" : "False"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sign In Loading:</span>
                  <span
                    className={
                      isSigningIn ? "text-yellow-400" : "text-green-400"
                    }
                  >
                    {isSigningIn ? "True" : "False"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sign Out Loading:</span>
                  <span
                    className={
                      isSigningOut ? "text-yellow-400" : "text-green-400"
                    }
                  >
                    {isSigningOut ? "True" : "False"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#242424] p-4 rounded-lg">
              <h3 className="text-white font-medium mb-2">Browser Info</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">URL:</span>
                  <span className="text-white truncate ml-2">
                    {typeof window !== "undefined"
                      ? window.location.pathname
                      : "/auth-test"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Cookies Enabled:</span>
                  <span className="text-green-400">
                    {typeof navigator !== "undefined"
                      ? navigator.cookieEnabled
                        ? "True"
                        : "False"
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
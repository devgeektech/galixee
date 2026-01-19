"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

function MainComponent() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoSignIn, setAutoSignIn] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/welcome");

  useEffect(() => {
    // Get callbackUrl from URL on client side
    const params = new URLSearchParams(window.location.search);
    const callback = params.get("callbackUrl");
    if (callback) {
      setCallbackUrl(callback);
    }
  }, []);

  useEffect(() => {
    // Check for auto sign-in trigger from localStorage
    const autoTrigger = localStorage.getItem("auto_signin_trigger");
    if (autoTrigger === "true") {
      setAutoSignIn(true);
      // Clear the trigger
      localStorage.removeItem("auto_signin_trigger");

      // Auto-submit the form with test credentials
      setTimeout(() => {
        const form = document.getElementById("signin-form");
        if (form) {
          form.submit();
        }
      }, 1000);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      // First ensure test user exists
      const userResponse = await fetch("/api/ensure-test-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!userResponse.ok) {
        throw new Error("Failed to ensure test user exists");
      }

      // Now proceed with form submission
      e.target.submit();
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl relative z-10">
        <div className="mb-8 text-center">
          <a
            href="/"
            className="inline-flex items-center text-2xl font-bold text-white mb-4"
          >
            <i className="fas fa-galaxy mr-2"></i>
            Galixee
          </a>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-400">
            Sign in to continue your cosmic journey
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        {autoSignIn && (
          <div className="mb-6 bg-blue-900/20 border border-blue-500/50 p-4 rounded-lg text-blue-400">
            <i className="fas fa-spinner fa-spin mr-2"></i>
            Auto-signing you in...
          </div>
        )}

        <form
          id="signin-form"
          method="POST"
          action="/api/signin-with-cookies"
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={autoSignIn ? "test@example.com" : ""}
              required
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#6366F1] focus:outline-none transition-colors"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              defaultValue={autoSignIn ? "password123" : ""}
              required
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#6366F1] focus:outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <input
            type="hidden"
            name="callbackUrl"
            value={callbackUrl}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-[#6366F1] to-[#4FD1C5] hover:from-[#4F46E5] hover:to-[#38B2AC] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isLoading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Signing In...
              </>
            ) : (
              <>
                <i className="fas fa-rocket mr-2"></i>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Don't have an account?{" "}
            <a
              href="/account/signup"
              className="text-[#6366F1] hover:text-[#4F46E5] underline transition-colors"
            >
              Sign up here
            </a>
          </p>
        </div>

        <div className="mt-6 bg-[#242424] p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Test Credentials</h3>
          <p className="text-gray-400 text-sm mb-1">Email: test@example.com</p>
          <p className="text-gray-400 text-sm">Password: password123</p>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[100px] animate-pulse"></div>
      </div>
    </div>
  );
}

export default MainComponent;
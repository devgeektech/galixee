"use client";
import {React, useState } from "react";

function MainComponent() {
  const [email, setEmail] = useState("test@example.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/signin-with-cookies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      if (data.success) {
        // Store session info for our custom hooks
        localStorage.setItem(
          "galixee_session",
          JSON.stringify({
            user: data.user,
            sessionToken: data.sessionToken,
            expires: data.setCookie.options.expires,
            timestamp: Date.now(),
          })
        );

        // Get redirect URL from query params or default to welcome
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get("callbackUrl") || "/welcome";

        // Redirect to the callback URL
        window.location.href = callbackUrl;
      } else {
        throw new Error(data.error || "Sign in failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] rounded-xl p-8">
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-flex items-center text-2xl font-bold text-white"
          >
            <i className="fas fa-galaxy mr-2 text-[#6366F1]"></i>
            Galixee
          </a>
          <h1 className="text-2xl font-bold text-white mt-4 mb-2">Sign In</h1>
          <p className="text-gray-400">Welcome back to your cosmic journey</p>
        </div>

        {/* Sandbox helper message */}
        <div className="mb-6 bg-indigo-900/20 border border-indigo-500/50 p-4 rounded-lg text-indigo-400">
          <div className="flex items-center mb-2">
            <i className="fas fa-rocket mr-2"></i>
            <span className="font-medium">Sandbox Mode</span>
          </div>
          <p className="text-sm">
            Test credentials are pre-filled. Just click "Sign In" to continue!
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#6366F1] focus:outline-none transition-colors"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Signing In...
              </>
            ) : (
              <>
                <i className="fas fa-sign-in-alt mr-2"></i>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <a
              href="/account/signup"
              className="text-[#6366F1] hover:text-[#4F46E5] font-medium transition-colors"
            >
              Sign up here
            </a>
          </p>
        </div>

        {/* Debug section */}
        <div className="mt-6 pt-6 border-t border-[#333333]">
          <button
            type="button"
            onClick={async () => {
              try {
                const response = await fetch("/api/create-test-user", {
                  method: "POST",
                });
                const result = await response.json();

                if (result.success) {
                  alert(
                    "✅ Test user created successfully!\n\nYou can now sign in with:\nEmail: test@example.com\nPassword: password123"
                  );
                } else {
                  alert("❌ Error: " + result.error);
                }
              } catch (error) {
                alert("❌ Network Error: " + error.message);
              }
            }}
            className="w-full text-xs text-gray-400 hover:text-gray-300 underline mb-4"
          >
            🔧 Create test user (if needed)
          </button>

          <div className="text-center">
            <a
              href="/"
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Home
            </a>
          </div>
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
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { storeToken } from "@/utilities/token-manager";

export default function WebViewPage() {
  const [user, setUser] = useState(null);
  const [tokenType, setTokenType] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const validateToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setError("No authentication token provided. Please log in first.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/webview-auth?token=${token}`);
        const data = await response.json();

        if (!response.ok) {
          setError(
            data.error || "Authentication failed. Token may be invalid or expired."
          );
          setLoading(false);
          return;
        }

        // Token is valid - store it for API requests
        setUser(data.user);
        setTokenType(data.tokenType); // 'jwt' or 'session'
        setExpiresAt(data.expiresAt);
        
 

const maxAge = data.tokenType === "jwt" ? 900 : 2592000;

document.cookie = `sessionToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
document.cookie = `galixee_session_token=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
        
        // Store token using token manager (supports Authorization header)
        storeToken(token, data.tokenType, data.user, data.expiresAt);

        // Auto redirect to /welcome after token is stored
        console.log("✅ Token validated. Redirecting to /welcome...");
        setTimeout(() => {
         window.location.href = "/welcome"
        }, 300); // Small delay to ensure token is stored
      } catch (err) {
        console.error("WebView validation error:", err);
        setError("Failed to validate authentication. Please try again.");
        setLoading(false);
      }
    };

    validateToken();
  }, [searchParams, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#333333] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-gray-400">Validating your access...</p>
          <p className="text-sm text-gray-500 mt-4">Redirecting to welcome page...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
        <div className="bg-[#1A1A1A] border border-[#FF6B6B] rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-[#FF6B6B] mb-4">
            <i className="fas fa-exclamation-circle mr-2"></i>
            Access Denied
          </h1>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/account/signin"
            className="inline-block bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Sign In Again
          </a>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Unauthorized</h1>
          <p className="text-gray-400 mb-6">Unable to authenticate your session</p>
          <a
            href="/account/signin"
            className="inline-block bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-2 rounded-lg text-white font-medium transition-colors"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 border-b border-[#333333] p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="text-2xl font-bold flex items-center">
            <i className="fas fa-galaxy mr-2 text-[#6366F1]"></i>
            Galixee WebView
          </a>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">
              Welcome, <span className="font-semibold text-white">{user.name}</span>
            </span>
            <a
              href="/account/logout"
              className="bg-[#FF6B6B] hover:bg-[#FF5252] px-4 py-2 rounded-lg text-white font-medium transition-colors"
            >
              Sign Out
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-8">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-[#6366F1] to-[#4FD1C5] rounded-full flex items-center justify-center mr-6">
              <i className="fas fa-user text-white text-2xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{user.name}</h1>
              <p className="text-gray-400">{user.email}</p>
            </div>
          </div>

          <div className="bg-[#242424] rounded-lg p-6 mb-6 border border-[#4FD1C5]">
            <h2 className="text-xl font-semibold text-white mb-4">
              <i className="fas fa-check-circle text-[#4FD1C5] mr-2"></i>
              Authentication Successful
            </h2>
            <p className="text-gray-300 mb-4">
              Your authentication token has been validated. Redirecting to welcome page...
            </p>
            <div className="bg-[#1A1A1A] rounded p-4 text-sm text-gray-400 border border-[#333333]">
              <p className="font-mono">
                User ID: <span className="text-[#4FD1C5]">{user.id}</span>
              </p>
              <p className="font-mono mt-2">
                Token Type: <span className="text-[#4FD1C5] font-semibold uppercase">{tokenType || 'Unknown'}</span>
              </p>
              <p className="font-mono mt-2">
                Token Status: <span className="text-green-400">Valid</span>
              </p>
              {expiresAt && (
                <p className="font-mono mt-2">
                  Expires: <span className="text-orange-400">{new Date(expiresAt).toLocaleString()}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#242424] rounded-lg p-6 border border-[#333333] hover:border-[#6366F1] transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                <i className="fas fa-file text-[#6366F1] mr-2"></i>
                Protected Content
              </h3>
              <p className="text-gray-400">
                This WebView is secured with token-based authentication. Only authenticated users can access this page.
              </p>
            </div>

            <div className="bg-[#242424] rounded-lg p-6 border border-[#333333] hover:border-[#4FD1C5] transition-colors">
              <h3 className="text-lg font-semibold text-white mb-3">
                <i className="fas fa-lock text-[#4FD1C5] mr-2"></i>
                Secure Communication
              </h3>
              <p className="text-gray-400">
                All requests are authenticated using your session token. Your data is encrypted and secure.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#333333]">
            <h3 className="text-lg font-semibold text-white mb-4">URL Authentication Format</h3>
            <div className="bg-[#1A1A1A] rounded p-4 border border-[#333333] overflow-x-auto mb-4">
              <p className="text-sm text-gray-400 font-mono mb-2">
                <span className="text-[#6366F1]"># JWT Token</span>
              </p>
              <p className="text-sm text-gray-400 font-mono">
                {typeof window !== "undefined" && window.location.origin}
                <span className="text-[#6366F1]">/webview?token=</span>
                <span className="text-[#4FD1C5]">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</span>
              </p>
            </div>
            <div className="bg-[#1A1A1A] rounded p-4 border border-[#333333] overflow-x-auto">
              <p className="text-sm text-gray-400 font-mono mb-2">
                <span className="text-[#6366F1]"># Session Token</span>
              </p>
              <p className="text-sm text-gray-400 font-mono">
                {typeof window !== "undefined" && window.location.origin}
                <span className="text-[#6366F1]">/webview?token=</span>
                <span className="text-[#4FD1C5]">abc123xyz456...</span>
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Supports both JWT tokens (15 min expiry) and session tokens (30 day expiry). Your current token is a <span className="font-semibold">{tokenType}</span> token.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}


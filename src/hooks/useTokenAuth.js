"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, isTokenValid, getStoredUser, clearToken } from "@/utilities/token-manager";

/**
 * Hook to protect pages with token authentication
 * Checks if user has valid token before rendering
 * 
 * Usage:
 * const { user, loading, error } = useTokenAuth();
 * if (loading) return <div>Loading...</div>;
 * if (!user) return <div>Unauthorized</div>;
 * // Render protected content
 */
export function useTokenAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = getToken();
      const user = getStoredUser();
      const isValid = isTokenValid();

      if (!token || !isValid) {
        setError("Invalid or expired token");
        // Redirect to login
        setTimeout(() => {
          router.push("/account/signin");
        }, 1000);
        setLoading(false);
        return;
      }

      if (!user) {
        setError("User data not found");
        clearToken();
        setTimeout(() => {
          router.push("/account/signin");
        }, 1000);
        setLoading(false);
        return;
      }

      setUser(user);
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  return { user, loading, error };
}

/**
 * HOC to wrap pages with token authentication
 * Usage:
 * export default withTokenAuth(MyProtectedPage);
 */
export function withTokenAuth(Component) {
  return function ProtectedPage(props) {
    const { user, loading, error } = useTokenAuth();

    if (loading) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#333333] border-t-[#6366F1] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-lg text-gray-400">Loading...</p>
          </div>
        </div>
      );
    }

    if (error || !user) {
      return (
        <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-4">
          <div className="bg-[#1A1A1A] border border-[#FF6B6B] rounded-lg p-8 max-w-md text-center">
            <h1 className="text-2xl font-bold text-[#FF6B6B] mb-4">
              <i className="fas fa-exclamation-circle mr-2"></i>
              Unauthorized Access
            </h1>
            <p className="text-gray-300 mb-6">
              {error || "You need to be authenticated to access this page"}
            </p>
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

    return <Component {...props} user={user} />;
  };
}

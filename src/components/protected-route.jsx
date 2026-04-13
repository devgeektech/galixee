"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/**
 * ProtectedRoute component
 * Wraps pages that require authentication
 * Redirects to login if user is not authenticated
 * Shows loading state while checking authentication
 */
export function ProtectedRoute({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for session token in localStorage
        const sessionToken =
          typeof window !== "undefined"
            ? localStorage.getItem("galixee_session_token")
            : null;

        if (!sessionToken) {
          // No token, redirect to login
          // Build callback URL properly - only add ? if there are actual search params
          const searchString = searchParams.toString();
          const callbackUrl = searchString 
            ? pathname + "?" + searchString 
            : pathname;
          router.push(`/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }

        // Validate session with API (with timeout to prevent hanging)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        try {
          const response = await fetch("/api/session-persistence-handler", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action: "validate",
              sessionData: {
                sessionToken,
              },
            }),
            signal: controller.signal,
          });

          clearTimeout(timeout);
          const result = await response.json();

          if (result.valid) {
            setIsAuthenticated(true);
            setIsLoading(false);
          } else {
            // Session invalid or expired
            if (typeof window !== "undefined") {
              localStorage.removeItem("galixee_session_token");
              localStorage.removeItem("galixee_user");
            }
            const searchString = searchParams.toString();
            const callbackUrl = searchString 
              ? pathname + "?" + searchString 
              : pathname;
            router.push(
              `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=session_expired`
            );
          }
        } catch (fetchError) {
          clearTimeout(timeout);
          
          // If it's an abort error, just redirect to login
          if (fetchError.name === "AbortError") {
            const searchString = searchParams.toString();
            const callbackUrl = searchString 
              ? pathname + "?" + searchString 
              : pathname;
            router.push(
              `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=timeout`
            );
            return;
          }
          
          // For other fetch errors, try to redirect
          const searchString = searchParams.toString();
          const callbackUrl = searchString 
            ? pathname + "?" + searchString 
            : pathname;
          router.push(
            `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=error`
          );
        }
      } catch (error) {
        console.error("Auth check error:", error);
        const searchString = searchParams.toString();
        const callbackUrl = searchString 
          ? pathname + "?" + searchString 
          : pathname;
        router.push(
          `/account/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=error`
        );
      }
    };

    checkAuth();
  }, [pathname, searchParams, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
          <p className="text-gray-400 mt-4">Verifying session...</p>
        </div>
      </div>
    );
  }

  // Only render if authenticated
  if (!isAuthenticated) {
    return null; // Router will handle redirect
  }

  return <>{children}</>;
}

export default ProtectedRoute;

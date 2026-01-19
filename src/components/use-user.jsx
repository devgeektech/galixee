"use client";
import React from "react";

function useUser(options = {}) {
  const {
    revalidateOnFocus = true,
    revalidateOnStorage = true,
    revalidateOnMount = true,
  } = options;
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const lastRefetchAtRef = React.useRef(0);

  const fetchUser = React.useCallback(async () => {
    try {
      setError(null);
      
      const response = await fetch('/api/get-session-enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          setData(null);
          setLoading(false);
          return;
        }
        throw new Error(`Session check failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.user) {
        setData(result.user);
      } else {
        setData(null);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const refetch = React.useCallback(async () => {
    if (loading) return;
    setLoading(true);
    lastRefetchAtRef.current = Date.now();
    await fetchUser();
  }, [fetchUser, loading]);

  React.useEffect(() => {
    if (revalidateOnMount) {
      fetchUser();
    } else {
      setIsInitialized(true);
      setLoading(false);
    }
  }, [fetchUser, revalidateOnMount]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e) => {
        if (!revalidateOnStorage) return;
        if (e.key === 'galixee_session' || e.key === null) {
          refetch();
        }
      };

      const handleFocus = () => {
        if (!revalidateOnFocus) return;
        if (!isInitialized) return;
        if (document.visibilityState !== 'visible') return;
        if (loading) return;
        const now = Date.now();
        if (now - lastRefetchAtRef.current < 3000) return;
        lastRefetchAtRef.current = now;
        refetch();
      };

      if (revalidateOnStorage) {
        window.addEventListener('storage', handleStorageChange);
      }
      if (revalidateOnFocus) {
        window.addEventListener('focus', handleFocus);
      }

      return () => {
        if (revalidateOnStorage) {
          window.removeEventListener('storage', handleStorageChange);
        }
        if (revalidateOnFocus) {
          window.removeEventListener('focus', handleFocus);
        }
      };
    }
  }, [refetch, isInitialized, loading, revalidateOnFocus, revalidateOnStorage]);

  return {
    data,
    loading,
    error,
    refetch,
    isAuthenticated: Boolean(data),
    isInitialized,
  };
}

// Export as both named and default export for compatibility
export { useUser };
export default useUser;


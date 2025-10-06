"use client";
import React from "react";



export default function Index() {
  return (function useUser() {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [isInitialized, setIsInitialized] = React.useState(false);

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
    setLoading(true);
    await fetchUser();
  }, [fetchUser]);

  React.useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e) => {
        if (e.key === 'galixee_session' || e.key === null) {
          refetch();
        }
      };

      const handleFocus = () => {
        if (isInitialized) {
          refetch();
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, [refetch, isInitialized]);

  return {
    data,
    loading,
    error,
    refetch,
    isAuthenticated: Boolean(data),
    isInitialized,
  };
}

function MainComponent({ showDebugInfo = false, variant = 'default' }) {
  const { data: user, loading, error, refetch, isAuthenticated, isInitialized } = useUser();

  const getStatusColor = () => {
    if (loading) return 'text-yellow-400';
    if (error) return 'text-red-400';
    if (isAuthenticated) return 'text-green-400';
    return 'text-gray-400';
  };

  const getStatusIcon = () => {
    if (loading) return 'fa-spinner fa-spin';
    if (error) return 'fa-exclamation-triangle';
    if (isAuthenticated) return 'fa-user-check';
    return 'fa-user-times';
  };

  const getStatusText = () => {
    if (loading) return 'Loading...';
    if (error) return 'Error';
    if (isAuthenticated) return 'Authenticated';
    return 'Not Authenticated';
  };

  if (variant === 'minimal') {
    return (
      <div className="inline-flex items-center space-x-2">
        <i className={`fas ${getStatusIcon()} ${getStatusColor()}`}></i>
        <span className={`text-sm ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
        isAuthenticated 
          ? 'bg-green-900/20 border border-green-500/50 text-green-400'
          : loading
          ? 'bg-yellow-900/20 border border-yellow-500/50 text-yellow-400'
          : 'bg-gray-900/20 border border-gray-500/50 text-gray-400'
      }`}>
        <i className={`fas ${getStatusIcon()} mr-1`}></i>
        {getStatusText()}
      </div>
    );
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white flex items-center">
          <i className={`fas ${getStatusIcon()} ${getStatusColor()} mr-2`}></i>
          User Status
        </h3>
        <button
          onClick={refetch}
          disabled={loading}
          className="text-[#6366F1] hover:text-[#4F46E5] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className={`fas fa-redo ${loading ? 'fa-spin' : ''}`}></i>
        </button>
      </div>

      {loading && !isInitialized ? (
        <div className="flex items-center text-yellow-400">
          <i className="fas fa-spinner fa-spin mr-2"></i>
          <span>Checking authentication...</span>
        </div>
      ) : error ? (
        <div className="text-red-400">
          <i className="fas fa-exclamation-triangle mr-2"></i>
          <span>Error: {error}</span>
        </div>
      ) : isAuthenticated && user ? (
        <div className="space-y-2">
          <div className="flex items-center text-green-400 mb-3">
            <i className="fas fa-check-circle mr-2"></i>
            <span className="font-medium">Authenticated</span>
          </div>
          <div className="bg-[#242424] p-3 rounded space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">ID:</span>
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
          </div>
        </div>
      ) : (
        <div className="text-gray-400">
          <i className="fas fa-user-times mr-2"></i>
          <span>No active session</span>
        </div>
      )}

      {showDebugInfo && (
        <div className="mt-4 pt-4 border-t border-[#333333]">
          <h4 className="text-sm font-medium text-gray-400 mb-2">Debug Info</h4>
          <div className="bg-[#242424] p-2 rounded text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Loading:</span>
              <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
                {loading.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Initialized:</span>
              <span className={isInitialized ? 'text-green-400' : 'text-yellow-400'}>
                {isInitialized.toString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Error:</span>
              <span className={error ? 'text-red-400' : 'text-green-400'}>
                {error || 'none'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StoryComponent() {
  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto p-8 space-y-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          useUser Hook Variants
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">Default Variant</h2>
            <MainComponent />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">With Debug Info</h2>
            <MainComponent showDebugInfo={true} />
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">Minimal Variant</h2>
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
              <MainComponent variant="minimal" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white">Badge Variant</h2>
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
              <MainComponent variant="badge" />
            </div>
          </div>
        </div>

        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-lg p-6">
          <h2 className="text-xl font-medium text-white mb-4">Hook Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h3 className="text-[#6366F1] font-medium">Authentication</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Session validation via API</li>
                <li>• Automatic token refresh</li>
                <li>• Cross-tab synchronization</li>
                <li>• Focus-based revalidation</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-[#4FD1C5] font-medium">State Management</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• Loading states</li>
                <li>• Error handling</li>
                <li>• Manual refetch</li>
                <li>• Initialization tracking</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-[#242424] p-4 rounded-lg">
          <h3 className="text-white font-medium mb-2">Usage Example</h3>
          <pre className="text-xs text-gray-300 overflow-x-auto">
{`const { data: user, loading, error, refetch, isAuthenticated } = useUser();

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;
if (!isAuthenticated) return <div>Please sign in</div>;

return <div>Welcome, {user.email}!</div>;`}
          </pre>
        </div>
      </div>
    </div>
  );
});
}
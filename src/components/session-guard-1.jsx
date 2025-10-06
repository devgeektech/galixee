"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ 
  children, 
  redirectUrl = "/account/signin", 
  fallbackComponent = null,
  onSessionRestored = () => {},
  onSessionLost = () => {},
  checkInterval = 30000,
  enableLocalStorage = true 
}) {
  const { data: user, loading, refetch } = useUser();
  const [isRestoring, setIsRestoring] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const intervalRef = React.useRef(null);

  // Attempt to restore session from localStorage
  const restoreSession = React.useCallback(async () => {
    if (!enableLocalStorage) return false;
    
    try {
      setIsRestoring(true);
      const storedSession = localStorage.getItem('galixee_session');
      
      if (storedSession) {
        const sessionData = JSON.parse(storedSession);
        const now = Date.now();
        
        // Check if session hasn't expired (24 hours)
        if (sessionData.timestamp && (now - sessionData.timestamp) < 24 * 60 * 60 * 1000) {
          await refetch();
          onSessionRestored(sessionData);
          return true;
        } else {
          localStorage.removeItem('galixee_session');
        }
      }
    } catch (error) {
      console.error('Session restoration failed:', error);
      localStorage.removeItem('galixee_session');
    } finally {
      setIsRestoring(false);
    }
    
    return false;
  }, [refetch, onSessionRestored, enableLocalStorage]);

  // Store session data when user is available
  React.useEffect(() => {
    if (user && enableLocalStorage) {
      const sessionData = {
        userId: user.id,
        timestamp: Date.now()
      };
      localStorage.setItem('galixee_session', JSON.stringify(sessionData));
    }
  }, [user, enableLocalStorage]);

  // Initial session check
  React.useEffect(() => {
    const checkSession = async () => {
      if (!loading && !user) {
        const restored = await restoreSession();
        if (!restored) {
          onSessionLost();
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `${redirectUrl}?callbackUrl=${currentPath}`;
          return;
        }
      }
      setSessionChecked(true);
    };

    checkSession();
  }, [user, loading, restoreSession, redirectUrl, onSessionLost]);

  // Periodic session validation
  React.useEffect(() => {
    if (checkInterval > 0 && user) {
      intervalRef.current = setInterval(async () => {
        try {
          await refetch();
        } catch (error) {
          console.error('Session validation failed:', error);
          onSessionLost();
          const currentPath = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `${redirectUrl}?callbackUrl=${currentPath}`;
        }
      }, checkInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user, checkInterval, refetch, redirectUrl, onSessionLost]);

  // Show loading state
  if (loading || isRestoring || !sessionChecked) {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6366F1] mx-auto mb-4"></div>
          <p className="text-gray-400">
            {isRestoring ? 'Restoring session...' : 'Checking authentication...'}
          </p>
        </div>
      </div>
    );
  }

  // Show fallback if no user and fallback provided
  if (!user && fallbackComponent) {
    return fallbackComponent;
  }

  // Render children if authenticated
  if (user) {
    return <>{children}</>;
  }

  // Default fallback
  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
      <div className="text-center">
        <i className="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
        <p className="text-gray-400">Redirecting to sign in...</p>
      </div>
    </div>
  );
}

function StoryComponent() {
  const [sessionEvents, setSessionEvents] = React.useState([]);
  
  const addEvent = (event) => {
    setSessionEvents(prev => [...prev, { ...event, timestamp: new Date().toLocaleTimeString() }]);
  };

  const MockProtectedContent = () => (
    <div className="min-h-screen bg-[#121212] text-white font-roboto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          Protected Content
        </h1>
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <p className="text-gray-300 mb-4">
            This content is protected by SessionGuard and only visible to authenticated users.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#242424] p-4 rounded-lg">
              <i className="fas fa-shield-check text-[#6366F1] text-2xl mb-2"></i>
              <h3 className="text-white font-medium">Session Protected</h3>
              <p className="text-gray-400 text-sm">Automatic authentication check</p>
            </div>
            <div className="bg-[#242424] p-4 rounded-lg">
              <i className="fas fa-sync-alt text-[#4FD1C5] text-2xl mb-2"></i>
              <h3 className="text-white font-medium">Auto Restore</h3>
              <p className="text-gray-400 text-sm">Session restoration from storage</p>
            </div>
            <div className="bg-[#242424] p-4 rounded-lg">
              <i className="fas fa-clock text-[#FF6B6B] text-2xl mb-2"></i>
              <h3 className="text-white font-medium">Periodic Check</h3>
              <p className="text-gray-400 text-sm">Continuous session validation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CustomFallback = () => (
    <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
      <div className="text-center max-w-md">
        <i className="fas fa-user-lock text-[#6366F1] text-5xl mb-6"></i>
        <h2 className="text-2xl font-bold mb-4">Custom Authentication Required</h2>
        <p className="text-gray-400 mb-6">
          This is a custom fallback component shown when authentication is required.
        </p>
        <button className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white transition-colors">
          Sign In
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 p-8 bg-[#0A0A0A] min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">SessionGuard Component Variants</h1>
        
        {/* Event Log */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Session Events</h2>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {sessionEvents.map((event, index) => (
              <div key={index} className="text-sm text-gray-400">
                <span className="text-[#6366F1]">{event.timestamp}</span> - {event.message}
              </div>
            ))}
          </div>
        </div>

        {/* Default SessionGuard */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Default SessionGuard</h2>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl overflow-hidden">
            <MainComponent
              onSessionRestored={(data) => addEvent({ message: `Session restored for user ${data.userId}` })}
              onSessionLost={() => addEvent({ message: 'Session lost, redirecting...' })}
            >
              <MockProtectedContent />
            </MainComponent>
          </div>
        </div>

        {/* SessionGuard with Custom Fallback */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">SessionGuard with Custom Fallback</h2>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl overflow-hidden">
            <MainComponent
              fallbackComponent={<CustomFallback />}
              onSessionRestored={(data) => addEvent({ message: `Custom fallback - Session restored for user ${data.userId}` })}
              onSessionLost={() => addEvent({ message: 'Custom fallback - Session lost' })}
            >
              <MockProtectedContent />
            </MainComponent>
          </div>
        </div>

        {/* SessionGuard with Disabled LocalStorage */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">SessionGuard without LocalStorage</h2>
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl overflow-hidden">
            <MainComponent
              enableLocalStorage={false}
              checkInterval={10000}
              onSessionRestored={(data) => addEvent({ message: `No localStorage - Session restored for user ${data.userId}` })}
              onSessionLost={() => addEvent({ message: 'No localStorage - Session lost' })}
            >
              <MockProtectedContent />
            </MainComponent>
          </div>
        </div>

        {/* Configuration Examples */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Configuration Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-[#242424] p-4 rounded-lg">
              <h3 className="text-[#6366F1] font-medium mb-2">Props</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• redirectUrl: Custom sign-in URL</li>
                <li>• fallbackComponent: Custom loading/error UI</li>
                <li>• checkInterval: Session check frequency</li>
                <li>• enableLocalStorage: Session persistence</li>
              </ul>
            </div>
            <div className="bg-[#242424] p-4 rounded-lg">
              <h3 className="text-[#4FD1C5] font-medium mb-2">Callbacks</h3>
              <ul className="text-gray-400 space-y-1">
                <li>• onSessionRestored: Session recovery</li>
                <li>• onSessionLost: Session expiration</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
}
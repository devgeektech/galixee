"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [sessionInfo, setSessionInfo] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [testResults, setTestResults] = useState({});
  const [isRunningTests, setIsRunningTests] = useState(false);

  useEffect(() => {
    // Collect session and debug information
    const collectDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        cookies: document.cookie,
        localStorage: {
          sessionActive: localStorage.getItem("sandbox_session_active"),
          sessionTime: localStorage.getItem("sandbox_session_time"),
          email: localStorage.getItem("sandbox_email"),
        },
        url: window.location.href,
        referrer: document.referrer,
      };
      setDebugInfo(info);
    };

    collectDebugInfo();
  }, []);

  useEffect(() => {
    if (user) {
      setSessionInfo({
        authenticated: true,
        userId: user.id,
        email: user.email,
        name: user.name,
        sessionValid: true,
      });
    } else if (!userLoading) {
      setSessionInfo({
        authenticated: false,
        sessionValid: false,
      });
    }
  }, [user, userLoading]);

  const runAuthTests = async () => {
    setIsRunningTests(true);
    const results = {};

    try {
      // Test 1: Check if user data is available
      results.userDataTest = {
        passed: !!user,
        message: user
          ? "User data loaded successfully"
          : "No user data available",
        data: user ? { id: user.id, email: user.email } : null,
      };

      // Test 2: Test API endpoint access
      try {
        const response = await fetch("/api/session-health-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          results.apiAccessTest = {
            passed: true,
            message: "API access successful",
            data: data,
          };
        } else {
          results.apiAccessTest = {
            passed: false,
            message: `API access failed: ${response.status}`,
            data: null,
          };
        }
      } catch (error) {
        results.apiAccessTest = {
          passed: false,
          message: `API access error: ${error.message}`,
          data: null,
        };
      }

      // Test 3: Check subscription status
      try {
        const response = await fetch("/api/get-subscription-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (response.ok) {
          const data = await response.json();
          results.subscriptionTest = {
            passed: true,
            message: "Subscription check successful",
            data: data,
          };
        } else {
          results.subscriptionTest = {
            passed: false,
            message: `Subscription check failed: ${response.status}`,
            data: null,
          };
        }
      } catch (error) {
        results.subscriptionTest = {
          passed: false,
          message: `Subscription check error: ${error.message}`,
          data: null,
        };
      }

      // Test 4: Cookie validation
      const cookies = document.cookie;
      const hasSessionCookie =
        cookies.includes("next-auth.session-token") ||
        cookies.includes("__Secure-next-auth.session-token") ||
        cookies.includes("nextauth.session-token");

      results.cookieTest = {
        passed: hasSessionCookie,
        message: hasSessionCookie
          ? "Session cookies found"
          : "No session cookies detected",
        data: { cookieCount: cookies.split(";").length, hasSessionCookie },
      };
    } catch (error) {
      results.generalError = {
        passed: false,
        message: `Test suite error: ${error.message}`,
        data: null,
      };
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getStatusIcon = (passed) => {
    return passed
      ? "fa-check-circle text-green-400"
      : "fa-times-circle text-red-400";
  };

  const getStatusColor = (passed) => {
    return passed
      ? "border-green-500/50 bg-green-900/20"
      : "border-red-500/50 bg-red-900/20";
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
            Welcome
          </a>
          <a
            href="/account/logout"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Session Setup Complete
          </h1>
          <p className="text-gray-400 text-lg">
            Authentication verification and debugging tools
          </p>
        </div>

        {/* Authentication Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Authentication Status
            </h2>

            {userLoading ? (
              <div className="flex items-center text-yellow-400">
                <i className="fas fa-spinner fa-spin mr-3"></i>
                Loading user data...
              </div>
            ) : sessionInfo ? (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg border ${getStatusColor(
                    sessionInfo.authenticated
                  )}`}
                >
                  <div className="flex items-center mb-2">
                    <i
                      className={`fas ${getStatusIcon(
                        sessionInfo.authenticated
                      )} mr-3`}
                    ></i>
                    <span className="font-medium">
                      {sessionInfo.authenticated
                        ? "Authenticated"
                        : "Not Authenticated"}
                    </span>
                  </div>
                  {sessionInfo.authenticated && (
                    <div className="text-sm text-gray-300 space-y-1">
                      <p>
                        <span className="text-[#6366F1]">User ID:</span>{" "}
                        {sessionInfo.userId}
                      </p>
                      <p>
                        <span className="text-[#6366F1]">Email:</span>{" "}
                        {sessionInfo.email}
                      </p>
                      {sessionInfo.name && (
                        <p>
                          <span className="text-[#6366F1]">Name:</span>{" "}
                          {sessionInfo.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-gray-400">
                No session information available
              </div>
            )}

            <div className="mt-6 space-y-3">
              <a
                href="/welcome"
                className="block w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors text-center"
              >
                <i className="fas fa-home mr-2"></i>
                Go to Welcome Page
              </a>
              <a
                href="/auto-signin"
                className="block w-full border border-[#333333] hover:border-[#6366F1] px-6 py-3 rounded-lg text-gray-300 hover:text-white transition-colors text-center"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Test Auto Sign-In
              </a>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6366F1]">
                Authentication Tests
              </h2>
              <button
                onClick={runAuthTests}
                disabled={isRunningTests}
                className="bg-[#4FD1C5] hover:bg-[#38B2AC] px-4 py-2 rounded-lg text-black font-medium transition-colors disabled:opacity-50"
              >
                {isRunningTests ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Running...
                  </>
                ) : (
                  <>
                    <i className="fas fa-play mr-2"></i>
                    Run Tests
                  </>
                )}
              </button>
            </div>

            {Object.keys(testResults).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(testResults).map(([testName, result]) => (
                  <div
                    key={testName}
                    className={`p-4 rounded-lg border ${getStatusColor(
                      result.passed
                    )}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {testName
                          .replace(/([A-Z])/g, " $1")
                          .replace(/^./, (str) => str.toUpperCase())}
                      </span>
                      <i className={`fas ${getStatusIcon(result.passed)}`}></i>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {result.message}
                    </p>
                    {result.data && (
                      <details className="text-xs text-gray-400">
                        <summary className="cursor-pointer hover:text-gray-300">
                          View Details
                        </summary>
                        <pre className="mt-2 p-2 bg-[#242424] rounded overflow-x-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                Click "Run Tests" to verify authentication setup
              </div>
            )}
          </div>
        </div>

        {/* Debug Information */}
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
            Debug Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Session Data
              </h3>
              <div className="bg-[#242424] p-4 rounded-lg">
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  {JSON.stringify(debugInfo.localStorage, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-white mb-3">
                Browser Info
              </h3>
              <div className="bg-[#242424] p-4 rounded-lg text-sm text-gray-300 space-y-2">
                <p>
                  <span className="text-[#6366F1]">Timestamp:</span>{" "}
                  {debugInfo.timestamp}
                </p>
                <p>
                  <span className="text-[#6366F1]">URL:</span> {debugInfo.url}
                </p>
                <p>
                  <span className="text-[#6366F1]">User Agent:</span>{" "}
                  {debugInfo.userAgent?.substring(0, 50)}...
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-lg font-medium text-white mb-3">Cookies</h3>
              <div className="bg-[#242424] p-4 rounded-lg">
                <pre className="text-sm text-gray-300 overflow-x-auto whitespace-pre-wrap">
                  {debugInfo.cookies || "No cookies found"}
                </pre>
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
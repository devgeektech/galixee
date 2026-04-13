"use client";
import React from "react";

export default function DebugAuthPage() {
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);

  const testSigninFlow = async () => {
    setLoading(true);
    try {
      console.log("=== Testing Sign In Flow ===");

      // Step 1: Check localStorage and cookies before signin
      console.log("\n1. Before Signin:");
      const tokenBefore = localStorage.getItem("galixee_session_token");
      console.log("localStorage sessionToken:", tokenBefore);

      // Step 2: Attempt signin
      console.log("\n2. Attempting signin...");
      const signinResponse = await fetch("/api/credentials-auth-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: "test@example.com",
          password: "password123",
        }),
      });

      const signinData = await signinResponse.json();
      console.log("Signin response:", signinData);

      if (!signinData.success) {
        setResult({
          error: "Signin failed",
          details: signinData,
        });
        setLoading(false);
        return;
      }

      // Step 3: Check localStorage after signin response
      console.log("\n3. After signin response:");
      const tokenAfter = localStorage.getItem("galixee_session_token");
      console.log("localStorage sessionToken:", tokenAfter);

      // Step 4: Store token (simulating what signin page does)
      localStorage.setItem("galixee_session_token", signinData.sessionToken);
      const tokenStored = localStorage.getItem("galixee_session_token");
      console.log("Manually stored sessionToken:", tokenStored);

      // Step 5: Validate session immediately
      console.log("\n4. Validating session...");
      const validateResponse = await fetch("/api/session-persistence-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          action: "validate",
          sessionData: {
            sessionToken: signinData.sessionToken,
          },
        }),
      });

      const validateData = await validateResponse.json();
      console.log("Validation response:", validateData);

      // Step 6: Debug session in database
      console.log("\n5. Debugging database session...");
      const debugResponse = await fetch("/api/debug-session-validation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionToken: signinData.sessionToken,
        }),
      });

      const debugData = await debugResponse.json();
      console.log("Database debug response:", debugData);

      setResult({
        success: true,
        signin: signinData,
        validation: validateData,
        debug: debugData,
        tokenStored: !!tokenStored,
      });
    } catch (error) {
      console.error("Test failed:", error);
      setResult({
        error: error.message,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🔧 Auth Debug Page</h1>

        <button
          onClick={testSigninFlow}
          disabled={loading}
          className="px-6 py-3 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? "Testing..." : "Run Full Auth Test"}
        </button>

        {result && (
          <div className="mt-8 p-6 bg-[#1A1A1A] border border-[#333] rounded-lg">
            <h2 className="text-2xl font-bold mb-4">Results:</h2>

            {result.error ? (
              <div className="text-red-400 p-4 bg-red-900/20 rounded border border-red-500/50">
                <p className="font-bold">Error: {result.error}</p>
                {result.details && (
                  <pre className="mt-2 text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-green-900/20 border border-green-500/50 rounded">
                  <h3 className="font-bold text-green-400 mb-2">✅ Signin Result:</h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.signin, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-blue-900/20 border border-blue-500/50 rounded">
                  <h3 className="font-bold text-blue-400 mb-2">
                    Validation Result:
                  </h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.validation, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-purple-900/20 border border-purple-500/50 rounded">
                  <h3 className="font-bold text-purple-400 mb-2">
                    Database Debug:
                  </h3>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(result.debug, null, 2)}
                  </pre>
                </div>

                <div className="p-4 bg-yellow-900/20 border border-yellow-500/50 rounded">
                  <h3 className="font-bold text-yellow-400 mb-2">
                    Summary:
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      Token Stored: {result.tokenStored ? "✅" : "❌"}
                    </li>
                    <li>
                      Validation Valid:{" "}
                      {result.validation?.valid ? "✅" : "❌"}
                    </li>
                    <li>
                      DB Session Match:{" "}
                      {result.debug?.allMatched ? "✅" : "❌"}
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="mt-12 p-6 bg-[#1A1A1A] border border-[#333] rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Manual Steps:</h2>
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-4">
              <span className="text-[#6366F1] font-bold">1.</span>
              <span>Click "Run Full Auth Test" above to see detailed logs</span>
            </li>
            <li className="flex gap-4">
              <span className="text-[#6366F1] font-bold">2.</span>
              <span>Check browser console (F12) for detailed debug output</span>
            </li>
            <li className="flex gap-4">
              <span className="text-[#6366F1] font-bold">3.</span>
              <span>If test passes, try normal signin flow at /account/signin</span>
            </li>
            <li className="flex gap-4">
              <span className="text-[#6366F1] font-bold">4.</span>
              <span>
                Check{" "}
                <code className="bg-[#242424] px-2 py-1 rounded text-[#6366F1]">
                  document.cookie
                </code>{" "}
                in console to verify cookies are set
              </span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

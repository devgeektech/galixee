"use client";
import {React, useState,useEffect} from "react";


function MainComponent() {
  const [status, setStatus] = useState("initializing");
  const [error, setError] = useState(null);
  const [redirectUrl, setRedirectUrl] = useState("/welcome");

  useEffect(() => {
    const handleAutoSignIn = async () => {
      try {
        setStatus("checking_user"); 

        // Get redirect URL from query params
        const urlParams = new URLSearchParams(window.location.search);
        const callbackUrl = urlParams.get("callbackUrl") || "/welcome";
        setRedirectUrl(callbackUrl);

        // First, ensure test user exists
        setStatus("creating_user");
        const userResponse = await fetch("/api/ensure-test-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!userResponse.ok) {
          throw new Error("Failed to ensure test user exists");
        }

        const userData = await userResponse.json();

        // Create session and set cookies
        setStatus("creating_session");

        // Instead of trying to handle cookies manually, redirect to the sign-in page with auto-submit
        const encodedCallbackUrl = encodeURIComponent(callbackUrl);

        // Set up auto-signin parameters
        localStorage.setItem("auto_signin_trigger", "true");
        localStorage.setItem("auto_signin_email", "test@example.com");
        localStorage.setItem("auto_signin_password", "password123");

        setStatus("redirecting");

        // Redirect to sign-in page with auto parameter
        setTimeout(() => {
          window.location.href = `/account/signin?auto=true&callbackUrl=${encodedCallbackUrl}`;
        }, 1000);
      } catch (err) {
        console.error("Auto sign-in error:", err);
        setError(err.message);
        setStatus("error");
      }
    };

    handleAutoSignIn();
  }, []);

  const getStatusMessage = () => {
    switch (status) {
      case "initializing":
        return "Initializing auto sign-in...";
      case "checking_user":
        return "Checking user account...";
      case "creating_user":
        return "Setting up test account...";
      case "creating_session":
        return "Creating secure session...";
      case "redirecting":
        return "Signing you in...";
      case "error":
        return "Sign-in failed";
      default:
        return "Processing...";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "error":
        return "fa-exclamation-triangle";
      case "redirecting":
        return "fa-check-circle";
      default:
        return "fa-spinner fa-spin";
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl text-center relative z-10">
        <div className="mb-8">
          <i className="fas fa-galaxy text-[#6366F1] text-4xl mb-4"></i>
          <h1 className="text-3xl font-bold text-white mb-4">Auto Sign-In</h1>
        </div>

        <div className="space-y-6">
          <div className="bg-[#242424] p-6 rounded-lg">
            <i
              className={`fas ${getStatusIcon()} text-[#4FD1C5] text-2xl mb-3`}
            ></i>
            <p className="text-white text-lg mb-2">{getStatusMessage()}</p>
            {status === "redirecting" && (
              <p className="text-gray-400">Redirecting to {redirectUrl}</p>
            )}
            {error && <p className="text-red-400 mt-2">{error}</p>}
          </div>

          {status === "error" && (
            <div className="flex flex-col space-y-4">
              <a
                href="/account/signin"
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors"
              >
                Try Manual Sign-In
              </a>
              <button
                onClick={() => window.location.reload()}
                className="border border-[#333333] hover:border-[#6366F1] px-6 py-3 rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Retry Auto Sign-In
              </button>
            </div>
          )}

          {status !== "error" && status !== "redirecting" && (
            <div className="text-gray-400 text-sm">
              Please wait while we set up your session...
            </div>
          )}
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
"use client";
import React from "react";

function MainComponent() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("test@example.com");
  const [password, setPassword] = React.useState("password123");
  const [name, setName] = React.useState("Test User");
  const [termsAccepted, setTermsAccepted] = React.useState(true);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(true);

  // Create a simple signup function instead of using useAuth hook
  const signUpWithCredentials = async ({
    email,
    password,
    name,
    callbackUrl,
    redirect,
  }) => {
    const response = await fetch("/api/credentials-auth-handler", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        action: "signup",
        email,
        password,
        name,
      }),
    });

    

    if (!response.ok) {
      
      const errorData = await response.json();
      throw new Error(errorData.error || "Sign up failed");
    }
    console.log("auth credentials response status:", response);

    return await response.json();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || !name) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (!termsAccepted || !privacyAccepted) {
      setError("Please accept the Terms of Service and Privacy Policy");
      setLoading(false);
      return;
    }

    try {
      // First, let's test our debug function
      console.log("Testing signup debug...");
      const debugResponse = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), name, password }),
      });

      const debugResult = await debugResponse.json();
      console.log("debbbbbbbbbbbbbbbbbb",debugResult)
     if (!debugResult.success) {
  setError(debugResult.error || debugResult.message);
  throw new Error(debugResult.error || debugResult.message);
}

      console.log("SIGNUP  result:", debugResult);

      // Get the callback URL from the URL parameters, defaulting to /welcome if not present
      const params = new URLSearchParams(window.location.search);
      console.log('paramsss',params)
      const callbackUrl = params.get("callbackUrl") || "/welcome";

      console.log("Attempting signup with credentials:", {
        email: email.trim(),
        name,
      });
      let records={
        email: email.trim(),
        password,
        name: name || email.split("@")[0],
        callbackUrl,
        redirect: false,
      }
      console.log("recordssssssss==",records)



      const result = debugResult;

if (!result.success) {
   throw new Error(result.error);
}

setTimeout(() => {
  window.location.href = callbackUrl;
}, 2000);
      console.log("resule it asss",result)
      if (result?.error) {
        console.error("SignUp error:", result.error);
        throw new Error(result.error);
      }

      if (!result.success) {
        console.error("SignUp not ok:", result);
        throw new Error("Account creation failed");
      }

      console.log("Signup successful, redirecting to:", callbackUrl);

      // Simple redirect without complex session handling
      setTimeout(() => {
  window.location.href = callbackUrl;
}, 2000);
    } catch (err) {
      console.error("Sign up error:", err);

      const errorMessages = {
        OAuthSignin:
          "Couldn't create your account. Please try again or use a different method.",
        OAuthCallback: "Account creation failed. Please try again.",
        OAuthCreateAccount:
          "Couldn't create an account with this method. Try email sign-up.",
        EmailCreateAccount:
          "This email is already registered. Try signing in instead.",
        Callback:
          "Something went wrong during account creation. Please try again.",
        OAuthAccountNotLinked:
          "This account is linked to a different sign-up method. Try signing in.",
        CredentialsSignin:
          "Account creation failed. Please check your information and try again.",
        AccessDenied: "Account creation is not allowed.",
        Configuration: "System configuration error. Please try again later.",
        Verification: "Email verification failed. Please try again.",
        TooManyRequests:
          "Too many attempts. Please wait a moment and try again.",
        default: "Something went wrong. Please try again.",
      };

      // Handle rate limiting
      if (
        err.message.includes("429") ||
        err.message.toLowerCase().includes("too many requests")
      ) {
        setError(errorMessages.TooManyRequests);
        setLoading(false);
        return;
      }

      // Handle duplicate email
      if (
        err.message.toLowerCase().includes("already exists") ||
        err.message.toLowerCase().includes("duplicate")
      ) {
        setError("This email is already registered. Try signing in instead.");
        setLoading(false);
        return;
      }

      setError(errorMessages[err.message] || errorMessages.default);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <form
        noValidate
        onSubmit={onSubmit}
        className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Join Galixee
        </h1>

        {/* Add sandbox helper message */}
        <div className="rounded-lg bg-indigo-900/20 border border-indigo-500/50 p-3 text-sm text-indigo-400 mb-6">
          <p className="font-medium">🚀 Sandbox Testing</p>
          <p>Default credentials are pre-filled for testing.</p>
          <p className="mt-1">Just click "Create Account" to continue!</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Name
            </label>
            <div className="overflow-hidden rounded-lg border border-[#333333] bg-[#121212] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
              <input
                required
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full bg-transparent text-lg outline-none px-4 py-3 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Email
            </label>
            <div className="overflow-hidden rounded-lg border border-[#333333] bg-[#121212] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
              <input
                required
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full bg-transparent text-lg outline-none px-4 py-3 text-white placeholder-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <div className="overflow-hidden rounded-lg border border-[#333333] bg-[#121212] focus-within:border-[#6366F1] focus-within:ring-1 focus-within:ring-[#6366F1] transition-colors">
              <input
                required
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-lg outline-none px-4 py-3 text-white placeholder-gray-500"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#121212] text-[#6366F1] focus:ring-[#6366F1]"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-300">
                I agree to the{" "}
                <a
                  href="/terms"
                  className="text-[#6366F1] hover:text-[#4F46E5]"
                >
                  Terms of Service
                </a>
              </label>
            </div>
            <div className="flex items-start">
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-600 bg-[#121212] text-[#6366F1] focus:ring-[#6366F1]"
              />
              <label htmlFor="privacy" className="ml-2 text-sm text-gray-300">
                I agree to the{" "}
                <a
                  href="/privacy"
                  className="text-[#6366F1] hover:text-[#4F46E5]"
                >
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !termsAccepted || !privacyAccepted}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Create Account"}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <a
              href={`/account/signin${
                typeof window !== "undefined" ? window.location.search : ""
              }`}
              className="text-[#6366F1] hover:text-[#4F46E5]"
            >
              Sign in
            </a>
          </p>
        </div>
      </form>

      {/* Background Effect */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
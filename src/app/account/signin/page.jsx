"use client";
import React from "react";

function MainComponent() {
  const [error, setError] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [email, setEmail] = React.useState("test@example.com");
  const [password, setPassword] = React.useState("password123");

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const callbackUrl = params.get("callbackUrl") || "/welcome";

      const response = await fetch("/api/credentials-auth-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const result = await response.json();

      if (result.error) {
        if (
          result.error === "Configuration" ||
          result.error.includes("initialize")
        ) {
          window.location.href = `/account/signup${window.location.search}`;
          return;
        }
        throw new Error(result.error);
      }

      if (!result.success) {
        throw new Error("Authentication failed");
      }

      if (result.sessionToken) {
        if (typeof window !== "undefined") {
          localStorage.setItem("galixee_session_token", result.sessionToken);
          localStorage.setItem(
            "galixee_user",
            JSON.stringify({
              id: result.user.id,
              email: result.user.email,
              name: result.user.name,
              sessionToken: result.sessionToken,
              expires: result.expires,
              timestamp: Date.now(),
            })
          );
        }
      }

      window.location.href = callbackUrl;
    } catch (err) {
      console.log("errrrrrr",err)
      const errorMessages = {
        "Invalid credentials": "Incorrect email or password.",
        "User not found": "User not found. Please sign up first.",
        default: "Something went wrong. Please try again.",
      };

      setError(errorMessages[err.message] || errorMessages.default);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl"
      >
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          Welcome Back to Galixee
        </h1>

        <div className="rounded-lg bg-indigo-900/20 border border-indigo-500/50 p-3 text-sm text-indigo-400 mb-6">
          <p className="font-medium">🚀 Sandbox Testing</p>
          <p>Default credentials are pre-filled for testing.</p>
          <p className="mt-1">Just click "Sign In" to continue!</p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#242424] p-4 rounded-lg mb-6">
            <div className="flex items-center space-x-2">
              <i className="fas fa-user-astronaut text-[#6366F1] text-xl"></i>
              <span className="text-lg font-semibold text-white">
                Sign In to Your Account
              </span>
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

          {error && (
            <div className="rounded-lg bg-red-900/20 border border-red-500/50 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-3 rounded-lg text-base font-medium text-white transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Don't have an account?{" "}
              <a
                href={`/account/signup${
                  typeof window !== "undefined" ? window.location.search : ""
                }`}
                className="text-[#6366F1] hover:text-[#4F46E5]"
              >
                Sign up for $4.99
              </a>
            </p>
          </div>
        </div>
      </form>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
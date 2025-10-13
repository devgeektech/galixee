"use client";
import React, { useState, useEffect, useRef } from "react";
import useUser from "@/components/use-user";
import useIsSubscribed from '@/components/use-is-subscribed'
function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const { isSubscribed, loading: subscriptionLoading } = useIsSubscribed();
  const [redirectURL, setRedirectURL] = useState("/welcome");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    // Get the intended destination from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const callbackUrl = urlParams.get("callbackUrl");
    if (callbackUrl) {
      setRedirectURL(callbackUrl);
    }

    // Redirect to sign in if not authenticated
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(
        window.location.pathname + window.location.search
      );
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    // Redirect if already subscribed
    if (!subscriptionLoading && isSubscribed) {
      window.location.href = redirectURL;
      return;
    }
  }, [user, userLoading, isSubscribed, subscriptionLoading, redirectURL]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    console.log("=== CHECKOUT BUTTON CLICKED ===");
    console.log("User loading:", userLoading);
    console.log("User data:", user);

    if (userLoading) {
      console.log("User still loading, waiting...");
      return;
    }

    if (!user) {
      console.log("No user found, cannot checkout");
      setError("Please sign in first");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const requestBody = { redirectURL: redirectURL || "/welcome" };
      const response = await fetch("/api/stripe-checkout-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();
      console.log("Checkout response data:", data);

      if (data.error) {
        console.error("API returned error:", data.error);
        setError(data.error || "Failed to create checkout session");
        return;
      }

      if (data.success) {
        console.log("Success! Checkout URL:", data.checkoutUrl);
        setSuccess("Subscription activated! Redirecting...");

        // Small delay to show success message
        setTimeout(() => {
          console.log("Redirecting to:", data.checkoutUrl);
          window.location.href = data.checkoutUrl;
        }, 1500);
      } else {
        console.error("No success flag in response:", data);
        setError("Failed to activate subscription - no success flag");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      setError("Failed to start checkout process: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || subscriptionLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-[#6366F1] text-4xl mb-4"></i>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (isSubscribed) {
    return null;
  }

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
            Back to Welcome
          </a>
          <a
            href="/account/logout"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
              Unlock Your Cosmic Journey
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-3xl mx-auto">
              Join thousands of explorers in the FOREVERVERSE and access all
              premium features
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-rocket text-[#6366F1] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  Digital Vault
                </h3>
                <p className="text-gray-400">
                  Secure storage for your most important documents and memories
                </p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-dna text-[#4FD1C5] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  DNA Services
                </h3>
                <p className="text-gray-400">
                  Advanced genetic analysis and family tree building
                </p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-space-shuttle text-[#FF6B6B] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  Space Mission
                </h3>
                <p className="text-gray-400">
                  Plan your journey to the stars with our mission planner
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-journal-whills text-[#6366F1] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  Personal Journal
                </h3>
                <p className="text-gray-400">
                  Document your thoughts and experiences for eternity
                </p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-heart text-[#4FD1C5] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  Health & Wellbeing
                </h3>
                <p className="text-gray-400">
                  Track and optimize your physical and mental health
                </p>
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="text-center mb-6">
                <i className="fas fa-shield-alt text-[#FF6B6B] text-3xl mb-4"></i>
                <h3 className="text-xl font-bold text-white mb-2">
                  IP Protection
                </h3>
                <p className="text-gray-400">
                  Protect your intellectual property with our comprehensive
                  guides
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-md mx-auto">
            <div className="bg-[#1A1A1A] border border-[#6366F1] rounded-xl p-8 mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Ready to Begin Your Journey?
                </h2>
                <p className="text-gray-400 mb-6">
                  Get instant access to all features for just $4.99/month
                </p>
              </div>

              {/* Inline subscription component */}
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 text-center">
                <div className="mb-6">
                  <div className="text-3xl font-bold text-white mb-2">
                    <span className="text-[#6366F1]">$4.99</span>
                    <span className="text-gray-400 text-lg">/month</span>
                  </div>
                  <p className="text-gray-400">Unlock your cosmic journey</p>
                </div>

                <ul className="space-y-3 text-left mb-6">
                  <li className="flex items-center text-gray-300">
                    <i className="fas fa-check-circle text-[#4FD1C5] mr-2"></i>
                    Access to all features
                  </li>
                  <li className="flex items-center text-gray-300">
                    <i className="fas fa-check-circle text-[#4FD1C5] mr-2"></i>
                    Priority support
                  </li>
                  <li className="flex items-center text-gray-300">
                    <i className="fas fa-check-circle text-[#4FD1C5] mr-2"></i>
                    Early access to new features
                  </li>
                </ul>

                {error && (
                  <div className="mb-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                    <i className="fas fa-exclamation-triangle mr-2"></i>
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-3 bg-green-900/20 border border-green-500/50 rounded-lg text-green-400 text-sm">
                    <i className="fas fa-check-circle mr-2"></i>
                    {success}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading || userLoading || !user}
                  className="w-full bg-[#6366F1] hover:bg-[#4F46E5] text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Processing...
                    </>
                  ) : userLoading ? (
                    "Loading..."
                  ) : !user ? (
                    "Please sign in"
                  ) : (
                    <>
                      <i className="fas fa-credit-card mr-2"></i>
                      Subscribe Now
                    </>
                  )}
                </button>

                {!user && (
                  <p className="text-xs text-gray-500 mt-2">
                    You need to sign in before subscribing
                  </p>
                )}
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500">
                By subscribing, you agree to our{" "}
                <a
                  href="/terms"
                  className="text-[#6366F1] hover:text-[#4F46E5] underline"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="/privacy"
                  className="text-[#6366F1] hover:text-[#4F46E5] underline"
                >
                  Privacy Policy
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[100px] animate-pulse"></div>
      </div>
    </div>
  );
}

export default MainComponent;
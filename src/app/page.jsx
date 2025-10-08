"use client";
import React from "react";
import { useState } from "react";
// import SubscriptionUpsell from "../components/subscription-upsell";
import useUser from '../components/use-user'
import useIsSubscribed from '../components/use-is-subscribed'

function MainComponent() {
  const [error, setError] = useState(null);
  const { data: user, loading } = useUser();
  const { isSubscribed, loading: subscriptionLoading } = useIsSubscribed();

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
      </nav>

      <main className="pt-24">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center relative">
          <div className="space-y-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-8 text-white bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
              Welcome to Galixee
            </h1>
            <p className="text-xl md:text-2xl text-[#808080] mb-12 max-w-3xl mx-auto">
              Your gateway to infinite cosmic possibilities
            </p>

            {!loading && !user ? (
              <div className="max-w-md mx-auto bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl shadow-xl">
                <div className="space-y-6">
                  <div className="flex justify-center space-x-4 mb-8">
                    <a
                      href="/account/signin"
                      className="text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-full border border-[#333333] hover:border-[#6366F1]"
                    >
                      Sign In
                    </a>
                    <a
                      href="/account/signup"
                      className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-2 rounded-full transition-colors"
                    >
                      Sign Up
                    </a>
                  </div>

                  <div className="text-center">
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-[#4FD1C5] mb-2">
                        Join Galixee Today
                      </h2>
                      <p className="text-[#808080]">
                        Get started for just $4.99
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#242424] p-4 rounded-lg">
                        <i className="fas fa-shield-check text-[#6366F1] text-xl mb-2"></i>
                        <p className="text-sm text-[#808080]">
                          Secure payment via credit card
                        </p>
                      </div>

                      <div className="bg-[#242424] p-4 rounded-lg">
                        <i className="fas fa-infinity text-[#4FD1C5] text-xl mb-2"></i>
                        <p className="text-sm text-[#808080]">
                          Unlimited access to all features
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[#808080] mt-6">
                    By signing up, you agree to our{" "}
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
            ) : subscriptionLoading ? (
              <div className="rounded-lg bg-gray-100 p-4 animate-pulse">
                Checking subscription status...
              </div>
            ) : !isSubscribed ? (
              <div className="bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl max-w-md mx-auto shadow-xl">
                <h2 className="text-2xl font-bold mb-4">
                  Complete Your Journey
                </h2>
                <p className="text-[#808080] mb-6">
                  Activate your Galixee access for $4.99
                </p>
                <SubscriptionUpsell redirectURL="/welcome" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-[#1A1A1A] border border-[#333333] p-6 rounded-xl inline-flex items-center justify-center space-x-3">
                  <i className="fas fa-check-circle text-[#4FD1C5] text-xl"></i>
                  <span className="text-[#4FD1C5]">
                    Welcome back to your cosmic journey!
                  </span>
                </div>

                <div className="text-center">
                  <a
                    href="/welcome"
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#6366F1] to-[#4FD1C5] hover:from-[#4F46E5] hover:to-[#38B2AC] rounded-full text-white font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                  >
                    <i className="fas fa-rocket mr-3"></i>
                    Enter the FOREVERVERSE
                    <i className="fas fa-arrow-right ml-3"></i>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[100px] animate-pulse"></div>
      </div>

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <p className="flex items-center">
            <i className="fas fa-exclamation-circle mr-2"></i>
            {error}
          </p>
        </div>
      )}
    </div>
  );
}

// Import the SubscriptionUpsell component
function SubscriptionUpsell({ redirectURL }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { data: user, loading: userLoading } = useUser();

  // Add a test to see if the component is rendering
  console.log("SubscriptionUpsell component rendered", {
    user,
    userLoading,
    loading,
  });

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
      console.log("Starting checkout process...");
      console.log("User:", user);
      console.log("Redirect URL:", redirectURL);

      const requestBody = { redirectURL: redirectURL || "/welcome" };
      console.log("Request body:", requestBody);

      const response = await fetch("/api/stripe-checkout-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

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

      if (data.success && data.checkoutUrl) {
        console.log("Success! Checkout URL:", data.checkoutUrl);
        setSuccess("Subscription activated! Redirecting...");

        // Force a page reload to refresh subscription status
        setTimeout(() => {
          console.log("Redirecting to:", data.checkoutUrl);
          window.location.href = data.checkoutUrl;
        }, 1500);
      } else {
        console.error("No checkout URL in response:", data);
        setError("Failed to get checkout URL");
      }
    } catch (error) {
      console.error("Error initiating checkout:", error);
      setError("Failed to start checkout process: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a simple test button to see if clicks work at all
  const testClick = () => {
    console.log("TEST BUTTON CLICKED - JavaScript is working!");
    alert("Test button clicked!");
  };

  return (
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

      {/* Test button to verify JavaScript is working */}
      <button
        onClick={testClick}
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg mb-2 transition-colors"
      >
        🧪 Test Button (Click Me First)
      </button>

      <button
        onClick={(e) => {
          console.log("=== BUTTON CLICKED ===");
          console.log("Event:", e);
          console.log("Button disabled?", loading || userLoading || !user);
          console.log("Loading:", loading);
          console.log("UserLoading:", userLoading);
          console.log("User:", user);
          handleCheckout(e);
        }}
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
  );
}

export default MainComponent;
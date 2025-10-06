"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ redirectURL }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { data: user, loading: userLoading } = useUser();

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

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        throw new Error(
          `HTTP error! status: ${response.status} - ${errorText}`,
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

  // Add a test function to verify the button works
  const testClick = () => {
    console.log("=== TEST CLICK WORKS ===");
    alert("Button click is working!");
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

      {/* Test button to verify clicks work */}
      <button
        onClick={testClick}
        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors mb-2"
      >
        Test Click (Remove this later)
      </button>

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

      {/* Debug info */}
      <div className="mt-4 text-xs text-gray-500">
        Debug: User loading: {userLoading ? "true" : "false"}, User exists:{" "}
        {user ? "true" : "false"}
      </div>
    </div>
  );
}

function StoryComponent() {
  return <MainComponent redirectURL="/account" />;
});
}
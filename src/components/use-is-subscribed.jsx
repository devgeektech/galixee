"use client";
import React from "react";



function useIsSubscribed() {
  const [status, setStatus] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [fetchCount, setFetchCount] = React.useState(0);
  const [error, setError] = React.useState(null);

  const stripeSessionId = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const queryString = window.location.search;
      const urlParams = new URLSearchParams(queryString);
      return urlParams.get("session_id");
    }
    return null;
  }, []);

  const checkSubscription = React.useCallback(async () => {
    try {
      console.log("Checking subscription status...");
      const response = await fetch("/api/get-subscription-status", {
        method: "POST",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Subscription check failed:", {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        });

        setError(null); // Don't show error to user for subscription checks
        setStatus(false);
        setLoading(false);
        return;
      }

      let data;
      try {
        data = await response.json();
        console.log("Subscription response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setError(null);
        setStatus(false);
        setLoading(false);
        return;
      }

      if (!data) {
        console.error("No data received from subscription check");
        setError(null);
        setStatus(false);
        setLoading(false);
        return;
      }

      console.log("=== SUBSCRIPTION HOOK DEBUG ===");
      console.log("Raw response data:", JSON.stringify(data, null, 2));

      if (data.debug) {
        console.log("Backend debug info:", JSON.stringify(data.debug, null, 2));
      }

      const subscriptionStatus =
        data.status || data.subscriptionStatus || "none";
      console.log("Parsed subscription status:", subscriptionStatus);

      if (data.message) {
        console.log("Subscription status message:", data.message);
      }

      const isActiveFromStatus = subscriptionStatus === "active";
      const isActiveFromFlag = data.isActive === true;
      const isActiveFromBypass = data.bypass === true;
      const isActiveFromEnv =
        process.env.NEXT_PUBLIC_CREATE_ENV !== "PRODUCTION";

      const isActive =
        isActiveFromStatus ||
        isActiveFromFlag ||
        isActiveFromBypass ||
        isActiveFromEnv;

      console.log("Subscription analysis:", {
        subscriptionStatus,
        isActiveFromStatus,
        isActiveFromFlag,
        isActiveFromBypass,
        isActiveFromEnv,
        finalIsActive: isActive,
      });

      setError(null);
      setStatus(isActive);
      setLoading(false);
    } catch (error) {
      console.error("Error checking subscription:", error);
      setError(null);
      setStatus(false);
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;

    const runCheck = async () => {
      if (!mounted) return;

      if (!stripeSessionId) {
        await checkSubscription();
      }

      // Polling logic for Stripe session
      if (stripeSessionId && !status && fetchCount < 5) {
        const timer = setTimeout(async () => {
          if (mounted) {
            await checkSubscription();
            setFetchCount((prev) => prev + 1);
          }
        }, 1000 * fetchCount);

        return () => {
          clearTimeout(timer);
        };
      }
    };

    runCheck();

    return () => {
      mounted = false;
    };
  }, [stripeSessionId, status, fetchCount, checkSubscription]);

  return {
    isSubscribed: Boolean(status),
    loading,
    error,
  };
}

// ✅ Proper component using the hook
export default function Index() {
  const { isSubscribed, loading, error } = useIsSubscribed();

  if (loading) return <p>Checking subscription...</p>;
  if (error) return <p>Error checking subscription.</p>;

  return (
    <div>
      <h1>Subscription Status</h1>
      <p>
        {isSubscribed
          ? "✅ You are subscribed!"
          : "❌ You are not subscribed."}
      </p>
    </div>
  );
}





// export default function Index() {
//   return (function useIsSubscribed() {
//   const [status, setStatus] = React.useState(null);
//   const [loading, setLoading] = React.useState(true);
//   const [fetchCount, setFetchCount] = React.useState(0);
//   const [error, setError] = React.useState(null);

//   const stripeSessionId = React.useMemo(() => {
//     if (typeof window !== "undefined") {
//       const queryString = window.location.search;
//       const urlParams = new URLSearchParams(queryString);
//       return urlParams.get("session_id");
//     }
//     return null;
//   }, []);

//   const checkSubscription = React.useCallback(async () => {
//     try {
//       console.log("Checking subscription status...");
//       const response = await fetch("/api/get-subscription-status", {
//         method: "POST",
//       });

//       if (!response.ok) {
//         const errorText = await response.text();
//         console.error("Subscription check failed:", {
//           status: response.status,
//           statusText: response.statusText,
//           body: errorText,
//         });

//         // For new users or temporary issues, don't show error - just set as not subscribed
//         console.log("Setting subscription to false due to API error");
//         setError(null); // Don't show error to user for subscription checks
//         setStatus(false);
//         setLoading(false);
//         return;
//       }

//       let data;
//       try {
//         data = await response.json();
//         console.log("Subscription response data:", data);
//       } catch (parseError) {
//         console.error("Failed to parse response:", parseError);
//         // Don't show parse errors to user - just treat as not subscribed
//         setError(null);
//         setStatus(false);
//         setLoading(false);
//         return;
//       }

//       if (!data) {
//         console.error("No data received from subscription check");
//         // Don't show error to user - just treat as not subscribed
//         setError(null);
//         setStatus(false);
//         setLoading(false);
//         return;
//       }

//       // Enhanced debugging
//       console.log("=== SUBSCRIPTION HOOK DEBUG ===");
//       console.log("Raw response data:", JSON.stringify(data, null, 2));

//       // Log the debug data specifically to see what the backend is seeing
//       if (data.debug) {
//         console.log("Backend debug info:", JSON.stringify(data.debug, null, 2));
//       }

//       // Ensure we have a valid status string
//       const subscriptionStatus =
//         data.status || data.subscriptionStatus || "none";
//       console.log("Parsed subscription status:", subscriptionStatus);

//       // Log any messages for debugging
//       if (data.message) {
//         console.log("Subscription status message:", data.message);
//       }

//       // Enhanced logic to determine if subscription is active
//       const isActiveFromStatus = subscriptionStatus === "active";
//       const isActiveFromFlag = data.isActive === true;
//       const isActiveFromBypass = data.bypass === true; // Handle bypass mode
//       const isActiveFromEnv =
//         process.env.NEXT_PUBLIC_CREATE_ENV !== "PRODUCTION";

//       const isActive =
//         isActiveFromStatus ||
//         isActiveFromFlag ||
//         isActiveFromBypass ||
//         isActiveFromEnv;

//       console.log("Subscription analysis:", {
//         subscriptionStatus,
//         isActiveFromStatus,
//         isActiveFromFlag,
//         isActiveFromBypass,
//         isActiveFromEnv,
//         finalIsActive: isActive,
//       });

//       console.log("Final subscription state:", {
//         isActive,
//         subscriptionStatus,
//       });

//       setError(null);
//       setStatus(isActive);
//       setLoading(false);
//     } catch (error) {
//       console.error("Error checking subscription:", error);
//       // For subscription checks, don't show errors to users - just treat as not subscribed
//       setError(null);
//       setStatus(false);
//       setLoading(false);
//     }
//   }, []);

//   React.useEffect(() => {
//     let mounted = true;

//     const runCheck = async () => {
//       if (!mounted) return;

//       // Initial check
//       if (!stripeSessionId) {
//         await checkSubscription();
//       }

//       // Polling logic for Stripe session
//       if (stripeSessionId && !status && fetchCount < 5) {
//         const timer = setTimeout(async () => {
//           if (mounted) {
//             await checkSubscription();
//             setFetchCount((prev) => prev + 1);
//           }
//         }, 1000 * fetchCount);

//         return () => {
//           clearTimeout(timer);
//         };
//       }
//     };

//     runCheck();

//     return () => {
//       mounted = false;
//     };
//   }, [stripeSessionId, status, fetchCount, checkSubscription]);

//   return {
//     isSubscribed: Boolean(status),
//     loading,
//     error,
//   };
// }

function StoryComponent() {
  const { isSubscribed, loading, error } = useIsSubscribed();

  if (loading) {
    return (
      <div className="rounded-lg bg-gray-100 p-4 animate-pulse">
        Checking subscription status...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-700">
        <i className="fas fa-exclamation-triangle mr-2"></i>
        Error checking subscription status
      </div>
    );
  }

  if (isSubscribed) {
    return (
      <div className="rounded-lg bg-green-50 p-4 text-green-700">
        <i className="fas fa-check-circle mr-2"></i>
        Active subscription
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
      <i className="fas fa-exclamation-circle mr-2"></i>
      No active subscription
    </div>
  );
}
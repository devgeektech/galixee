"use client";
import React from "react";



export default function Index() {
  return (function useIsSubscribed() {
  const [status, setStatus] = React.useState(true); // BYPASS: Always start with true
  const [loading, setLoading] = React.useState(false); // BYPASS: No loading needed
  const [fetchCount, setFetchCount] = React.useState(0);
  const [error, setError] = React.useState(null);

  // BYPASS: Always return subscribed status immediately
  React.useEffect(() => {
    console.log("BYPASS: useIsSubscribed hook - always returning subscribed");
    setStatus(true);
    setLoading(false);
    setError(null);
  }, []);

  return {
    isSubscribed: true, // BYPASS: Always return true
    loading: false, // BYPASS: Never loading
    error: null, // BYPASS: No errors
  };
}

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
        Active subscription (BYPASS MODE)
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-yellow-50 p-4 text-yellow-700">
      <i className="fas fa-exclamation-circle mr-2"></i>
      No active subscription
    </div>
  );
});
}
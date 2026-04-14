"use client";
import React from "react";
import AdBanner from "../../components/ad-banner"
import BetaFeedbackWidget from "../../components/beta-feedback-widget"
function MainComponent() {
  const [user, setUser] = React.useState(null);
  const [userLoading, setUserLoading] = React.useState(true);
  const [sessionDebug, setSessionDebug] = React.useState(null);
  const [showDebug, setShowDebug] = React.useState(false);
  const [sessionEvents, setSessionEvents] = React.useState([]);
  const [showFeedbackWidget, setShowFeedbackWidget] = React.useState(false);
  const [repairAttempted, setRepairAttempted] = React.useState(false);
  const [isRepairing, setIsRepairing] = React.useState(false);

  React.useEffect(() => {
    const checkUser = async () => {
      try {
        const storedSession = localStorage.getItem("galixee_session");
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          if (sessionData.user) {
            setUser(sessionData.user);
            setUserLoading(false);
            addSessionEvent(
              "✅ User found in localStorage: " + sessionData.user.email
            );
            return;
          }
        }

        const response = await fetch("/api/get-session-enhanced", {
          method: "POST",
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.user) {
            setUser(data.user);
            addSessionEvent("✅ User found via API: " + data.user.email);
          } else {
            setUser(null);
            addSessionEvent("❌ No user session found");
          }
        } else {
          setUser(null);
          addSessionEvent("❌ Session API failed");
        }
      } catch (error) {
        console.error("User check failed:", error);
        setUser(null);
        addSessionEvent("❌ Error checking user: " + error.message);
      } finally {
        setUserLoading(false);
      }
    };

    checkUser();
  }, []);

  React.useEffect(() => {
    const checkSession = async () => {
      if (repairAttempted || isRepairing) {
        addSessionEvent("Skipping session check - repair already attempted");
        return;
      }

      const lastRepairTime = localStorage.getItem("last_repair_attempt");
      if (lastRepairTime) {
        const timeSinceRepair = Date.now() - parseInt(lastRepairTime);
        if (timeSinceRepair < 10000) {
          addSessionEvent(
            "Recent repair attempt detected, skipping auto-repair"
          );
          setRepairAttempted(true);
          return;
        }
      }

      try {
        const enhancedResponse = await fetch("/api/get-session-enhanced", {
          method: "POST",
        });

        if (enhancedResponse.ok) {
          const enhancedData = await enhancedResponse.json();
          if (enhancedData && enhancedData.user) {
            addSessionEvent(
              "✅ Enhanced session found: " + enhancedData.user.email
            );
            return;
          }
        }

        const response = await fetch("/api/session-health-check", {
          method: "POST",
        });
        const data = await response.json();
        setSessionDebug(data);

        if (data.status !== "healthy") {
          setShowDebug(true);
          addSessionEvent("Session health check failed: " + data.status);

          if (!user && !userLoading) {
            setIsRepairing(true);

            addSessionEvent("Ensuring test user exists...");
            try {
              const ensureUserResponse = await fetch("/api/ensure-test-user", {
                method: "POST",
              });

              const ensureUserResult = await ensureUserResponse.json();
              console.log("Ensure test user result:", ensureUserResult);

              if (ensureUserResult.success) {
                addSessionEvent(
                  "✅ Test user ready: " + ensureUserResult.user.email
                );
              } else {
                addSessionEvent(
                  "❌ Failed to ensure test user: " + ensureUserResult.error
                );
              }
            } catch (ensureError) {
              addSessionEvent(
                "❌ Error ensuring test user: " + ensureError.message
              );
            }

            const storedEmail =
              localStorage.getItem("sandbox_email") || "test@example.com";
            if (storedEmail) {
              addSessionEvent("Attempting one-time session repair...");
              try {
                localStorage.setItem(
                  "last_repair_attempt",
                  Date.now().toString()
                );
                setRepairAttempted(true);

                const repairResponse = await fetch("/api/session-repair", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    email: storedEmail,
                    forceRepair: true,
                  }),
                });

                const repairResult = await repairResponse.json();
                console.log("Session repair result:", repairResult);

                if (repairResult.success) {
                  addSessionEvent(
                    "✅ Session repair successful! Refreshing once..."
                  );
                  setTimeout(() => {
                    localStorage.setItem("repair_completed", "true");
                    window.location.reload();
                  }, 1500);
                } else {
                  addSessionEvent(
                    "❌ Session repair failed: " + repairResult.error
                  );
                  addSessionEvent("Please try signing in manually");
                  setIsRepairing(false);
                }
              } catch (repairError) {
                addSessionEvent(
                  "❌ Session repair error: " + repairError.message
                );
                setIsRepairing(false);
              }
            } else {
              addSessionEvent("No stored email found for repair");
              setIsRepairing(false);
            }
          } else {
            addSessionEvent("User already loaded or loading, skipping repair");
          }
        } else {
          addSessionEvent("Session health check passed");
          localStorage.removeItem("last_repair_attempt");
          localStorage.removeItem("repair_completed");
        }
      } catch (err) {
        console.error("Session check failed:", err);
        addSessionEvent("Session check error: " + err.message);
        setIsRepairing(false);
      }
    };

    const repairCompleted = localStorage.getItem("repair_completed");
    if (!repairCompleted) {
      checkSession();
    } else {
      addSessionEvent("Repair recently completed, skipping auto-check");
      setTimeout(() => {
        localStorage.removeItem("repair_completed");
      }, 30000);
    }
  }, [user, userLoading, repairAttempted, isRepairing]);

  React.useEffect(() => {
    const sessionActive = localStorage.getItem("sandbox_session_active");
    const sessionTime = localStorage.getItem("sandbox_session_time");

    if (sessionActive && sessionTime) {
      const timeAgo = Date.now() - parseInt(sessionTime);
      console.log("Sandbox session info:", {
        active: sessionActive,
        timeAgo: Math.round(timeAgo / 1000) + " seconds ago",
      });
      addSessionEvent(
        `Sandbox session found (${Math.round(timeAgo / 1000)}s ago)`
      );
    } else {
      addSessionEvent("No sandbox session found in localStorage");
    }
  }, []);

  React.useEffect(() => {
    const validateSession = async () => {
      try {
        const response = await fetch("/api/session-persistence-handler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "validate" }),
        });
        const data = await response.json();

        if (!data.valid && data.needsReauth) {
          addSessionEvent("Session validation failed - needs re-auth");
          const storedEmail = localStorage.getItem("sandbox_email");
          if (storedEmail) {
            addSessionEvent("Attempting session restore for: " + storedEmail);
          }
        } else if (data.valid) {
          addSessionEvent("Session validation successful");
        }
      } catch (error) {
        addSessionEvent("Session validation error: " + error.message);
      }
    };

    if (user) {
      validateSession();
    }
  }, [user]);

  const addSessionEvent = (message) => {
    setSessionEvents((prev) => [
      ...prev.slice(-9),
      {
        message,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      const response = await fetch("/api/beta-feedback-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "submit",
          feedback_type: feedbackData.type,
          title: feedbackData.title,
          description: feedbackData.description,
          page_url: window.location.href,
          browser_info: {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.platform,
          },
          device_info: feedbackData.deviceInfo,
          screenshot_url: feedbackData.screenshot
            ? "screenshot_captured"
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      const result = await response.json();
      console.log("Feedback submitted successfully:", result);

      addSessionEvent("Beta feedback submitted successfully");
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      addSessionEvent("Failed to submit feedback: " + error.message);
      throw error;
    }
  };

  const welcomeAds = [
    {
      id: "ext_1",
      title: "Real Estate Commander",
      description: "Master your real estate investments",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "https://www.realestatecommander.com",
      backgroundColor: "#2563EB",
    },
    {
      id: "ext_2",
      title: "Wing & Collar",
      description:
        "Modern rank for the modern pilot - Magnetic collar bars that fly with you",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "https://www.wingandcollar.com",
      backgroundColor: "#1E3A8A",
    },
  ];

  const handleAdClick = (ad) => {
    console.log("Welcome page ad clicked:", ad);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#6366F1] mb-4"></i>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const features = [
    {
      title: "Profile Page",
      icon: "fa-user",
      description: "Manage your personal information in the Galixee",
      href: "/profile",
    },
    {
      title: "My Weather",
      icon: "fa-cloud-sun",
      description: "Get a quick view of the weather in your Galixee",
      href: user ? "/my-weather" : "/account/signin?callbackUrl=/my-weather",
    },
    {
      title: "Talk with Me",
      icon: "fa-comments",
      description: "Ask me Galactic questions about my Galixee",
      href: user
        ? "/talk-with-me"
        : "/account/signin?callbackUrl=/talk-with-me",
    },
    {
      title: "Education History",
      icon: "fa-graduation-cap",
      description: "Places which launched my Galactic academic journey",
      href: user
        ? "/education-history"
        : "/account/signin?callbackUrl=/education-history",
    },
    {
      title: "Employment History",
      icon: "fa-briefcase",
      description: "Interstellar locations where I contributed my talent",
      href: user
        ? "/employment-history"
        : "/account/signin?callbackUrl=/employment-history",
    },
    {
      title: "Health and Wellbeing",
      icon: "fa-heart-pulse",
      description: "My cosmic vitality ensuring I'm mission ready",
      href: user
        ? "/health-and-wellbeing"
        : "/account/signin?callbackUrl=/health-and-wellbeing",
    },
    {
      title: "Pre-Messaging",
      icon: "fa-envelope",
      description: "My messages being sent into the future cosmos",
      href: user
        ? "/pre-messaging"
        : "/account/signin?callbackUrl=/pre-messaging",
    },
    {
      title: "Family Tree",
      icon: "fa-tree",
      description: "My Galixee's constellations of connections",
      href: user ? "/family-tree" : "/account/signin?callbackUrl=/family-tree",
    },
    {
      title: "Social Media Links",
      icon: "fa-share-nodes",
      description: "My social media outposts in other Galixees",
      href: user
        ? "/social-media"
        : "/account/signin?callbackUrl=/social-media",
    },
    {
      title: "Digital Vault",
      icon: "fa-vault",
      description:
        "My fortified nebula where my cosmic credentials are stored and secured",
      href: user
        ? "/digital-vault"
        : "/account/signin?callbackUrl=/digital-vault",
    },
    {
      title: "Pictures",
      icon: "fa-images",
      description: "My cosmic picture gallery",
      href: user ? "/pictures" : "/account/signin?callbackUrl=/pictures",
    },
    {
      title: "Videos",
      icon: "fa-video",
      description: "My cosmic videos are launched and landed here",
      href: user ? "/videos" : "/account/signin?callbackUrl=/videos",
    },
    {
      title: "Life Skills",
      icon: "fa-star",
      description:
        "Embark on your journey through the Cosmic Academy learning life skills as you travel the Galixee",
      href: user ? "/life-skills" : "/account/signin?callbackUrl=/life-skills",
    },
    {
      title: "End of Life Planning",
      icon: "fa-scroll",
      description:
        "My guide to organize my wishes and memories for my loved ones as I prepare for my final voyage across the cosmos",
      href: user
        ? "/end-of-life-planning"
        : "/account/signin?callbackUrl=/end-of-life-planning",
    },
    {
      title: "Mission into Space",
      icon: "fa-rocket",
      description: "Your journey to the stars",
      href: user
        ? "/mission-into-space"
        : "/account/signin?callbackUrl=/mission-into-space",
    },
    {
      title: "DNA Services",
      icon: "fa-dna",
      description: "My connection to other Galixees and universes",
      href: user
        ? "/dna-services"
        : "/account/signin?callbackUrl=/dna-services",
    },
    {
      title: "My Journal",
      icon: "fa-book",
      description: "Document your life journey",
      href: user ? "/my-journal" : "/account/signin?callbackUrl=/my-journal",
    },
    {
      title: "My Creations",
      icon: "fa-palette",
      description: "Manage and protect your creative works",
      href: user
        ? "/my-creations"
        : "/account/signin?callbackUrl=/my-creations",
    },
    {
      title: "My Quotes",
      icon: "fa-quote-left",
      description: "Collection of inspiring quotes and wisdom",
      href: user ? "/my-quotes" : "/account/signin?callbackUrl=/my-quotes",
    },
  ];

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto pb-24">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs px-2 py-1 bg-[#333] rounded text-gray-400 hover:text-white"
          >
            Debug ({sessionEvents.length})
          </button>
          {user && (
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/test-routes", {
                    method: "POST",
                  });
                  const data = await response.json();
                  console.log("Route test results:", data);
                  addSessionEvent("Route test completed - check console");
                } catch (error) {
                  console.error("Route test failed:", error);
                  addSessionEvent("Route test failed: " + error.message);
                }
              }}
              className="text-xs px-2 py-1 bg-[#444] rounded text-gray-400 hover:text-white"
            >
              Test Routes
            </button>
          )}
          {user && (
            <a
              href="/account/logout"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Sign Out
            </a>
          )}
        </div>
      </nav>

      {showDebug && (
        <div className="fixed top-20 right-4 bg-[#1A1A1A] border border-[#333] rounded-lg p-4 text-xs z-40 max-w-sm max-h-96 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="font-semibold">Session Debug</span>
            <button
              onClick={() => setShowDebug(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          {sessionDebug && (
            <div className="space-y-1 text-gray-300 mb-4 pb-4 border-b border-[#333]">
              <div>
                Status:{" "}
                <span
                  className={
                    sessionDebug.status === "healthy"
                      ? "text-green-400"
                      : "text-red-400"
                  }
                >
                  {sessionDebug.status}
                </span>
              </div>
              <div>Session: {sessionDebug.sessionExists ? "✅" : "❌"}</div>
              {sessionDebug.sessionData && (
                <>
                  <div>
                    User: {sessionDebug.sessionData.hasUser ? "✅" : "❌"}
                  </div>
                  <div>
                    Email: {sessionDebug.sessionData.userEmail || "None"}
                  </div>
                </>
              )}
              <div className="pt-2 border-t border-[#333]">
                <div>
                  Time: {new Date(sessionDebug.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="font-semibold mb-2">Recent Events:</div>
            <div className="space-y-1">
              {sessionEvents.map((event, index) => (
                <div key={index} className="text-gray-400">
                  <span className="text-[#6366F1]">{event.timestamp}</span>
                  <div className="text-xs">{event.message}</div>
                </div>
              ))}
              {sessionEvents.length === 0 && (
                <div className="text-gray-500 italic">No events yet...</div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-[#333]">
              <button
                onClick={async () => {
                  const storedEmail = localStorage.getItem("sandbox_email");
                  if (!storedEmail) {
                    addSessionEvent("❌ No stored email for repair");
                    return;
                  }

                  addSessionEvent("🔧 Manual session repair started...");
                  try {
                    const response = await fetch("/api/session-repair", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        email: storedEmail,
                        forceRepair: true,
                      }),
                    });

                    const result = await response.json();
                    console.log("Manual repair result:", result);

                    if (result.success) {
                      addSessionEvent("✅ Manual repair successful!");
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      addSessionEvent(
                        "❌ Manual repair failed: " + result.error
                      );
                    }
                  } catch (error) {
                    addSessionEvent("❌ Manual repair error: " + error.message);
                  }
                }}
                className="w-full text-xs px-2 py-1 bg-[#6366F1] hover:bg-[#4F46E5] rounded text-white transition-colors"
              >
                🔧 Repair Session
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Welcome to Galixeedsds
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            This is your Galixee in the Foreververse. Build YOUR GALIXEE how you
            want to be remembered.
          </p>

          {!user && !isRepairing && (
            <div className="mt-6 p-4 bg-orange-900/20 border border-orange-500/50 rounded-lg text-orange-400 max-w-md mx-auto">
              <p className="text-sm mb-3">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                Session not found. Click below to sign in automatically.
              </p>
              <button
                onClick={async () => {
                  addSessionEvent("🔧 Redirecting to auto sign-in...");
                  setIsRepairing(true);

                  try {
                    const callbackUrl = encodeURIComponent(
                      window.location.pathname
                    );
                    window.location.href = `/auto-signin?callbackUrl=${callbackUrl}`;
                  } catch (error) {
                    addSessionEvent("❌ Error: " + error.message);
                    setIsRepairing(false);
                  }
                }}
                className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white text-sm transition-colors"
                disabled={isRepairing}
              >
                {isRepairing ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Setting up...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In Automatically
                  </>
                )}
              </button>
            </div>
          )}

          {isRepairing && (
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg text-blue-400 max-w-md mx-auto">
              <p className="text-sm">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Setting up your session... Please wait.
              </p>
            </div>
          )}

          {user && (
            <div className="mt-6 p-3 bg-green-900/20 border border-green-500/50 rounded-lg text-green-400 max-w-md mx-auto">
              <p className="text-sm">
                <i className="fas fa-check-circle mr-2"></i>
                Session active for {user.email}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <a
              key={index}
              href={feature.href}
              className={`group bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 hover:border-[#6366F1] transition-colors ${
                !feature.href ? "pointer-events-none" : ""
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-lg bg-[#242424] flex items-center justify-center group-hover:bg-[#6366F1]/10 transition-colors">
                  <i
                    className={`fas ${feature.icon} text-[#6366F1] text-xl`}
                  ></i>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{feature.description}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>

      <AdBanner
        ads={welcomeAds}
        onAdClick={handleAdClick}
        autoRotateInterval={15000}
      />

      <BetaFeedbackWidget
        isOpen={showFeedbackWidget}
        onToggle={() => setShowFeedbackWidget(!showFeedbackWidget)}
        onSubmit={handleFeedbackSubmit}
        position="bottom-right"
        theme="dark"
      />
    </div>
  );
}

export default MainComponent;
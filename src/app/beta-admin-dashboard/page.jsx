"use client";
import React, { useState, useEffect } from "react";
import useUser from '../../components/use-user'

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [betaUsers, setBetaUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    feedbackCount: 0,
    avgRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      //window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    if (user) {
      fetchDashboardData();
    }
  }, [user, userLoading]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data with timeout and error handling
      const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          // Check if response is HTML (error page) instead of JSON
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            const text = await response.text();
            console.error("Non-JSON response:", text.substring(0, 200));
            throw new Error(
              `Server returned HTML instead of JSON. Status: ${response.status}`
            );
          }

          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          if (error.name === "AbortError") {
            throw new Error("Request timed out");
          }
          throw error;
        }
      };

      // Fetch users and stats first (these are more critical)
      console.log("Fetching beta users...");
      const usersResponse = await fetchWithTimeout(
        "/api/beta-user-management",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_beta_users" }),
        }
      );

      if (!usersResponse.ok) {
        throw new Error(
          `Failed to fetch users: ${usersResponse.status} ${usersResponse.statusText}`
        );
      }

      const usersData = await usersResponse.json();
      const statsResponse = await fetchWithTimeout(
        "/api/beta-user-management",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "get_beta_statistics" }),
        }
      );

      if (!statsResponse.ok) {
        throw new Error(
          `Failed to fetch stats: ${statsResponse.status} ${statsResponse.statusText}`
        );
      }

      const statsData = await statsResponse.json();
      console.log("Stats data:", statsData);

      // Check for API errors
      if (usersData.error) {
        throw new Error(`Users API Error: ${usersData.error}`);
      }
      if (statsData.error) {
        throw new Error(`Stats API Error: ${statsData.error}`);
      }

      setBetaUsers(usersData.betaUsers || []);
      setStats({
        totalUsers: statsData.statistics?.totalBetaUsers || 0,
        activeUsers: statsData.statistics?.activeBetaUsers || 0,
        feedbackCount: statsData.statistics?.feedbackStats?.total_feedback || 0,
        avgRating: 4.2, // placeholder since we don't have rating data yet
      });

      // Try to fetch feedback separately with error handling
      try {
        console.log("Fetching feedback...");
        const feedbackResponse = await fetchWithTimeout(
          "/api/beta-feedback-handler",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "get_admin_feedback" }),
          }
        );

        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          console.log("Feedback data:", feedbackData);
          if (feedbackData.error) {
            console.warn("Feedback API Error:", feedbackData.error);
            setFeedback([]);
          } else {
            setFeedback(feedbackData.feedback || []);
          }
        } else {
          console.warn(
            `Failed to fetch feedback data: ${feedbackResponse.status} ${feedbackResponse.statusText}`
          );
          setFeedback([]);
        }
      } catch (feedbackError) {
        console.warn("Feedback fetch failed:", feedbackError);
        setFeedback([]);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(`Dashboard Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch("/api/beta-user-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_beta_user",
          email: userData.email,
          betaGroup: userData.access_level || "general",
          notes: userData.notes,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create beta user");
      }

      await fetchDashboardData();
      setIsCreatingUser(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdateUserStatus = async (userId, status) => {
    try {
      const response = await fetch("/api/beta-user-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_beta_user",
          userId,
          isActive: status === "active",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user status");
      }

      await fetchDashboardData();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this beta user?")) {
      return;
    }

    try {
      const response = await fetch("/api/beta-user-management", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_beta_user",
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      await fetchDashboardData();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusColor = (isActive) => {
    if (isActive) {
      return "text-green-400";
    } else {
      return "text-gray-400";
    }
  };

  const getStatusText = (isActive) => {
    return isActive ? "Active" : "Inactive";
  };

  const getFeedbackTypeColor = (type) => {
    switch (type) {
      case "bug":
        return "text-red-400";
      case "feature":
        return "text-blue-400";
      case "improvement":
        return "text-yellow-400";
      default:
        return "text-gray-400";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#6366F1] mb-4"></i>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee Admin
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

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Beta Testing Dashboard
          </h1>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={async () => {
                try {
                  console.log("Testing new debug endpoint...");
                  const response = await fetch("/api/feedback-debug-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "test" }),
                  });

                  console.log("Debug test response status:", response.status);
                  const result = await response.json();
                  console.log("Debug test result:", result);

                  if (result.success) {
                    alert(
                      `✅ Debug endpoint working!\nMethod: ${
                        result.debug.method
                      }\nBody keys: ${result.debug.bodyKeys.join(
                        ", "
                      )}\nUser ID: ${result.debug.userId}`
                    );
                  } else {
                    alert(`❌ Debug endpoint failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("Debug test error:", err);
                  alert(`❌ Debug test error: ${err.message}`);
                }
              }}
              className="bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-flask mr-2"></i>
              Test Debug Endpoint
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing simple API endpoint...");
                  const response = await fetch("/api/test-feedback-endpoint", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("Test endpoint result:", result);

                  if (result.success) {
                    alert(
                      `✅ Test endpoint working!\nAuthenticated: ${result.authenticated}\nUser: ${result.user?.email}`
                    );
                  } else {
                    alert(`❌ Test endpoint failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("Test endpoint error:", err);
                  alert(`❌ Test endpoint error: ${err.message}`);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-flask mr-2"></i>
              Test API
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing parameter passing...");
                  const response = await fetch("/api/debug-feedback-params", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "get_admin_feedback",
                      test_param: "hello",
                    }),
                  });

                  const result = await response.json();
                  console.log("=== PARAMETER DEBUG RESULTS ===");
                  console.log(JSON.stringify(result, null, 2));
                  console.log("===============================");

                  if (result.debug_info) {
                    const debug = result.debug_info;
                    alert(
                      `🔍 PARAMETER DEBUG:\n\n` +
                        `✅ Session: ${debug.session_exists}\n` +
                        `👤 User ID: ${debug.user_id}\n` +
                        `📝 Action received: ${debug.received_parameters.action}\n` +
                        `🔑 All keys: ${debug.all_keys.join(", ")}\n\n` +
                        `Check console for full details!`
                    );
                  } else {
                    alert(`❌ Debug failed: ${JSON.stringify(result)}`);
                  }
                } catch (err) {
                  console.error("Parameter debug error:", err);
                  alert(`❌ Parameter debug error: ${err.message}`);
                }
              }}
              className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-bug mr-2"></i>
              Debug Parameters
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing NEW feedback endpoint v2...");
                  const response = await fetch(
                    "/api/beta-feedback-handler-v2",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "getAdminFeedback" }),
                    }
                  );

                  console.log("V2 Response status:", response.status);
                  console.log(
                    "V2 Response headers:",
                    Object.fromEntries(response.headers.entries())
                  );

                  const result = await response.json();
                  console.log("V2 feedback test result:", result);

                  if (result.success) {
                    alert(
                      `✅ NEW Feedback endpoint working!\nFound ${
                        result.feedback?.length || 0
                      } feedback items`
                    );
                  } else {
                    alert(`❌ NEW Feedback endpoint failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("V2 feedback test error:", err);
                  alert(`❌ V2 feedback test error: ${err.message}`);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-rocket mr-2"></i>
              Test NEW Feedback API
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing feedback endpoint directly...");
                  const response = await fetch("/api/beta-feedback-handler", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "get_admin_feedback" }),
                  });

                  console.log("Response status:", response.status);
                  console.log(
                    "Response headers:",
                    Object.fromEntries(response.headers.entries())
                  );

                  const result = await response.json();
                  console.log("Direct feedback test result:", result);

                  if (result.success) {
                    alert(
                      `✅ Feedback endpoint working!\nFound ${
                        result.feedback?.length || 0
                      } feedback items`
                    );
                  } else {
                    alert(`❌ Feedback endpoint failed: ${result.error}`);
                  }
                } catch (err) {
                  console.error("Direct feedback test error:", err);
                  alert(`❌ Direct feedback test error: ${err.message}`);
                }
              }}
              className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-comments mr-2"></i>
              Test Feedback API
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Running comprehensive session debug...");
                  const response = await fetch("/api/session-debug", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("=== COMPREHENSIVE SESSION DEBUG ===");
                  console.log(JSON.stringify(result, null, 2));
                  console.log("===================================");

                  if (result.success) {
                    const debug = result.debug;
                    const analysis = debug.analysis;

                    let message = `🔍 SESSION DEBUG RESULTS:\n\n`;
                    message += `✅ Session Working: ${analysis.sessionWorking}\n`;
                    message += `👤 Has User ID: ${analysis.hasUserId}\n`;
                    message += `📧 Has User Email: ${analysis.hasUserEmail}\n`;
                    message += `🗄️ DB Has Sessions: ${analysis.databaseHasSessions} (${debug.totalActiveSessions} total)\n`;
                    message += `🔑 User Has Active Sessions: ${analysis.userHasActiveSessions}\n\n`;

                    if (debug.sessionFromGetSession) {
                      message += `Current Session User: ${
                        debug.sessionFromGetSession.user?.email || "No email"
                      }\n`;
                      message += `Session Keys: ${debug.sessionFromGetSession.allSessionKeys?.join(
                        ", "
                      )}\n`;
                    } else {
                      message += `❌ NO SESSION FROM getSession()\n`;
                    }

                    message += `\nCheck console for full details.`;

                    alert(message);
                    setError(null);
                  } else {
                    setError(`Session debug failed: ${result.error}`);
                  }
                } catch (err) {
                  setError("Failed to run session debug: " + err.message);
                }
              }}
              className="bg-cyan-600 hover:bg-cyan-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-search mr-2"></i>
              Full Session Debug
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Fixing session persistence...");
                  const response = await fetch("/api/fix-session-persistence", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("Session persistence fix result:", result);

                  if (result.success) {
                    if (result.repaired) {
                      setError(null);
                      alert(
                        `✅ Session persistence FIXED!\n\nUser: ${
                          result.user?.email
                        }\nNew session created: ${result.newSession?.sessionToken?.substring(
                          0,
                          20
                        )}...`
                      );
                    } else {
                      setError(null);
                      alert(
                        `✅ Session persistence is healthy!\n\nUser: ${result.user?.email}\nActive sessions: ${result.diagnostics?.activeSessions}`
                      );
                    }
                  } else {
                    setError(`❌ Session fix failed: ${result.error}`);
                  }
                } catch (err) {
                  setError("Failed to fix session persistence: " + err.message);
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-wrench mr-2"></i>
              Fix Sessions
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Checking session health...");
                  const response = await fetch("/api/session-health-check", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("Session health check result:", result);
                  if (result.status === "healthy") {
                    setError(null);
                    alert(
                      `✅ Session is healthy! User: ${
                        result.sessionData?.userEmail || "Unknown"
                      }`
                    );
                  } else {
                    setError(`❌ Session issue: ${result.status}`);
                    console.error("Session health details:", result);
                  }
                } catch (err) {
                  setError("Failed to check session health: " + err.message);
                }
              }}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-heartbeat mr-2"></i>
              Check Session
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Debugging session flow...");
                  const response = await fetch("/api/debug-session-flow", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("Session flow debug result:", result);

                  if (result.success) {
                    const debug = result.debug;
                    const sessionInfo = debug.sessionFromGetSession
                      ? `✅ Session Found: ${
                          debug.sessionFromGetSession.user?.email || "Unknown"
                        }`
                      : `❌ No Session Found`;

                    const dbInfo = `DB Sessions: ${
                      debug.databaseSessions?.length || 0
                    } (User Active: ${
                      debug.userActiveSessions || 0
                    }, Total Active: ${debug.totalActiveSessions})`;

                    const globalInfo = debug.globalStats
                      ? `Global Stats: ${debug.globalStats.total_sessions} total, ${debug.globalStats.active_sessions} active, ${debug.globalStats.expired_sessions} expired`
                      : "No global stats available";

                    alert(
                      `Session Flow Debug:\n\n${sessionInfo}\n${dbInfo}\n${globalInfo}\n\nCheck console for full details`
                    );
                    setError(null);
                  } else {
                    setError(`Session debug failed: ${result.error}`);
                  }
                } catch (err) {
                  setError("Failed to debug session flow: " + err.message);
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-bug mr-2"></i>
              Debug Session
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing method detection...");
                  const response = await fetch("/api/feedback-method-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "get_admin_feedback",
                      test: "hello",
                    }),
                  });

                  console.log("Method test response status:", response.status);
                  const result = await response.json();
                  console.log("=== METHOD TEST RESULTS ===");
                  console.log(JSON.stringify(result, null, 2));
                  console.log("===========================");

                  if (result.success) {
                    const debug = result.debug;
                    alert(
                      `🔍 METHOD TEST:\n\n` +
                        `✅ Method: ${debug.directMethod || "none"}\n` +
                        `📦 Has Body: ${debug.directBody ? "yes" : "no"}\n` +
                        `📝 Body Type: ${debug.paramsType || "unknown"}\n` +
                        `👤 User ID: ${debug.userId || "none"}\n` +
                        `🔑 Content-Type: ${debug.contentType || "none"}\n\n` +
                        `Check console for full details!`
                    );
                  } else {
                    alert(`❌ Method test failed: ${JSON.stringify(result)}`);
                  }
                } catch (err) {
                  console.error("Method test error:", err);
                  alert(`❌ Method test error: ${err.message}`);
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-vial mr-2"></i>
              Test Method
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Creating test user...");
                  const response = await fetch("/api/create-test-user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("Create test user result:", result);
                  if (result.success) {
                    setError(null);
                    alert("Test user created successfully!");
                  } else {
                    setError(result.error || "Failed to create test user");
                  }
                } catch (err) {
                  setError("Failed to create test user: " + err.message);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-user-plus mr-2"></i>
              Create Test User
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing password verification...");
                  const response = await fetch(
                    "/api/test-password-verification",
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                    }
                  );
                  const result = await response.json();
                  console.log("Password verification result:", result);
                  if (result.success) {
                    if (result.passwordValid) {
                      setError(null);
                      alert(
                        "✅ Password verification PASSED! Authentication should work."
                      );
                    } else {
                      setError(
                        "❌ Password verification FAILED - hash mismatch detected"
                      );
                    }
                  } else {
                    setError(
                      result.error || "Failed to test password verification"
                    );
                  }
                } catch (err) {
                  setError(
                    "Failed to test password verification: " + err.message
                  );
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-key mr-2"></i>
              Test Password
            </button>
            <button
              onClick={async () => {
                try {
                  console.log("Testing session comparison...");
                  const response = await fetch("/api/session-comparison-test", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                  });
                  const result = await response.json();
                  console.log("=== SESSION COMPARISON TEST ===");
                  console.log(JSON.stringify(result, null, 2));
                  console.log("===============================");

                  if (result.sessionComparison) {
                    const comp = result.sessionComparison;
                    alert(
                      `🔍 SESSION COMPARISON:\n\n` +
                        `✅ Session Found: ${comp.sessionExists}\n` +
                        `👤 User ID: ${comp.userId}\n` +
                        `📧 Email: ${comp.userEmail}\n` +
                        `🏷️ Name: ${comp.userName || "None"}\n\n` +
                        `Check console for full details!`
                    );
                  } else {
                    alert(`❌ Session comparison failed: ${result.error}`);
                  }
                } catch (err) {
                  setError("Failed to run session comparison: " + err.message);
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-balance-scale mr-2"></i>
              Compare Sessions
            </button>
            <button
              onClick={() => setIsCreatingUser(true)}
              className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center"
            >
              <i className="fas fa-plus mr-2"></i>
              Create Beta User
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Beta Users</p>
                <p className="text-3xl font-bold text-white">
                  {stats.totalUsers}
                </p>
              </div>
              <i className="fas fa-users text-[#6366F1] text-2xl"></i>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-3xl font-bold text-green-400">
                  {stats.activeUsers}
                </p>
              </div>
              <i className="fas fa-user-check text-green-400 text-2xl"></i>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Feedback Items</p>
                <p className="text-3xl font-bold text-[#4FD1C5]">
                  {stats.feedbackCount}
                </p>
              </div>
              <i className="fas fa-comment-dots text-[#4FD1C5] text-2xl"></i>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Rating</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {stats.avgRating.toFixed(1)}
                </p>
              </div>
              <i className="fas fa-star text-yellow-400 text-2xl"></i>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <div className="flex space-x-1 mb-6 border-b border-[#333333]">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-[#6366F1] border-b-2 border-[#6366F1]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "users"
                  ? "text-[#6366F1] border-b-2 border-[#6366F1]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Beta Users
            </button>
            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "feedback"
                  ? "text-[#6366F1] border-b-2 border-[#6366F1]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Feedback
            </button>
            <button
              onClick={() => setActiveTab("activity")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "activity"
                  ? "text-[#6366F1] border-b-2 border-[#6366F1]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Activity
            </button>
          </div>

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#242424] rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    User Status Distribution
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Active</span>
                      <span className="text-green-400 font-medium">
                        {betaUsers.filter((u) => u.status === "active").length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Inactive</span>
                      <span className="text-gray-400 font-medium">
                        {
                          betaUsers.filter((u) => u.status === "inactive")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Suspended</span>
                      <span className="text-red-400 font-medium">
                        {
                          betaUsers.filter((u) => u.status === "suspended")
                            .length
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#242424] rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Feedback Types
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Bug Reports</span>
                      <span className="text-red-400 font-medium">
                        {feedback.filter((f) => f.type === "bug").length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Feature Requests</span>
                      <span className="text-blue-400 font-medium">
                        {feedback.filter((f) => f.type === "feature").length}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Improvements</span>
                      <span className="text-yellow-400 font-medium">
                        {
                          feedback.filter((f) => f.type === "improvement")
                            .length
                        }
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">General</span>
                      <span className="text-gray-400 font-medium">
                        {feedback.filter((f) => f.type === "feedback").length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#242424] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  Recent Activity
                </h3>
                <div className="space-y-4">
                  {betaUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between py-2 border-b border-[#333333] last:border-b-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#6366F1] rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {user.name || "Unknown User"}
                          </p>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm font-medium ${getStatusColor(
                            user.status
                          )}`}
                        >
                          {user.status}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {user.last_active
                            ? new Date(user.last_active).toLocaleDateString()
                            : "Never"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#333333]">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        User
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Joined
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Last Active
                      </th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {betaUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#333333] hover:bg-[#242424]"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#6366F1] rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {user.name
                                  ? user.name.charAt(0).toUpperCase()
                                  : "U"}
                              </span>
                            </div>
                            <span className="text-white font-medium">
                              {user.name || "Unknown User"}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`font-medium ${getStatusColor(
                              user.status
                            )}`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString()
                            : "Unknown"}
                        </td>
                        <td className="py-3 px-4 text-gray-400">
                          {user.last_active
                            ? new Date(user.last_active).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <select
                              value={user.status}
                              onChange={(e) =>
                                handleUpdateUserStatus(user.id, e.target.value)
                              }
                              className="bg-[#333333] border border-[#444444] rounded px-2 py-1 text-white text-sm"
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="suspended">Suspended</option>
                            </select>
                            <button
                              onClick={() => setSelectedUser(user)}
                              className="text-[#6366F1] hover:text-[#4F46E5] p-1"
                              title="View Details"
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-400 hover:text-red-300 p-1"
                              title="Delete User"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "feedback" && (
            <div className="space-y-4">
              {feedback.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-comment-dots text-gray-600 text-4xl mb-4"></i>
                  <p className="text-gray-400 text-lg">
                    No feedback submitted yet
                  </p>
                  <p className="text-gray-500 text-sm">
                    Feedback will appear here when users submit it
                  </p>
                </div>
              ) : (
                feedback.map((item) => (
                  <div key={item.id} className="bg-[#242424] rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-white font-bold text-lg">
                          {item.title}
                        </h4>
                        <div className="flex items-center space-x-4 mt-2">
                          <span
                            className={`text-sm font-medium ${getFeedbackTypeColor(
                              item.feedback_type
                            )}`}
                          >
                            {item.feedback_type}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {item.user_email || "Anonymous"}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {item.created_at
                              ? new Date(item.created_at).toLocaleDateString()
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button className="text-[#6366F1] hover:text-[#4F46E5] p-2">
                          <i className="fas fa-reply"></i>
                        </button>
                        <button className="text-red-400 hover:text-red-300 p-2">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-300 mb-4">{item.description}</p>
                    {item.device_info && (
                      <div className="bg-[#1A1A1A] p-3 rounded border border-[#333333]">
                        <p className="text-gray-400 text-sm">
                          <strong>Device Info:</strong>{" "}
                          {typeof item.device_info === "string"
                            ? item.device_info
                            : JSON.stringify(item.device_info)}
                        </p>
                      </div>
                    )}
                    {item.browser_info && (
                      <div className="bg-[#1A1A1A] p-3 rounded border border-[#333333] mt-2">
                        <p className="text-gray-400 text-sm">
                          <strong>Browser Info:</strong>{" "}
                          {typeof item.browser_info === "string"
                            ? item.browser_info
                            : JSON.stringify(item.browser_info)}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-6">
              <div className="bg-[#242424] rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">
                  User Activity Timeline
                </h3>
                <div className="space-y-4">
                  {betaUsers.slice(0, 10).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center space-x-4 py-3 border-b border-[#333333] last:border-b-0"
                    >
                      <div className="w-3 h-3 bg-[#6366F1] rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-medium">
                            {user.name || "Unknown User"}
                          </span>
                          <span className="text-gray-400">
                            {" "}
                            was last active
                          </span>
                        </p>
                        <p className="text-gray-400 text-sm">
                          {user.last_active
                            ? new Date(user.last_active).toLocaleString()
                            : "Never active"}
                        </p>
                      </div>
                      <span
                        className={`text-sm font-medium ${getStatusColor(
                          user.status
                        )}`}
                      >
                        {user.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-2xl font-bold text-white"
                role="dialog"
                aria-labelledby="user-details-title"
              >
                <span id="user-details-title">User Details</span>
              </h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
                aria-label="Close user details dialog"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Name
                  </label>
                  <p className="text-white font-medium">
                    {selectedUser.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Email
                  </label>
                  <p className="text-white font-medium">{selectedUser.email}</p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Status
                  </label>
                  <p
                    className={`font-medium ${getStatusColor(
                      selectedUser.status
                    )}`}
                  >
                    {selectedUser.status}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Joined
                  </label>
                  <p className="text-white font-medium">
                    {selectedUser.created_at
                      ? new Date(selectedUser.created_at).toLocaleDateString()
                      : "Unknown"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Last Active
                  </label>
                  <p className="text-white font-medium">
                    {selectedUser.last_active
                      ? new Date(selectedUser.last_active).toLocaleString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Beta Access Level
                  </label>
                  <p className="text-white font-medium">
                    {selectedUser.access_level || "Standard"}
                  </p>
                </div>
              </div>

              {selectedUser.notes && (
                <div>
                  <label className="block text-gray-400 text-sm mb-2">
                    Notes
                  </label>
                  <p className="text-white bg-[#242424] p-3 rounded border border-[#333333]">
                    {selectedUser.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isCreatingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3
                className="text-xl font-bold text-white"
                role="dialog"
                aria-labelledby="create-user-title"
              >
                <span id="create-user-title">Create Beta User</span>
              </h3>
              <button
                onClick={() => setIsCreatingUser(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close create user dialog"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleCreateUser({
                  name: formData.get("name"),
                  email: formData.get("email"),
                  access_level: formData.get("access_level"),
                  notes: formData.get("notes"),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-gray-400 text-sm mb-2">Name</label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Access Level
                </label>
                <select
                  name="access_level"
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                >
                  <option value="standard">Standard</option>
                  <option value="premium">Premium</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Notes
                </label>
                <textarea
                  name="notes"
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[80px]"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsCreatingUser(false)}
                  className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
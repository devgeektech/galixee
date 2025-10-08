async function handler({ method, action, ...data }) {
  const session = getSession();

  console.log("Beta feedback handler v2 called:", {
    method,
    action,
    sessionExists: !!session,
  });

  if (!session?.user?.id) {
    console.log("No session found, returning unauthorized");
    return { error: "Unauthorized", status: 401 };
  }

  const userId = session.user.id;
  console.log("User ID:", userId);

  try {
    switch (action) {
      case "submit":
        return await submitFeedback(userId, data);
      case "getAdminFeedback":
        return await getAdminFeedback(userId);
      case "updateStatus":
        return await updateFeedbackStatus(userId, data);
      case "getStats":
        return await getFeedbackStats();
      case "logActivity":
        return await logUserActivity(userId, data);
      default:
        console.log("Invalid action:", action);
        return { error: "Invalid action", status: 400 };
    }
  } catch (error) {
    console.error("Beta feedback handler error:", error);
    return { error: "Internal server error", status: 500 };
  }
}

async function submitFeedback(
  userId,
  {
    feedbackType,
    title,
    description,
    pageUrl,
    browserInfo,
    deviceInfo,
    screenshotUrl,
    priority = "medium",
  }
) {
  console.log("Submitting feedback:", {
    userId,
    feedbackType,
    title,
    priority,
  });

  if (!feedbackType || !title || !description) {
    console.log("Missing required fields");
    return { error: "Missing required fields", status: 400 };
  }

  const validTypes = [
    "bug",
    "feature_request",
    "general",
    "usability",
    "performance",
  ];
  const validPriorities = ["low", "medium", "high", "critical"];

  if (!validTypes.includes(feedbackType)) {
    console.log("Invalid feedback type:", feedbackType);
    return { error: "Invalid feedback type", status: 400 };
  }

  if (!validPriorities.includes(priority)) {
    console.log("Invalid priority:", priority);
    return { error: "Invalid priority", status: 400 };
  }

  const result = await sql`
    INSERT INTO beta_feedback (
      user_id, feedback_type, title, description, page_url, 
      browser_info, device_info, screenshot_url, priority
    ) VALUES (
      ${userId}, ${feedbackType}, ${title}, ${description}, ${pageUrl},
      ${JSON.stringify(browserInfo || {})}, ${JSON.stringify(
    deviceInfo || {}
  )}, 
      ${screenshotUrl}, ${priority}
    ) RETURNING id, created_at
  `;

  await logUserActivity(userId, {
    action: "feedback_submitted",
    pageUrl,
    details: { feedbackType, title, priority },
  });

  console.log("Feedback submitted successfully:", result[0]);
  return { success: true, feedback: result[0] };
}

async function getAdminFeedback(userId) {
  console.log("Getting admin feedback for user:", userId);

  const isAdmin = await checkAdminStatus(userId);
  if (!isAdmin) {
    console.log("User is not admin");
    return { error: "Admin access required", status: 403 };
  }

  const feedback = await sql`
    SELECT 
      bf.*,
      au.name as user_name,
      au.email as user_email
    FROM beta_feedback bf
    LEFT JOIN auth_users au ON bf.user_id = au.id
    ORDER BY bf.created_at DESC
  `;

  console.log("Retrieved feedback count:", feedback.length);
  return { success: true, feedback };
}

async function updateFeedbackStatus(
  userId,
  { feedbackId, status, adminNotes }
) {
  console.log("Updating feedback status:", { userId, feedbackId, status });

  const isAdmin = await checkAdminStatus(userId);
  if (!isAdmin) {
    console.log("User is not admin");
    return { error: "Admin access required", status: 403 };
  }

  const validStatuses = ["open", "in_progress", "resolved", "closed"];
  if (!validStatuses.includes(status)) {
    console.log("Invalid status:", status);
    return { error: "Invalid status", status: 400 };
  }

  const result = await sql`
    UPDATE beta_feedback 
    SET status = ${status}, admin_notes = ${adminNotes}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${feedbackId}
    RETURNING id, status, updated_at
  `;

  if (result.length === 0) {
    console.log("Feedback not found:", feedbackId);
    return { error: "Feedback not found", status: 404 };
  }

  await logUserActivity(userId, {
    action: "feedback_status_updated",
    details: { feedbackId, status, adminNotes },
  });

  console.log("Feedback status updated:", result[0]);
  return { success: true, feedback: result[0] };
}

async function getFeedbackStats() {
  console.log("Getting feedback statistics");

  const stats = await sql`
    SELECT 
      COUNT(*) as total_feedback,
      COUNT(CASE WHEN status = 'open' THEN 1 END) as open_count,
      COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress_count,
      COUNT(CASE WHEN status = 'resolved' THEN 1 END) as resolved_count,
      COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed_count,
      COUNT(CASE WHEN feedback_type = 'bug' THEN 1 END) as bug_count,
      COUNT(CASE WHEN feedback_type = 'feature_request' THEN 1 END) as feature_request_count,
      COUNT(CASE WHEN priority = 'critical' THEN 1 END) as critical_count,
      COUNT(CASE WHEN priority = 'high' THEN 1 END) as high_count
    FROM beta_feedback
  `;

  const recentActivity = await sql`
    SELECT COUNT(*) as recent_feedback
    FROM beta_feedback 
    WHERE created_at >= NOW() - INTERVAL '7 days'
  `;

  const result = {
    ...stats[0],
    recent_feedback: recentActivity[0].recent_feedback,
  };

  console.log("Feedback stats:", result);
  return { success: true, stats: result };
}

async function logUserActivity(
  userId,
  { action, pageUrl, details = {}, sessionId, ipAddress, userAgent }
) {
  console.log("Logging user activity:", { userId, action });

  try {
    await sql`
      INSERT INTO beta_activity_logs (
        user_id, action, page_url, details, session_id, ip_address, user_agent
      ) VALUES (
        ${userId}, ${action}, ${pageUrl}, ${JSON.stringify(details)}, 
        ${sessionId}, ${ipAddress}, ${userAgent}
      )
    `;

    console.log("Activity logged successfully");
    return { success: true };
  } catch (error) {
    console.error("Failed to log activity:", error);
    return { success: false, error: error.message };
  }
}

async function checkAdminStatus(userId) {
  console.log("Checking admin status for user:", userId);

  const user = await sql`
    SELECT email FROM auth_users WHERE id = ${userId}
  `;

  if (user.length === 0) {
    console.log("User not found");
    return false;
  }

  const userEmail = user[0].email;
  console.log("User email:", userEmail);

  // Expanded admin email list - add more emails as needed
  const adminEmails = [
    "admin@galixee.com",
    "support@galixee.com",
    "test@example.com",
    "admin@example.com",
    "beta@galixee.com",
    "developer@galixee.com",
  ];

  // Also allow any email that contains "admin" or "test" for development
  const isAdminEmail = adminEmails.includes(userEmail);
  const isDevEmail =
    userEmail.includes("admin") ||
    userEmail.includes("test") ||
    userEmail.includes("dev");
  const isAdmin = isAdminEmail || isDevEmail;

  console.log("Admin status check:", {
    userEmail,
    isAdminEmail,
    isDevEmail,
    finalIsAdmin: isAdmin,
  });

  return isAdmin;
}
export async function POST(request) {
  return handler(await request.json());
}
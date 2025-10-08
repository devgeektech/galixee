async function handler(params) {
  console.log("=== BETA FEEDBACK HANDLER START ===");
  console.log("Params received:", JSON.stringify(params, null, 2));

  if (!params) {
    console.log("❌ No params provided");
    return {
      error: "Request body is required",
      debug: {
        message: "Request body is required",
        params: params,
      },
    };
  }

  // Extract action from params
  const { action, ...data } = params;

  console.log("Action extracted:", action);
  console.log("Data extracted:", JSON.stringify(data, null, 2));

  if (!action) {
    console.log("❌ No action provided in request body");
    return {
      error: "No action provided",
      debug: {
        params,
        action,
        data,
        params_keys: Object.keys(params || {}),
      },
    };
  }

  const session = getSession();
  console.log("Session check:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });

  if (!session?.user?.id) {
    console.log("❌ No session or user ID found");
    return { error: "Authentication required" };
  }

  const userId = session.user.id;
  console.log("✅ Authenticated user ID:", userId);

  try {
    if (action === "submit") {
      console.log("📝 Processing submit action");
      const {
        feedback_type,
        title,
        description,
        page_url,
        browser_info,
        device_info,
        screenshot_url,
      } = data;

      if (!feedback_type || !title || !description) {
        return { error: "Missing required fields" };
      }

      const feedback = await sql`
        INSERT INTO beta_feedback (
          user_id, feedback_type, title, description, page_url, 
          browser_info, device_info, screenshot_url
        ) VALUES (
          ${userId}, ${feedback_type}, ${title}, ${description}, ${page_url},
          ${JSON.stringify(browser_info || {})}, ${JSON.stringify(
        device_info || {}
      )}, ${screenshot_url}
        ) RETURNING *
      `;

      await sql`
        INSERT INTO beta_activity_logs (user_id, action, details)
        VALUES (${userId}, 'feedback_submitted', ${JSON.stringify({
        feedback_id: feedback[0].id,
        type: feedback_type,
      })})
      `;

      return { success: true, feedback: feedback[0] };
    }

    if (action === "update_status") {
      console.log("🔄 Processing update_status action");
      const { feedback_id, status, admin_notes } = data;

      const updated = await sql`
        UPDATE beta_feedback 
        SET status = ${status}, admin_notes = ${admin_notes}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${feedback_id}
        RETURNING *
      `;

      return { success: true, feedback: updated[0] };
    }

    if (action === "log_activity") {
      console.log("📊 Processing log_activity action");
      const {
        action_type,
        page_url,
        details,
        session_id,
        ip_address,
        user_agent,
      } = data;

      await sql`
        INSERT INTO beta_activity_logs (
          user_id, action, page_url, details, session_id, ip_address, user_agent
        ) VALUES (
          ${userId}, ${action_type}, ${page_url}, ${JSON.stringify(
        details || {}
      )},
          ${session_id}, ${ip_address}, ${user_agent}
        )
      `;

      return { success: true };
    }

    if (action === "get_admin_feedback") {
      console.log("🔍 Processing get_admin_feedback action");

      try {
        const feedback = await sql`
          SELECT bf.*, au.name as user_name, au.email as user_email
          FROM beta_feedback bf
          JOIN auth_users au ON bf.user_id = au.id
          ORDER BY bf.created_at DESC
        `;

        console.log(
          "✅ Feedback query successful, found:",
          feedback.length,
          "items"
        );
        return { success: true, feedback };
      } catch (feedbackError) {
        console.error("❌ Error fetching feedback:", feedbackError);
        return {
          error: "Failed to fetch feedback",
          details: feedbackError.message,
        };
      }
    }

    if (action === "get_user_feedback") {
      console.log("👤 Processing get_user_feedback action");
      const feedback = await sql`
        SELECT * FROM beta_feedback 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return { feedback };
    }

    if (action === "get_user_activity") {
      console.log("📈 Processing get_user_activity action");
      const activity = await sql`
        SELECT * FROM beta_activity_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      return { activity };
    }

    if (action === "get_admin_activity") {
      console.log("🔧 Processing get_admin_activity action");
      const activity = await sql`
        SELECT bal.*, au.name as user_name, au.email as user_email
        FROM beta_activity_logs bal
        LEFT JOIN auth_users au ON bal.user_id = au.id
        ORDER BY bal.created_at DESC
        LIMIT 100
      `;

      return { activity };
    }

    if (action === "get_stats") {
      console.log("📊 Processing get_stats action");
      const [feedbackStats, activityStats, userStats] = await sql.transaction([
        sql`
          SELECT 
            feedback_type,
            status,
            COUNT(*) as count
          FROM beta_feedback
          GROUP BY feedback_type, status
        `,
        sql`
          SELECT 
            action,
            COUNT(*) as count,
            DATE(created_at) as date
          FROM beta_activity_logs
          WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
          GROUP BY action, DATE(created_at)
          ORDER BY date DESC
        `,
        sql`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN is_active THEN 1 END) as active_users,
            COUNT(CASE WHEN first_login_at IS NOT NULL THEN 1 END) as logged_in_users
          FROM beta_users
        `,
      ]);

      return {
        feedback_stats: feedbackStats,
        activity_stats: activityStats,
        user_stats: userStats[0],
      };
    }

    console.log("❌ Invalid action received:", action);
    console.log(
      "Available actions: submit, update_status, log_activity, get_admin_feedback, get_user_feedback, get_user_activity, get_admin_activity, get_stats"
    );
    return {
      error: "Invalid action",
      received_action: action,
      debug: { params, action, data },
    };
  } catch (error) {
    console.error("❌ Beta feedback handler error:", error);
    return { error: "Internal server error", details: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
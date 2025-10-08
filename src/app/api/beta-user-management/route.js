async function handler(params) {
  try {
    const session = getSession();

    if (!session?.user?.id) {
      return { error: "Authentication required" };
    }

    // Debug logging - check what we're receiving
    console.log("Full params object:", params);
    console.log("Params keys:", Object.keys(params || {}));

    // Extract parameters - try both body and direct params
    const requestData = params.body || params;

    console.log("Request data:", requestData);
    console.log("Request data keys:", Object.keys(requestData || {}));

    const {
      action,
      userId,
      email,
      betaGroup,
      isActive,
      notes,
      page = 1,
      limit = 50,
      activityAction,
      pageUrl,
      details,
      sessionId,
      ipAddress,
      userAgent,
    } = requestData || {};

    console.log("Extracted action:", action);
    console.log("Beta user management action:", action, "userId:", userId);

    if (!action) {
      return {
        error: "Action parameter is required",
        debug: { receivedParams: params, extractedData: requestData },
      };
    }

    switch (action) {
      case "create_beta_user":
        if (!userId && !email) {
          return { error: "User ID or email required" };
        }

        let targetUserId = userId;

        // If we have an email but no userId, try to find or create the user
        if (!targetUserId && email) {
          const userResult =
            await sql`SELECT id FROM auth_users WHERE email = ${email}`;

          if (userResult.length === 0) {
            // User doesn't exist yet - create a placeholder user record
            console.log("Creating placeholder user for email:", email);
            const newUser = await sql`
              INSERT INTO auth_users (email, name, "emailVerified")
              VALUES (${email}, ${email.split("@")[0]}, NULL)
              RETURNING id
            `;
            targetUserId = newUser[0].id;
            console.log("Created placeholder user with ID:", targetUserId);
          } else {
            targetUserId = userResult[0].id;
          }
        }

        // Check if user is already a beta user
        const existingBetaUser = await sql`
          SELECT id FROM beta_users WHERE user_id = ${targetUserId}
        `;

        if (existingBetaUser.length > 0) {
          return { error: "User is already a beta user" };
        }

        // Create the beta user record
        const newBetaUser = await sql`
          INSERT INTO beta_users (user_id, beta_group, is_active, notes)
          VALUES (${targetUserId}, ${betaGroup || "general"}, ${
          isActive !== false
        }, ${notes || ""})
          RETURNING *
        `;

        console.log("Created beta user:", newBetaUser[0]);
        return { success: true, betaUser: newBetaUser[0] };

      case "get_beta_users":
        console.log("Fetching beta users from database...");
        const offset = (page - 1) * limit;

        const betaUsers = await sql`
          SELECT 
            bu.*,
            au.name,
            au.email,
            au.image,
            bu.is_active as status
          FROM beta_users bu
          JOIN auth_users au ON bu.user_id = au.id
          ORDER BY bu.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;

        console.log("Found beta users:", betaUsers.length);

        const totalCountResult =
          await sql`SELECT COUNT(*) as count FROM beta_users`;
        const totalCount = parseInt(totalCountResult[0].count);

        return {
          success: true,
          betaUsers,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        };

      case "update_beta_user":
        if (!userId) {
          return { error: "User ID required" };
        }

        const setClauses = [];
        const values = [];
        let paramCount = 0;

        if (betaGroup !== undefined) {
          setClauses.push(`beta_group = $${++paramCount}`);
          values.push(betaGroup);
        }
        if (isActive !== undefined) {
          setClauses.push(`is_active = $${++paramCount}`);
          values.push(isActive);
        }
        if (notes !== undefined) {
          setClauses.push(`notes = $${++paramCount}`);
          values.push(notes);
        }

        if (setClauses.length === 0) {
          return { error: "No fields to update" };
        }

        const updateQuery = `
          UPDATE beta_users 
          SET ${setClauses.join(", ")}, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = $${++paramCount}
          RETURNING *
        `;
        values.push(userId);

        const updatedUser = await sql(updateQuery, values);

        if (updatedUser.length === 0) {
          return { error: "Beta user not found" };
        }

        return { success: true, betaUser: updatedUser[0] };

      case "delete_beta_user":
        if (!userId) {
          return { error: "User ID required" };
        }

        const deletedUser = await sql`
          DELETE FROM beta_users 
          WHERE user_id = ${userId}
          RETURNING *
        `;

        if (deletedUser.length === 0) {
          return { error: "Beta user not found" };
        }

        return { success: true, message: "Beta user removed" };

      case "get_beta_statistics":
        console.log("Fetching beta statistics...");
        const [
          totalUsers,
          activeUsers,
          groupStats,
          recentActivity,
          feedbackStats,
        ] = await sql.transaction([
          sql`SELECT COUNT(*) as count FROM beta_users`,
          sql`SELECT COUNT(*) as count FROM beta_users WHERE is_active = true`,
          sql`
            SELECT 
              beta_group,
              COUNT(*) as count,
              COUNT(CASE WHEN is_active THEN 1 END) as active_count
            FROM beta_users 
            GROUP BY beta_group
          `,
          sql`
            SELECT COUNT(*) as count 
            FROM beta_activity_logs 
            WHERE created_at >= NOW() - INTERVAL '7 days'
          `,
          sql`
            SELECT 
              COUNT(*) as total_feedback,
              COUNT(CASE WHEN status = 'open' THEN 1 END) as open_feedback,
              COUNT(CASE WHEN feedback_type = 'bug' THEN 1 END) as bug_reports
            FROM beta_feedback
          `,
        ]);

        console.log("Statistics fetched successfully");

        return {
          success: true,
          statistics: {
            totalBetaUsers: parseInt(totalUsers[0].count),
            activeBetaUsers: parseInt(activeUsers[0].count),
            groupBreakdown: groupStats,
            recentActivityCount: parseInt(recentActivity[0].count),
            feedbackStats: feedbackStats[0],
          },
        };

      case "log_activity":
        if (!activityAction) {
          return { error: "Activity action required" };
        }

        await sql`
          INSERT INTO beta_activity_logs (
            user_id, action, page_url, details, session_id, ip_address, user_agent
          )
          VALUES (
            ${session.user.id}, 
            ${activityAction}, 
            ${pageUrl || null}, 
            ${JSON.stringify(details || {})}, 
            ${sessionId || null}, 
            ${ipAddress || null}, 
            ${userAgent || null}
          )
        `;

        return { success: true, message: "Activity logged" };

      case "get_user_activity":
        if (!userId) {
          return { error: "User ID required" };
        }

        const activityOffset = (page - 1) * limit;

        const userActivity = await sql`
          SELECT * FROM beta_activity_logs 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${activityOffset}
        `;

        const activityCountResult = await sql`
          SELECT COUNT(*) as count FROM beta_activity_logs WHERE user_id = ${userId}
        `;

        return {
          success: true,
          activity: userActivity,
          pagination: {
            page,
            limit,
            totalCount: parseInt(activityCountResult[0].count),
            totalPages: Math.ceil(
              parseInt(activityCountResult[0].count) / limit
            ),
          },
        };

      default:
        console.log("Invalid action received:", action);
        console.log(
          "Available actions: create_beta_user, get_beta_users, update_beta_user, delete_beta_user, get_beta_statistics, log_activity, get_user_activity"
        );
        return { error: `Invalid action: ${action}` };
    }
  } catch (error) {
    console.error("Beta user management error:", error);
    console.error("Error stack:", error.stack);
    return { error: "Internal server error", details: error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
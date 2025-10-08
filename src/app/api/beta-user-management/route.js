import sql from "@/db";
import { getSession } from "@/utilities/getSession"; // use named import
import { NextResponse } from "next/server";

async function handler(params) {
  try {
    const session = await getSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const requestData = params.body || params;
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

    if (!action) {
      return NextResponse.json(
        {
          error: "Action parameter is required",
          debug: { receivedParams: params, extractedData: requestData },
        },
        { status: 400 }
      );
    }

    switch (action) {
      case "create_beta_user": {
        if (!userId && !email) {
          return NextResponse.json({ error: "User ID or email required" }, { status: 400 });
        }

        let targetUserId = userId;

        if (!targetUserId && email) {
          const userResult = await sql`SELECT id FROM auth_users WHERE email = ${email}`;
          if (userResult.length === 0) {
            const newUser = await sql`
              INSERT INTO auth_users (email, name, "emailVerified")
              VALUES (${email}, ${email.split("@")[0]}, NULL)
              RETURNING id
            `;
            targetUserId = newUser[0].id;
          } else {
            targetUserId = userResult[0].id;
          }
        }

        const existingBetaUser = await sql`
          SELECT id FROM beta_users WHERE user_id = ${targetUserId}
        `;
        if (existingBetaUser.length > 0) {
          return NextResponse.json({ error: "User is already a beta user" }, { status: 409 });
        }

        const newBetaUser = await sql`
          INSERT INTO beta_users (user_id, beta_group, is_active, notes)
          VALUES (${targetUserId}, ${betaGroup || "general"}, ${isActive !== false}, ${notes || ""})
          RETURNING *
        `;

        return NextResponse.json({ success: true, betaUser: newBetaUser[0] });
      }

      case "get_beta_users": {
        const offset = (page - 1) * limit;
        const betaUsers = await sql`
          SELECT 
            bu.*, au.name, au.email, au.image, bu.is_active as status
          FROM beta_users bu
          JOIN auth_users au ON bu.user_id = au.id
          ORDER BY bu.created_at DESC
          LIMIT ${limit} OFFSET ${offset}
        `;
        const totalCountResult = await sql`SELECT COUNT(*) as count FROM beta_users`;
        const totalCount = parseInt(totalCountResult[0].count);

        return NextResponse.json({
          success: true,
          betaUsers,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      }

      case "update_beta_user": {
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
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
          return NextResponse.json({ error: "No fields to update" }, { status: 400 });
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
          return NextResponse.json({ error: "Beta user not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, betaUser: updatedUser[0] });
      }

      case "delete_beta_user": {
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const deletedUser = await sql`
          DELETE FROM beta_users WHERE user_id = ${userId} RETURNING *
        `;
        if (deletedUser.length === 0) {
          return NextResponse.json({ error: "Beta user not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Beta user removed" });
      }

      case "get_beta_statistics": {
        const [totalUsers, activeUsers, groupStats, recentActivity, feedbackStats] =
          await sql.transaction([
            sql`SELECT COUNT(*) as count FROM beta_users`,
            sql`SELECT COUNT(*) as count FROM beta_users WHERE is_active = true`,
            sql`
              SELECT 
                beta_group,
                COUNT(*) as count,
                COUNT(CASE WHEN is_active THEN 1 END) as active_count
              FROM beta_users GROUP BY beta_group
            `,
            sql`SELECT COUNT(*) as count FROM beta_activity_logs WHERE created_at >= NOW() - INTERVAL '7 days'`,
            sql`
              SELECT 
                COUNT(*) as total_feedback,
                COUNT(CASE WHEN status = 'open' THEN 1 END) as open_feedback,
                COUNT(CASE WHEN feedback_type = 'bug' THEN 1 END) as bug_reports
              FROM beta_feedback
            `,
          ]);

        return NextResponse.json({
          success: true,
          statistics: {
            totalBetaUsers: parseInt(totalUsers[0].count),
            activeBetaUsers: parseInt(activeUsers[0].count),
            groupBreakdown: groupStats,
            recentActivityCount: parseInt(recentActivity[0].count),
            feedbackStats: feedbackStats[0],
          },
        });
      }

      // ✅ LOG ACTIVITY
      case "log_activity": {
        if (!activityAction) {
          return NextResponse.json({ error: "Activity action required" }, { status: 400 });
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

        return NextResponse.json({ success: true, message: "Activity logged" });
      }

      // ✅ GET USER ACTIVITY
      case "get_user_activity": {
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 });
        }

        const activityOffset = (page - 1) * limit;
        const userActivity = await sql`
          SELECT * FROM beta_activity_logs 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${activityOffset}
        `;
        const countResult = await sql`
          SELECT COUNT(*) as count FROM beta_activity_logs WHERE user_id = ${userId}
        `;
        const totalCount = parseInt(countResult[0].count);

        return NextResponse.json({
          success: true,
          activity: userActivity,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        });
      }

      // ✅ INVALID ACTION
      default:
        return NextResponse.json({ error: `Invalid action: ${action}` }, { status: 400 });
    }
  } catch (error) {
    console.error("Beta user management error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// ✅ Route Handler
export async function POST(request) {
  const body = await request.json();
  return handler(body);
}

import sql from "@/db";
import { getSession } from "@/utilities/getSession";
import { NextResponse } from "next/server";

async function handler(params) {
const session = await getSession();
const userId = session.user.id;

  if (!params) {
    return NextResponse.json({
      error: "Request body is required",
      debug: {
        message: "Request body is required",
        params: params,
      },
    });
  }

  // Extract action from params
  const { action, ...data } = params;
  if (!action) {
   return NextResponse.json({
      error: "No action provided",
      debug: {
        params,
        action,
        data,
        params_keys: Object.keys(params || {}),
      },
    });
  }



  if (!session?.user?.id) {
    return NextResponse.json({error: "Authentication required" });
  }


  try {
    if (action === "submit") {
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
        return NextResponse.json({ error: "Missing required fields" });
      
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

      return NextResponse.json({success: true, feedback: feedback[0] });
    }

    if (action === "update_status") {
      const { feedback_id, status, admin_notes } = data;
      const updated = await sql`
        UPDATE beta_feedback 
        SET status = ${status}, admin_notes = ${admin_notes}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${feedback_id}
        RETURNING *
      `;

      return NextResponse.json({ success: true, feedback: updated[0] });
    }

    if (action === "log_activity") {
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

      return NextResponse.json({ success: true });
    }

    if (action === "get_admin_feedback") {
      try {
        const feedback = await sql`
          SELECT bf.*, au.name as user_name, au.email as user_email
          FROM beta_feedback bf
          JOIN auth_users au ON bf.user_id = au.id
          ORDER BY bf.created_at DESC
        `;

         return NextResponse.json({ success: true, feedback });
      } catch (feedbackError) {
         return NextResponse.json({
          error: "Failed to fetch feedback",
          details: feedbackError.message,
        });
      }
    }

    if (action === "get_user_feedback") {
      const feedback = await sql`
        SELECT * FROM beta_feedback 
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
      `;

      return NextResponse.json({ feedback });
    }

    if (action === "get_user_activity") {
      const activity = await sql`
        SELECT * FROM beta_activity_logs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

       return NextResponse.json({ activity });
    }

    if (action === "get_admin_activity") {
      const activity = await sql`
        SELECT bal.*, au.name as user_name, au.email as user_email
        FROM beta_activity_logs bal
        LEFT JOIN auth_users au ON bal.user_id = au.id
        ORDER BY bal.created_at DESC
        LIMIT 100
      `;

      return NextResponse.json({ activity });
    }

    if (action === "get_stats") {
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

       return NextResponse.json({
        feedback_stats: feedbackStats,
        activity_stats: activityStats,
        user_stats: userStats[0],
      });
    }


     return NextResponse.json({
      error: "Invalid action",
      received_action: action,
      debug: { params, action, data },
    });
  } catch (error) {
     return NextResponse.json({ error: "Internal server error", details: error.message });
  }
}
export async function POST(request) {
  return handler(await request.json());
}
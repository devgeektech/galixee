async function handler({ method, platform, url, username }, request) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  const userId = session.user.id;

  try {
    switch (method) {
      case "GET": {
        const links = await sql`
          SELECT * FROM social_media_links 
          WHERE user_id = ${userId}
          ORDER BY platform ASC
        `;
        return { links };
      }

      case "POST": {
        if (!platform || !url) {
          return { error: "Platform and URL are required", status: 400 };
        }

        const result = await sql`
          INSERT INTO social_media_links (user_id, platform, url, username)
          VALUES (${userId}, ${platform}, ${url}, ${username})
          ON CONFLICT (user_id, platform) 
          DO UPDATE SET 
            url = EXCLUDED.url,
            username = EXCLUDED.username,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `;
        return { link: result[0] };
      }

      case "DELETE": {
        if (!platform) {
          return { error: "Platform is required", status: 400 };
        }

        await sql`
          DELETE FROM social_media_links 
          WHERE user_id = ${userId} 
          AND platform = ${platform}
        `;
        return { success: true };
      }

      default:
        return { error: "Method not allowed", status: 405 };
    }
  } catch (error) {
    console.error("Social media handler error:", error);
    return { error: "Internal server error", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
import sql from "@/db";

export async function getSession() {
  try {
    const activeSessions = await sql`
      SELECT 
        s."userId",
        s.expires,
        u.name,
        u.email,
        p.first_name,
        p.last_name,
        u.image
      FROM auth_sessions s
      JOIN auth_users u ON s."userId" = u.id
      LEFT JOIN user_profiles p ON u.id = p.user_id
      WHERE s.expires > NOW()
      ORDER BY s.expires DESC
      LIMIT 1
    `;

    if (activeSessions.length > 0) {
      const sessionData = activeSessions[0];

      return {
        user: {
          id: sessionData.userId,
          name:
            sessionData.name ||
            `${sessionData.first_name || ""} ${sessionData.last_name || ""}`.trim() ||
            null,
          email: sessionData.email,
          image: sessionData.image,
          subscription_status: sessionData.subscription_status ?? null,
          stripe_id: sessionData.stripe_id ?? null,
        },
        expires: sessionData.expires,
      };
    }
  } catch (error) {
    console.error("Database session lookup failed:", error);
  }
  return null;
}

export default getSession; // 👈 add this line

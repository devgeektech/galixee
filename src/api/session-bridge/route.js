async function handler({ sessionToken, userId, expires }) {
  if (!sessionToken || !userId || !expires) {
    return { error: "Missing required session parameters" };
  }

  try {
    const expiresDate = new Date(expires);

    await sql`
      INSERT INTO auth_sessions ("userId", expires, "sessionToken")
      VALUES (${userId}, ${expiresDate}, ${sessionToken})
      ON CONFLICT ("sessionToken") 
      DO UPDATE SET 
        "userId" = EXCLUDED."userId",
        expires = EXCLUDED.expires
    `;

    return {
      success: true,
      sessionToken,
      userId,
      expires: expiresDate.toISOString(),
    };
  } catch (error) {
    return {
      error: "Failed to create session",
      details: error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
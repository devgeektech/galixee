async function handler({
  method,
  voiceSampleUrl,
  voiceSettings,
  userId,
  sampleName,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const authenticatedUserId = session.user.id;
  if (userId && userId !== authenticatedUserId) {
    return { error: "Unauthorized" };
  }

  switch (method) {
    case "POST": {
      if (!voiceSampleUrl) {
        return { error: "Voice sample URL is required" };
      }

      // Create a new voice sample (allow multiple per user)
      const result = await sql`
        INSERT INTO voice_profiles (user_id, voice_sample_url, voice_settings)
        VALUES (${authenticatedUserId}, ${voiceSampleUrl}, ${JSON.stringify(
        voiceSettings || {}
      )})
        RETURNING *
      `;

      return { profile: result[0] };
    }

    case "GET": {
      // Return all voice samples for the user, ordered by most recent first
      const result = await sql`
        SELECT * FROM voice_profiles 
        WHERE user_id = ${authenticatedUserId}
        ORDER BY created_at DESC
      `;

      return { profiles: result };
    }

    case "GET_LATEST": {
      // Return the most recent voice sample (for backward compatibility)
      const result = await sql`
        SELECT * FROM voice_profiles 
        WHERE user_id = ${authenticatedUserId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

      return { profile: result[0] || null };
    }

    case "PUT": {
      if (!voiceSettings) {
        return { error: "Voice settings are required" };
      }

      const result = await sql`
        UPDATE voice_profiles 
        SET voice_settings = ${JSON.stringify(voiceSettings)},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${authenticatedUserId}
        RETURNING *
      `;

      return { profile: result[0] };
    }

    case "DELETE": {
      const { sampleId } = arguments[0];

      if (sampleId) {
        // Delete specific voice sample
        await sql`
          DELETE FROM voice_profiles 
          WHERE user_id = ${authenticatedUserId} AND id = ${sampleId}
        `;
      } else {
        // Delete all voice samples for user
        await sql`
          DELETE FROM voice_profiles 
          WHERE user_id = ${authenticatedUserId}
        `;
      }

      return { success: true };
    }

    default:
      return { error: "Method not allowed" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
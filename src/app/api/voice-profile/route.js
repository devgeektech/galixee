import sql from "@/db";
import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";
async function handler({
  method,
  voiceSampleUrl,
  voiceSettings,
  userId,
  sampleName,
}) {
  const session = await getSession();
  if (!session?.user?.id) {
     return NextResponse.json({error: "Unauthorized" });
  }

  const authenticatedUserId = session.user.id;
  if (userId && userId !== authenticatedUserId) {
   return NextResponse.json({error: "Unauthorized" });
  }

  switch (method) {
    case "POST": {
      if (!voiceSampleUrl) {
        return NextResponse.json({error: "Voice sample URL is required" });
      }

      // Create a new voice sample (allow multiple per user)
      const result = await sql`
        INSERT INTO voice_profiles (user_id, voice_sample_url, voice_settings)
        VALUES (${authenticatedUserId}, ${voiceSampleUrl}, ${JSON.stringify(
        voiceSettings || {}
      )})
        RETURNING *
      `;

      return NextResponse.json({ profile: result[0] });
    }

    case "GET": {
      // Return all voice samples for the user, ordered by most recent first
      const result = await sql`
        SELECT * FROM voice_profiles 
        WHERE user_id = ${authenticatedUserId}
        ORDER BY created_at DESC
      `;

       return NextResponse.json({ profiles: result });
    }

    case "GET_LATEST": {
      // Return the most recent voice sample (for backward compatibility)
      const result = await sql`
        SELECT * FROM voice_profiles 
        WHERE user_id = ${authenticatedUserId}
        ORDER BY created_at DESC
        LIMIT 1
      `;

       return NextResponse.json({profile: result[0] || null });
    }

    case "PUT": {
      if (!voiceSettings) {
        return NextResponse.json({error: "Voice settings are required" });
      }

      const result = await sql`
        UPDATE voice_profiles 
        SET voice_settings = ${JSON.stringify(voiceSettings)},
            updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${authenticatedUserId}
        RETURNING *
      `;

      return NextResponse.json({ profile: result[0] });
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

     return NextResponse.json({ success: true });
    }

    default:
      return NextResponse.json({error: "Method not allowed" });
  }
}
export async function POST(request) {
  return handler(await request.json());
}
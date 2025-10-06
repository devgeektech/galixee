async function handler({ text, userId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!text) {
    return { error: "Text input required" };
  }

  // Get user voice preferences
  const [userProfile] = await sql`
    SELECT voice_responses_enabled, preferred_voice_type, animation_settings
    FROM user_profiles 
    WHERE user_id = ${session.user.id}
  `;

  if (!userProfile?.voice_responses_enabled) {
    return { error: "Voice responses not enabled for user" };
  }

  try {
    // For sandbox environment, simulate voice generation
    // In production, this would integrate with a real text-to-speech service

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return a simulated audio URL
    const simulatedAudioUrl = `https://example.com/audio/voice_${
      session.user.id
    }_${Date.now()}.mp3`;

    return {
      success: true,
      url: simulatedAudioUrl,
      message: "Voice response generated successfully (simulated in sandbox)",
      settings: userProfile.animation_settings,
      voiceType: userProfile.preferred_voice_type || "neutral",
      textLength: text.length,
    };
  } catch (error) {
    return { error: "Failed to generate voice response: " + error.message };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
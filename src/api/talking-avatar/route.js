async function handler({ text }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Get user profile and voice settings
  const [profile, voiceProfile] = await sql.transaction([
    sql`
      SELECT image, voice_responses_enabled, animation_enabled, animation_settings
      FROM user_profiles 
      WHERE user_id = ${session.user.id}
    `,
    sql`
      SELECT voice_sample_url, voice_settings, voice_model_id
      FROM voice_profiles
      WHERE user_id = ${session.user.id}
    `,
  ]);

  if (!profile?.length || !profile[0].image) {
    return { error: "No profile image found" };
  }

  if (!profile[0].animation_enabled) {
    return { error: "Animation not enabled for this user" };
  }

  // Configure animation settings
  const animationSettings = profile[0].animation_settings || {};
  const voiceSettings = voiceProfile?.[0]?.voice_settings || {};

  try {
    // For sandbox environment, simulate animation generation
    // In production, this would integrate with a real animation service

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Return a simulated animation URL
    const simulatedAnimationUrl = `https://example.com/animations/user_${
      session.user.id
    }_${Date.now()}.mp4`;

    return {
      success: true,
      animationUrl: simulatedAnimationUrl,
      message: "Animation generated successfully (simulated in sandbox)",
      settings: {
        text,
        animationSettings,
        voiceSettings,
      },
    };
  } catch (error) {
    return {
      error: "Failed to generate animation: " + error.message,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
async function handler({ question, userId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const targetUserId = userId || session.user.id;

  // Build base queries for different data types
  const queries = [
    // User profile data
    sql`
      SELECT up.*, au.email 
      FROM user_profiles up
      JOIN auth_users au ON au.id = up.user_id
      WHERE up.user_id = ${targetUserId}
    `,

    // Health data
    sql`
      SELECT *
      FROM health_questionnaires
      WHERE user_id = ${targetUserId}
    `,

    // Education history
    sql`
      SELECT *
      FROM education_history
      WHERE user_id = ${targetUserId}
      ORDER BY years_attended DESC
    `,

    // Employment history
    sql`
      SELECT *
      FROM employment_history
      WHERE user_id = ${targetUserId}
      ORDER BY start_date DESC
    `,

    // Family tree
    sql`
      SELECT *
      FROM family_tree_members
      WHERE user_id = ${targetUserId}
    `,

    // Social media
    sql`
      SELECT *
      FROM social_media_links
      WHERE user_id = ${targetUserId}
    `,
  ];

  try {
    const [
      profileData,
      healthData,
      educationData,
      employmentData,
      familyData,
      socialData,
    ] = await sql.transaction(queries);

    return {
      profile: profileData[0] || null,
      health: healthData[0] || null,
      education: educationData || [],
      employment: employmentData || [],
      family: familyData || [],
      social: socialData || [],
    };
  } catch (error) {
    return { error: "Failed to fetch personal data" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
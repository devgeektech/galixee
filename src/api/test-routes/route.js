async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const userId = session.user.id;
  const results = {};

  try {
    const educationTest = await sql`
      SELECT COUNT(*) as count 
      FROM education_history 
      WHERE user_id = ${userId}
    `;
    results.education = {
      accessible: true,
      recordCount: parseInt(educationTest[0].count),
    };
  } catch (error) {
    results.education = {
      accessible: false,
      error: error.message,
    };
  }

  try {
    const employmentTest = await sql`
      SELECT COUNT(*) as count 
      FROM employment_history 
      WHERE user_id = ${userId}
    `;
    results.employment = {
      accessible: true,
      recordCount: parseInt(employmentTest[0].count),
    };
  } catch (error) {
    results.employment = {
      accessible: false,
      error: error.message,
    };
  }

  return {
    success: true,
    userId: userId,
    timestamp: new Date().toISOString(),
    results: results,
  };
}
export async function POST(request) {
  return handler(await request.json());
}
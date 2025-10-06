async function handler({ userId, action, moduleId, progress }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (action === "get") {
    const courseProgress = await sql`
      SELECT module_id, completed_at, score 
      FROM financial_course_progress 
      WHERE user_id = ${session.user.id}
      ORDER BY module_id`;

    const certificate = await sql`
      SELECT issued_at, certificate_url 
      FROM financial_course_certificates 
      WHERE user_id = ${session.user.id}
      ORDER BY issued_at DESC 
      LIMIT 1`;

    return {
      progress: courseProgress,
      certificate: certificate[0] || null,
    };
  }

  if (action === "update") {
    if (!moduleId || typeof progress !== "number") {
      return { error: "Invalid module data" };
    }

    const timestamp = new Date().toISOString();

    await sql`
      INSERT INTO financial_course_progress 
        (user_id, module_id, score, completed_at)
      VALUES 
        (${session.user.id}, ${moduleId}, ${progress}, ${timestamp})
      ON CONFLICT (user_id, module_id) 
      DO UPDATE SET 
        score = ${progress},
        completed_at = ${timestamp}`;

    const totalModules = await sql`
      SELECT COUNT(DISTINCT module_id) as total 
      FROM financial_course_progress 
      WHERE user_id = ${session.user.id}`;

    const completedModules = await sql`
      SELECT COUNT(DISTINCT module_id) as completed 
      FROM financial_course_progress 
      WHERE user_id = ${session.user.id} 
      AND score >= 70`;

    if (totalModules[0].total >= 10 && completedModules[0].completed >= 10) {
      const certificateUrl = `https://example.com/certificates/financial/${session.user.id}`;

      await sql`
        INSERT INTO financial_course_certificates 
          (user_id, issued_at, certificate_url)
        VALUES 
          (${session.user.id}, ${timestamp}, ${certificateUrl})
        ON CONFLICT (user_id) 
        DO UPDATE SET 
          issued_at = ${timestamp},
          certificate_url = ${certificateUrl}`;

      return {
        status: "completed",
        certificateUrl,
      };
    }

    return {
      status: "updated",
      progress: completedModules[0].completed,
    };
  }

  return { error: "Invalid action" };
}
export async function POST(request) {
  return handler(await request.json());
}
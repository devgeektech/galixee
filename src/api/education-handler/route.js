async function handler({
  method,
  school_type,
  school_name,
  years_attended,
  city,
  state,
  comments,
  year_graduated,
  degree_type,
  degree_discipline,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (method === "GET") {
    try {
      const schools = await sql`
        SELECT * FROM education_history 
        WHERE user_id = ${session.user.id} 
        ORDER BY created_at DESC
      `;
      return { data: schools };
    } catch (err) {
      return { error: "Failed to fetch education history" };
    }
  }

  if (method === "POST") {
    if (!school_type || !school_name || !years_attended || !city || !state) {
      return { error: "Missing required fields" };
    }

    if (
      !["elementary", "junior_high", "high_school", "college"].includes(
        school_type
      )
    ) {
      return { error: "Invalid school type" };
    }

    if (school_type === "college" && (!degree_type || !degree_discipline)) {
      return {
        error: "Degree type and discipline required for college entries",
      };
    }

    try {
      const [newSchool] = await sql`
        INSERT INTO education_history (
          user_id,
          school_type,
          school_name,
          years_attended,
          city,
          state,
          comments,
          year_graduated,
          degree_type,
          degree_discipline
        ) VALUES (
          ${session.user.id},
          ${school_type},
          ${school_name},
          ${years_attended},
          ${city},
          ${state},
          ${comments || null},
          ${year_graduated || null},
          ${degree_type || null},
          ${degree_discipline || null}
        )
        RETURNING *
      `;

      return { data: newSchool };
    } catch (err) {
      return { error: "Failed to add education history" };
    }
  }

  return { error: "Method not supported" };
}
export async function POST(request) {
  return handler(await request.json());
}
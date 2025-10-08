async function handler({ method, id, ...data }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (method === "GET") {
    const results = await sql`
      SELECT * FROM education_history 
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;
    return { data: results };
  }

  if (method === "POST") {
    try {
      const {
        school_type,
        school_name,
        years_attended,
        city,
        state,
        comments,
        year_graduated,
        degree_type,
        degree_discipline,
      } = data;

      // Validate required fields
      if (!school_type) {
        return { error: "School type is required" };
      }
      if (!school_name) {
        return { error: "School name is required" };
      }
      if (!years_attended) {
        return { error: "Years attended is required" };
      }
      if (!city) {
        return { error: "City is required" };
      }
      if (!state) {
        return { error: "State is required" };
      }

      // Validate school_type against allowed values
      const allowedSchoolTypes = [
        "elementary",
        "junior_high",
        "high_school",
        "college",
      ];
      if (!allowedSchoolTypes.includes(school_type)) {
        return { error: "Invalid school type" };
      }

      // If it's a college entry, validate degree fields
      if (school_type === "college") {
        if (degree_type) {
          const allowedDegreeTypes = [
            "Associate",
            "Bachelor",
            "Master",
            "PhD",
            "MD",
            "JD",
            "Other_Doctorate",
          ];
          if (!allowedDegreeTypes.includes(degree_type)) {
            return {
              error:
                "Invalid degree type. Must be one of: Associate, Bachelor, Master, PhD, MD, JD, Other_Doctorate",
            };
          }
        }
      }

      const result = await sql`
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

      return { data: result[0] };
    } catch (err) {
      console.error("Error adding education:", err);
      return { error: err.message || "Failed to add education entry" };
    }
  }

  if (method === "PUT") {
    if (!id) {
      return { error: "Missing education entry ID" };
    }

    try {
      const {
        school_type,
        school_name,
        years_attended,
        city,
        state,
        comments,
        year_graduated,
        degree_type,
        degree_discipline,
      } = data;

      // Validate required fields (same as POST)
      if (!school_type) {
        return { error: "School type is required" };
      }
      if (!school_name) {
        return { error: "School name is required" };
      }
      if (!years_attended) {
        return { error: "Years attended is required" };
      }
      if (!city) {
        return { error: "City is required" };
      }
      if (!state) {
        return { error: "State is required" };
      }

      // Validate school_type against allowed values
      const allowedSchoolTypes = [
        "elementary",
        "junior_high",
        "high_school",
        "college",
      ];
      if (!allowedSchoolTypes.includes(school_type)) {
        return { error: "Invalid school type" };
      }

      // If it's a college entry, validate degree fields
      if (school_type === "college") {
        if (degree_type) {
          const allowedDegreeTypes = [
            "Associate",
            "Bachelor",
            "Master",
            "PhD",
            "MD",
            "JD",
            "Other_Doctorate",
          ];
          if (!allowedDegreeTypes.includes(degree_type)) {
            return {
              error:
                "Invalid degree type. Must be one of: Associate, Bachelor, Master, PhD, MD, JD, Other_Doctorate",
            };
          }
        }
      }

      const result = await sql`
        UPDATE education_history 
        SET
          school_type = ${school_type},
          school_name = ${school_name},
          years_attended = ${years_attended},
          city = ${city},
          state = ${state},
          comments = ${comments || null},
          year_graduated = ${year_graduated || null},
          degree_type = ${degree_type || null},
          degree_discipline = ${degree_discipline || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id} AND user_id = ${session.user.id}
        RETURNING *
      `;

      if (result.length === 0) {
        return { error: "Education entry not found or unauthorized" };
      }

      return { data: result[0] };
    } catch (err) {
      console.error("Error updating education:", err);
      return { error: err.message || "Failed to update education entry" };
    }
  }

  if (method === "DELETE") {
    if (!id) {
      return { error: "Missing education entry ID" };
    }

    const result = await sql`
      DELETE FROM education_history 
      WHERE id = ${id} AND user_id = ${session.user.id}
      RETURNING id
    `;

    if (result.length === 0) {
      return { error: "Education entry not found or unauthorized" };
    }

    return { success: true };
  }

  return { error: "Method not allowed" };
}
export async function POST(request) {
  return handler(await request.json());
}
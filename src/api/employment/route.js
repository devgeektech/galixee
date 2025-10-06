async function handler({
  method,
  id,
  employer,
  city,
  state,
  position,
  start_date,
  end_date,
  description,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  try {
    switch (method) {
      case "GET": {
        const employmentHistory = await sql`
          SELECT * FROM employment_history 
          WHERE user_id = ${userId}
          ORDER BY start_date DESC
        `;
        return { data: employmentHistory };
      }

      case "POST": {
        if (!employer || !city || !state || !position || !start_date) {
          return { error: "Missing required fields" };
        }

        const newEntry = await sql`
          INSERT INTO employment_history 
          (user_id, employer, city, state, position, start_date, end_date, description)
          VALUES 
          (${userId}, ${employer}, ${city}, ${state}, ${position}, ${start_date}, 
           ${end_date || null}, ${description || null})
          RETURNING *
        `;
        return { data: newEntry[0] };
      }

      case "PUT": {
        if (!id) {
          return { error: "Missing entry ID" };
        }

        const updated = await sql`
          UPDATE employment_history 
          SET 
            employer = ${employer},
            city = ${city},
            state = ${state},
            position = ${position},
            start_date = ${start_date},
            end_date = ${end_date || null},
            description = ${description || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;

        if (updated.length === 0) {
          return { error: "Entry not found or unauthorized" };
        }

        return { data: updated[0] };
      }

      case "DELETE": {
        if (!id) {
          return { error: "Missing entry ID" };
        }

        const deleted = await sql`
          DELETE FROM employment_history 
          WHERE id = ${id} AND user_id = ${userId}
          RETURNING *
        `;

        if (deleted.length === 0) {
          return { error: "Entry not found or unauthorized" };
        }

        return { data: deleted[0] };
      }

      default:
        return { error: "Method not allowed" };
    }
  } catch (error) {
    console.error("Employment history error:", error);
    return { error: error.message || "Internal server error" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
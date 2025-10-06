async function handler({ method, id, ...params }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    switch (method) {
      case "GET": {
        const members = await sql`
          SELECT * FROM family_tree_members 
          WHERE user_id = ${session.user.id}
          ORDER BY created_at DESC
        `;
        return { members };
      }

      case "CREATE": {
        const { name, relationship, birthDate, email, isGalixeeUser } = params;
        const [member] = await sql`
          INSERT INTO family_tree_members (
            user_id, 
            name, 
            relation_type,
            date_of_birth,
            current_city,
            current_state,
            current_country,
            tree_position,
            linked_galixee_user_id
          )
          VALUES (
            ${session.user.id},
            ${name},
            ${relationship},
            ${birthDate || null},
            ${null},
            ${null},
            ${"United States"},
            ${JSON.stringify({})},
            ${null}
          )
          RETURNING *
        `;
        return { member };
      }

      case "UPDATE": {
        const { name, relationship, birthDate, email, isGalixeeUser } = params;
        const [member] = await sql`
          UPDATE family_tree_members 
          SET 
            name = ${name},
            relation_type = ${relationship},
            date_of_birth = ${birthDate || null}
          WHERE id = ${id} 
          AND user_id = ${session.user.id}
          RETURNING *
        `;
        return { member };
      }

      case "DELETE": {
        await sql`
          DELETE FROM family_tree_members 
          WHERE id = ${id} 
          AND user_id = ${session.user.id}
        `;
        return { success: true };
      }

      case "CREATE_TREE": {
        // Get all family members
        const members = await sql`
          SELECT * FROM family_tree_members 
          WHERE user_id = ${session.user.id}
        `;

        // Use Gemini to calculate optimal positions
        const response = await fetch("https://api.gemini.com/v1/layout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
          },
          body: JSON.stringify({
            nodes: members.map((m) => ({
              id: m.id,
              type: m.relation_type,
            })),
          }),
        });

        const layout = await response.json();

        // Update positions in database
        await sql.transaction(
          layout.nodes.map(
            (node) => sql`
              UPDATE family_tree_members 
              SET 
                x_position = ${node.x * 100}, 
                y_position = ${node.y * 100}
              WHERE id = ${node.id} 
              AND user_id = ${session.user.id}
            `
          )
        );

        // Return updated members
        const updatedMembers = await sql`
          SELECT * FROM family_tree_members 
          WHERE user_id = ${session.user.id}
          ORDER BY created_at DESC
        `;

        return { members: updatedMembers };
      }

      default:
        return { error: "Invalid method" };
    }
  } catch (error) {
    console.error(error);
    return { error: "An error occurred" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
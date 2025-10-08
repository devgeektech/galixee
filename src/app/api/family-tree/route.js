import sql from "@/db";
import { getSession } from "@/utilities/getSession"; // use named import
import { NextResponse } from "next/server";

async function handler({
  method,
  id,
  name,
  relationship,
  birthDate,
  email,
  isGalixeeUser,
}) {
  const session = await getSession();
  if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" });
  }

  try {
    switch (method) {
      case "GET": {
        const result = await sql`
          SELECT 
            id, 
            name, 
            relation_type,
            date_of_birth,
            linked_galixee_user_id,
            x_position,
            y_position,
            parent_id,
            current_city,
            current_state
          FROM family_tree_members 
          WHERE user_id = ${session.user.id}
          ORDER BY created_at DESC
        `;

        // Map database field names to frontend field names
        const mappedMembers = result.map((member) => ({
          ...member,
          birthDate: member.date_of_birth,
          isGalixeeUser: !!member.linked_galixee_user_id,
        }));

        return NextResponse.json({ members: mappedMembers });
      }

      case "CREATE": {
        // tree_position is required in the database, so provide a default value
        const defaultTreePosition = { x: 0, y: 0, level: 1 };

        const result = await sql`
          INSERT INTO family_tree_members (
            user_id,
            name,
            relation_type,
            date_of_birth,
            linked_galixee_user_id,
            tree_position
          ) VALUES (
            ${session.user.id},
            ${name},
            ${relationship},
            ${birthDate || null},
            ${isGalixeeUser ? session.user.id : null},
            ${JSON.stringify(defaultTreePosition)}
          )
          RETURNING 
            id, 
            name, 
            relation_type,
            date_of_birth,
            linked_galixee_user_id,
            x_position,
            y_position,
            parent_id,
            current_city,
            current_state
        `;

        // Map database field names to frontend field names
        const member = {
          ...result[0],
          birthDate: result[0].date_of_birth,
          isGalixeeUser: !!result[0].linked_galixee_user_id,
        };

        return NextResponse.json({ member });
      }

      case "UPDATE": {
        if (!id) return { error: "Missing member id" };

        const result = await sql`
          UPDATE family_tree_members 
          SET 
            name = ${name},
            relation_type = ${relationship},
            date_of_birth = ${birthDate || null},
            linked_galixee_user_id = ${isGalixeeUser ? session.user.id : null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${session.user.id}
          RETURNING 
            id, 
            name, 
            relation_type,
            date_of_birth,
            linked_galixee_user_id,
            x_position,
            y_position,
            parent_id,
            current_city,
            current_state
        `;

        if (result.length === 0) {
          return NextResponse.json({ error: "Member not found or unauthorized" });
        }

        // Map database field names to frontend field names
        const member = {
          ...result[0],
          birthDate: result[0].date_of_birth,
          isGalixeeUser: !!result[0].linked_galixee_user_id,
        };

        return NextResponse.json({ member });
      }

      case "DELETE": {
        if (!id) return NextResponse.json({ error: "Missing member id" });

        const result = await sql`
          DELETE FROM family_tree_members 
          WHERE id = ${id} AND user_id = ${session.user.id}
          RETURNING id
        `;

        if (result.length === 0) {
          return NextResponse.json({ error: "Member not found or unauthorized" });
        }
        return NextResponse.json({ success: true });
      }

      default:
        return NextResponse.json({ error: "Invalid method" });
    }
  } catch (error) {
    console.error("Family tree handler error:", error);
    return NextResponse.json({ error: "Failed to process request" });
  }
}
export async function POST(request) {
  return handler(await request.json());
}
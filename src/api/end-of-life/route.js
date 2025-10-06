async function handler({ method, action, data }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  switch (`${method}:${action}`) {
    case "GET:checklist":
      const checklist = await sql`
        SELECT * FROM end_of_life_planning 
        WHERE user_id = ${userId} 
        ORDER BY category, created_at`;
      return { checklist };

    case "POST:updateChecklistItem":
      const { id, status, notes, item_name, category } = data;

      if (id) {
        // Update existing item
        await sql`
          UPDATE end_of_life_planning 
          SET status = ${status}, 
              notes = ${notes || ""},
              updated_at = CURRENT_TIMESTAMP,
              completed_at = CASE 
                WHEN ${status} = 'completed' THEN CURRENT_TIMESTAMP
                ELSE completed_at
              END
          WHERE id = ${id} AND user_id = ${userId}`;
      } else if (item_name && category) {
        // Create new item or update if exists (upsert)
        await sql`
          INSERT INTO end_of_life_planning (user_id, category, item_name, status, notes)
          VALUES (${userId}, ${category}, ${item_name}, ${status}, ${
          notes || ""
        })
          ON CONFLICT (user_id, category, item_name) 
          DO UPDATE SET 
            status = ${status}, 
            notes = ${notes || ""},
            updated_at = CURRENT_TIMESTAMP,
            completed_at = CASE 
              WHEN ${status} = 'completed' THEN CURRENT_TIMESTAMP
              ELSE end_of_life_planning.completed_at
            END`;
      } else {
        return { error: "Invalid data provided" };
      }

      return { success: true };

    case "GET:executors":
      const executors = await sql`
        SELECT * FROM end_of_life_executors 
        WHERE user_id = ${userId} 
        ORDER BY created_at`;
      return { executors };

    case "POST:saveExecutor":
      const executor = data;
      if (executor.id) {
        await sql`
          UPDATE end_of_life_executors 
          SET name = ${executor.name},
              relationship = ${executor.relationship},
              email = ${executor.email},
              phone = ${executor.phone},
              address = ${executor.address},
              is_primary = ${executor.is_primary},
              notes = ${executor.notes},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${executor.id} AND user_id = ${userId}`;
      } else {
        await sql`
          INSERT INTO end_of_life_executors 
          (user_id, name, relationship, email, phone, address, is_primary, notes)
          VALUES 
          (${userId}, ${executor.name}, ${executor.relationship}, 
           ${executor.email}, ${executor.phone}, ${executor.address}, 
           ${executor.is_primary}, ${executor.notes})`;
      }
      return { success: true };

    case "DELETE:executor":
      await sql`
        DELETE FROM end_of_life_executors 
        WHERE id = ${data.id} AND user_id = ${userId}`;
      return { success: true };

    case "GET:assets":
      const assets = await sql`
        SELECT a.*, d.file_url as document_url 
        FROM end_of_life_assets a
        LEFT JOIN digital_vault_documents d ON d.id = a.document_reference::integer
        WHERE a.user_id = ${userId} 
        ORDER BY a.created_at`;
      return { assets };

    case "POST:saveAsset":
      const asset = data;
      if (asset.id) {
        await sql`
          UPDATE end_of_life_assets 
          SET asset_type = ${asset.asset_type},
              asset_name = ${asset.asset_name},
              description = ${asset.description},
              estimated_value = ${asset.estimated_value},
              location = ${asset.location},
              beneficiary = ${asset.beneficiary},
              document_reference = ${asset.document_reference},
              notes = ${asset.notes},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${asset.id} AND user_id = ${userId}`;
      } else {
        await sql`
          INSERT INTO end_of_life_assets 
          (user_id, asset_type, asset_name, description, estimated_value, 
           location, beneficiary, document_reference, notes)
          VALUES 
          (${userId}, ${asset.asset_type}, ${asset.asset_name}, 
           ${asset.description}, ${asset.estimated_value}, ${asset.location}, 
           ${asset.beneficiary}, ${asset.document_reference}, ${asset.notes})`;
      }
      return { success: true };

    case "DELETE:asset":
      await sql`
        DELETE FROM end_of_life_assets 
        WHERE id = ${data.id} AND user_id = ${userId}`;
      return { success: true };

    default:
      return { error: "Invalid action" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
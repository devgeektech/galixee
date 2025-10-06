async function handler({ method, userId, connectedUserId, status }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const currentUserId = session.user.id;

  switch (method) {
    case "GET": {
      const connections = await sql`
        SELECT 
          uc.*,
          u.name as connected_user_name,
          u.email as connected_user_email,
          up.image as connected_user_image
        FROM user_connections uc
        JOIN auth_users u ON 
          CASE 
            WHEN uc.user_id = ${currentUserId} THEN u.id = uc.connected_user_id
            ELSE u.id = uc.user_id
          END
        LEFT JOIN user_profiles up ON up.user_id = u.id
        WHERE ${currentUserId} IN (uc.user_id, uc.connected_user_id)
      `;

      return { data: connections };
    }

    case "POST": {
      if (!connectedUserId) {
        return { error: "Connected user ID is required" };
      }

      const existingConnection = await sql`
        SELECT * FROM user_connections 
        WHERE (user_id = ${currentUserId} AND connected_user_id = ${connectedUserId})
        OR (user_id = ${connectedUserId} AND connected_user_id = ${currentUserId})
      `;

      if (existingConnection.length > 0) {
        return { error: "Connection already exists" };
      }

      const newConnection = await sql`
        INSERT INTO user_connections (user_id, connected_user_id, status)
        VALUES (${currentUserId}, ${connectedUserId}, 'pending')
        RETURNING *
      `;

      return { data: newConnection[0] };
    }

    case "PUT": {
      if (!userId || !status || !["accepted", "declined"].includes(status)) {
        return { error: "Invalid request parameters" };
      }

      const connection = await sql`
        SELECT * FROM user_connections 
        WHERE connected_user_id = ${currentUserId}
        AND user_id = ${userId}
        AND status = 'pending'
      `;

      if (connection.length === 0) {
        return { error: "Connection request not found" };
      }

      const updatedConnection = await sql`
        UPDATE user_connections 
        SET status = ${status}
        WHERE connected_user_id = ${currentUserId}
        AND user_id = ${userId}
        RETURNING *
      `;

      return { data: updatedConnection[0] };
    }

    case "DELETE": {
      if (!connectedUserId) {
        return { error: "Connected user ID is required" };
      }

      await sql`
        DELETE FROM user_connections 
        WHERE (user_id = ${currentUserId} AND connected_user_id = ${connectedUserId})
        OR (user_id = ${connectedUserId} AND connected_user_id = ${currentUserId})
      `;

      return { data: { success: true } };
    }

    default:
      return { error: "Method not allowed" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
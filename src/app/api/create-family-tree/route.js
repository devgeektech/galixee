async function handler() {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    const members = await sql`
      SELECT id, name, relation_type, parent_id, x_position, y_position 
      FROM family_tree_members 
      WHERE user_id = ${session.user.id}
    `;

    if (!members.length) {
      return { error: "No family members found" };
    }

    const response = await fetch("https://api.gemini.com/v1/layout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify({
        nodes: members.map((m) => ({
          id: m.id,
          parentId: m.parent_id,
          type: m.relation_type,
        })),
      }),
    });

    const layout = await response.json();

    const updates = layout.nodes.map((node, i) => ({
      id: node.id,
      x: node.x * 100,
      y: node.y * 100,
    }));

    await sql.transaction(
      updates.map(
        (update) =>
          sql`
        UPDATE family_tree_members 
        SET x_position = ${update.x}, 
            y_position = ${update.y}
        WHERE id = ${update.id} 
        AND user_id = ${session.user.id}
      `
      )
    );

    const updatedMembers = await sql`
      SELECT id, name, relation_type, parent_id, x_position, y_position
      FROM family_tree_members
      WHERE user_id = ${session.user.id}
    `;

    return {
      success: true,
      members: updatedMembers,
    };
  } catch (error) {
    return {
      error: "Failed to update family tree layout",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
async function handler({ members }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  try {
    if (!members || !Array.isArray(members)) {
      return { error: "Invalid members data" };
    }

    // Helper function to get relationship category
    const getRelationshipCategory = (relationship) => {
      const parentRelations = ["Mother", "Father"];
      const siblingRelations = ["Sister", "Brother"];
      const spouseRelations = ["Wife", "Husband"];
      const childRelations = ["Son", "Daughter"];
      const grandparentRelations = [
        "Maternal Grandfather",
        "Maternal Grandmother",
        "Paternal Grandfather",
        "Paternal Grandmother",
      ];

      if (parentRelations.includes(relationship)) return "parent";
      if (siblingRelations.includes(relationship)) return "sibling";
      if (spouseRelations.includes(relationship)) return "spouse";
      if (childRelations.includes(relationship)) return "child";
      if (grandparentRelations.includes(relationship)) return "grandparent";
      return "other";
    };

    // Organize members by their relationship category
    const organized = {
      parents: [],
      grandparents: [],
      siblings: [],
      spouses: [],
      children: [],
      others: [],
    };

    members.forEach((member) => {
      const category = getRelationshipCategory(member.relation_type);
      organized[category + "s"].push(member);
    });

    // Calculate positions for each member
    const spacing = { x: 200, y: 150 }; // Base spacing between nodes
    const positions = [];

    // Position parents above
    organized.parents.forEach((parent, i) => {
      positions.push({
        id: parent.id,
        x: -spacing.x / 2 + i * spacing.x,
        y: -spacing.y,
      });
    });

    // Position grandparents above parents
    organized.grandparents.forEach((grandparent, i) => {
      positions.push({
        id: grandparent.id,
        x: -spacing.x * 1.5 + i * spacing.x,
        y: -spacing.y * 2,
      });
    });

    // Position siblings to the left
    organized.siblings.forEach((sibling, i) => {
      positions.push({
        id: sibling.id,
        x: -spacing.x * 1.5,
        y: -spacing.y / 2 + i * spacing.y,
      });
    });

    // Position spouses to the right
    organized.spouses.forEach((spouse, i) => {
      positions.push({
        id: spouse.id,
        x: spacing.x,
        y: 0,
      });
    });

    // Position children below
    organized.children.forEach((child, i) => {
      positions.push({
        id: child.id,
        x: -spacing.x / 2 + i * spacing.x,
        y: spacing.y,
      });
    });

    // Position others in a circular pattern
    organized.others.forEach((other, i) => {
      const angle = (2 * Math.PI * i) / organized.others.length;
      const radius = spacing.x * 2;
      positions.push({
        id: other.id,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });

    // Update positions in the database
    await sql.transaction(
      positions.map(
        (pos) => sql`
        UPDATE family_tree_members 
        SET 
          x_position = ${pos.x}, 
          y_position = ${pos.y}
        WHERE id = ${pos.id} AND user_id = ${session.user.id}
      `
      )
    );

    return { positions };
  } catch (error) {
    console.error("Family tree layout handler error:", error);
    return { error: "Failed to create family tree layout" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
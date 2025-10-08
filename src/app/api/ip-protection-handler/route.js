async function handler(params) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Log the incoming parameters for debugging
  console.log("Received params:", params);

  const {
    method,
    creationId,
    protectionType,
    stepIndex,
    completed,
    completionDate,
  } = params;

  // Validate method is present
  if (!method) {
    return { error: "Method is required" };
  }

  switch (method) {
    case "create": {
      if (!creationId || !protectionType) {
        return { error: "Missing required fields" };
      }

      const existingChecklist = await sql`
        SELECT id FROM ip_protection_checklists 
        WHERE user_id = ${session.user.id} 
        AND creation_id = ${creationId}
      `;

      if (existingChecklist.length > 0) {
        return { error: "Checklist already exists for this creation" };
      }

      const newChecklist = await sql`
        INSERT INTO ip_protection_checklists 
        (user_id, creation_id, protection_type)
        VALUES (${session.user.id}, ${creationId}, ${protectionType})
        RETURNING *
      `;

      return { checklist: newChecklist[0] };
    }

    case "update_step": {
      if (!creationId || !stepIndex || completed === undefined) {
        return { error: "Missing required fields" };
      }

      const checklist = await sql`
        SELECT * FROM ip_protection_checklists 
        WHERE user_id = ${session.user.id} 
        AND creation_id = ${creationId}
      `;

      if (checklist.length === 0) {
        return { error: "Checklist not found" };
      }

      const currentDates = checklist[0].completion_dates || {};
      const updatedDates = completed
        ? {
            ...currentDates,
            [stepIndex]: completionDate || new Date().toISOString(),
          }
        : { ...currentDates };

      if (!completed) {
        delete updatedDates[stepIndex];
      }

      const updatedChecklist = await sql`
        UPDATE ip_protection_checklists 
        SET 
          completion_dates = ${JSON.stringify(updatedDates)},
          current_step = ${stepIndex}
        WHERE user_id = ${session.user.id} 
        AND creation_id = ${creationId}
        RETURNING *
      `;

      return { checklist: updatedChecklist[0] };
    }

    case "get": {
      if (!creationId) {
        return { error: "Missing required fields" };
      }

      const checklist = await sql`
        SELECT * FROM ip_protection_checklists 
        WHERE user_id = ${session.user.id} 
        AND creation_id = ${creationId}
      `;

      return { checklist: checklist[0] || null };
    }

    default:
      return { error: `Invalid method: ${method}` };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
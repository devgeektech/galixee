async function handler({
  method,
  creationId,
  protectionType,
  stepIndex,
  completed,
  completionDate,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  // Initial creation of checklist
  if (!method || method === "POST") {
    const stepsData = {
      patent: {
        steps: [
          "Initial Patent Search",
          "File Provisional Application",
          "File Non-Provisional Application",
          "Respond to Office Actions",
          "Patent Grant",
        ],
      },
      trademark: {
        steps: [
          "Trademark Search",
          "File Application",
          "Respond to Office Actions",
          "Publication",
          "Registration",
        ],
      },
      copyright: {
        steps: [
          "Prepare Materials",
          "Review Requirements",
          "File Application",
          "Registration",
        ],
      },
    };

    // Check if checklist already exists
    const existing = await sql`
      SELECT * FROM ip_protection_checklists 
      WHERE user_id = ${session.user.id}
      AND creation_id = ${creationId}
      AND protection_type = ${protectionType}
    `;

    if (existing.length > 0) {
      return { checklist: existing[0] };
    }

    const checklist = await sql`
      INSERT INTO ip_protection_checklists (
        user_id, 
        creation_id,
        protection_type,
        steps,
        current_step,
        status,
        completion_dates
      )
      VALUES (
        ${session.user.id},
        ${creationId},
        ${protectionType},
        ${JSON.stringify(stepsData[protectionType])}::jsonb,
        1,
        'in_progress',
        '{}'::jsonb
      )
      RETURNING *
    `;

    return { checklist: checklist[0] };
  }

  // Update step completion
  if (method === "UPDATE_STEP") {
    if (!stepIndex) {
      return { error: "Step index is required" };
    }

    // First get the current checklist
    const currentChecklist = await sql`
      SELECT * FROM ip_protection_checklists 
      WHERE user_id = ${session.user.id}
      AND creation_id = ${creationId}
      AND protection_type = ${protectionType}
    `;

    if (!currentChecklist.length) {
      return { error: "Checklist not found" };
    }

    const checklist = currentChecklist[0];

    // Parse the existing completion dates
    let completionDates = checklist.completion_dates || {};

    // Update the completion date for this step
    if (completed) {
      completionDates[stepIndex] = completionDate || new Date().toISOString();
    } else {
      delete completionDates[stepIndex];
    }

    // Calculate new current step and status
    const totalSteps = checklist.steps.steps.length;
    let newCurrentStep = checklist.current_step;
    let newStatus = checklist.status;

    // If completing current step, advance to next step
    if (
      completed &&
      stepIndex === checklist.current_step &&
      stepIndex < totalSteps
    ) {
      newCurrentStep = stepIndex + 1;
    }

    // Check if all steps are completed
    const completedSteps = Object.keys(completionDates).length;
    if (completedSteps === totalSteps) {
      newStatus = "completed";
    }

    // Update the checklist
    const updatedChecklist = await sql`
      UPDATE ip_protection_checklists
      SET 
        current_step = ${newCurrentStep},
        status = ${newStatus},
        completion_dates = ${JSON.stringify(completionDates)}::jsonb,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.user.id}
      AND creation_id = ${creationId}
      AND protection_type = ${protectionType}
      RETURNING *
    `;

    return { checklist: updatedChecklist[0] };
  }

  // Get existing checklist
  if (method === "GET") {
    const checklist = await sql`
      SELECT * FROM ip_protection_checklists 
      WHERE user_id = ${session.user.id}
      AND creation_id = ${creationId}
      AND protection_type = ${protectionType}
    `;

    return { checklist: checklist[0] };
  }

  return { error: "Invalid method" };
}
export async function POST(request) {
  return handler(await request.json());
}
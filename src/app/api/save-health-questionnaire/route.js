// Rate limiting setup
const rateLimits = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS = 10; // Maximum requests per minute

async function handler(data) {
  const session = getSession();

  // Debug session info
  console.log("Save health questionnaire - Session data:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
  });

  if (!session?.user?.id) {
    console.error("No user ID in session");
    return {
      error: "Please sign in to save your health questionnaire.",
      status: 401,
    };
  }

  // Rate limiting check
  const now = Date.now();
  const userId = session.user.id;
  const userRateLimit = rateLimits.get(userId) || {
    count: 0,
    resetTime: now + RATE_LIMIT_WINDOW,
  };

  // Clean up expired rate limits
  for (const [id, limit] of rateLimits.entries()) {
    if (limit.resetTime < now) {
      rateLimits.delete(id);
    }
  }

  // Check if user has exceeded rate limit
  if (userRateLimit.resetTime < now) {
    // Reset if window has expired
    userRateLimit.count = 1;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  } else if (userRateLimit.count >= MAX_REQUESTS) {
    // Calculate time until reset
    const waitSeconds = Math.ceil((userRateLimit.resetTime - now) / 1000);
    return {
      error: "Too many requests. Please try again later.",
      status: 429,
      headers: {
        "Retry-After": waitSeconds.toString(),
      },
    };
  } else {
    // Increment counter
    userRateLimit.count++;
  }

  // Update rate limit tracking
  rateLimits.set(userId, userRateLimit);

  try {
    // First verify the user exists and has an active session
    const [userWithSession] = await sql`
      SELECT u.id, u.email, s.id as session_id
      FROM auth_users u
      INNER JOIN auth_sessions s ON s."userId" = u.id
      WHERE u.id = ${session.user.id}
      AND s.expires > CURRENT_TIMESTAMP
      AND u.email IS NOT NULL
      LIMIT 1
    `;

    if (!userWithSession) {
      console.error("User or active session not found:", {
        userId: session.user.id,
        email: session.user.email,
      });
      return {
        error:
          "Your session appears to be invalid. Please try signing out completely, clearing your browser cache, and signing back in.",
        status: 401,
      };
    }

    console.log("Found valid user and session:", {
      userId: userWithSession.id,
      hasEmail: !!userWithSession.email,
      hasActiveSession: !!userWithSession.session_id,
    });

    // Process the incoming data to ensure proper types
    const processedData = {
      blood_type: data.blood_type || null,
      height_feet: data.height_feet ? parseInt(data.height_feet, 10) : null,
      height_inches: data.height_inches
        ? parseInt(data.height_inches, 10)
        : null,
      weight: data.weight ? parseInt(data.weight, 10) : null,
      allergies: Array.isArray(data.allergies)
        ? data.allergies
        : data.allergies
        ? data.allergies
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      medications: Array.isArray(data.medications)
        ? data.medications
        : data.medications
        ? data.medications
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      chronic_conditions: Array.isArray(data.chronic_conditions)
        ? data.chronic_conditions
        : data.chronic_conditions
        ? data.chronic_conditions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      surgeries: Array.isArray(data.surgeries)
        ? data.surgeries
        : data.surgeries
        ? data.surgeries
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      vaccinations: Array.isArray(data.vaccinations)
        ? data.vaccinations
        : data.vaccinations
        ? data.vaccinations
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      family_history: data.family_history || null,
      family_heart_disease: !!data.family_heart_disease,
      family_diabetes: !!data.family_diabetes,
      family_cancer: !!data.family_cancer,
      family_mental_health: !!data.family_mental_health,
      family_other_conditions: data.family_other_conditions || null,
      exercise_frequency: data.exercise_frequency || null,
      smoking_status: data.smoking_status || null,
      alcohol_consumption: data.alcohol_consumption || null,
      diet_restrictions: Array.isArray(data.diet_restrictions)
        ? data.diet_restrictions
        : data.diet_restrictions
        ? data.diet_restrictions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      mental_health_conditions: Array.isArray(data.mental_health_conditions)
        ? data.mental_health_conditions
        : data.mental_health_conditions
        ? data.mental_health_conditions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
      vision_aids: !!data.vision_aids,
      hearing_aids: !!data.hearing_aids,
      mobility_aids: !!data.mobility_aids,
      emergency_contact_name: data.emergency_contact_name || null,
      emergency_contact_phone: data.emergency_contact_phone || null,
      emergency_contact_relationship:
        data.emergency_contact_relationship || null,
      emergency_contact_1_name: data.emergency_contact_1_name || null,
      emergency_contact_1_phone: data.emergency_contact_1_phone || null,
      emergency_contact_1_relationship:
        data.emergency_contact_1_relationship || null,
      emergency_contact_2_name: data.emergency_contact_2_name || null,
      emergency_contact_2_phone: data.emergency_contact_2_phone || null,
      emergency_contact_2_relationship:
        data.emergency_contact_2_relationship || null,
      primary_physician: data.primary_physician || null,
      physician_phone: data.physician_phone || null,
      preferred_hospital: data.preferred_hospital || null,
      insurance_provider: data.insurance_provider || null,
      insurance_policy_number: data.insurance_policy_number || null,
      last_physical_date: data.last_physical_date || null,
      last_dental_date: data.last_dental_date || null,
      last_eye_exam_date: data.last_eye_exam_date || null,
    };

    // Log the processed data
    console.log("Processed health questionnaire data:", {
      userId: session.user.id,
      processedFields: Object.keys(processedData),
    });

    // Check if a record exists
    const [existingRecord] = await sql`
      SELECT id FROM health_questionnaires 
      WHERE user_id = ${session.user.id}
    `;

    let savedRecord;

    if (existingRecord) {
      console.log(
        "Updating existing health questionnaire record:",
        existingRecord.id
      );
      // Update existing record
      [savedRecord] = await sql`
        UPDATE health_questionnaires 
        SET 
          blood_type = ${processedData.blood_type},
          height_feet = ${processedData.height_feet},
          height_inches = ${processedData.height_inches},
          weight = ${processedData.weight},
          allergies = ${processedData.allergies},
          medications = ${processedData.medications},
          chronic_conditions = ${processedData.chronic_conditions},
          surgeries = ${processedData.surgeries},
          vaccinations = ${processedData.vaccinations},
          family_history = ${processedData.family_history},
          family_heart_disease = ${processedData.family_heart_disease},
          family_diabetes = ${processedData.family_diabetes},
          family_cancer = ${processedData.family_cancer},
          family_mental_health = ${processedData.family_mental_health},
          family_other_conditions = ${processedData.family_other_conditions},
          exercise_frequency = ${processedData.exercise_frequency},
          smoking_status = ${processedData.smoking_status},
          alcohol_consumption = ${processedData.alcohol_consumption},
          diet_restrictions = ${processedData.diet_restrictions},
          mental_health_conditions = ${processedData.mental_health_conditions},
          vision_aids = ${processedData.vision_aids},
          hearing_aids = ${processedData.hearing_aids},
          mobility_aids = ${processedData.mobility_aids},
          emergency_contact_name = ${processedData.emergency_contact_name},
          emergency_contact_phone = ${processedData.emergency_contact_phone},
          emergency_contact_relationship = ${processedData.emergency_contact_relationship},
          emergency_contact_1_name = ${processedData.emergency_contact_1_name},
          emergency_contact_1_phone = ${processedData.emergency_contact_1_phone},
          emergency_contact_1_relationship = ${processedData.emergency_contact_1_relationship},
          emergency_contact_2_name = ${processedData.emergency_contact_2_name},
          emergency_contact_2_phone = ${processedData.emergency_contact_2_phone},
          emergency_contact_2_relationship = ${processedData.emergency_contact_2_relationship},
          primary_physician = ${processedData.primary_physician},
          physician_phone = ${processedData.physician_phone},
          preferred_hospital = ${processedData.preferred_hospital},
          insurance_provider = ${processedData.insurance_provider},
          insurance_policy_number = ${processedData.insurance_policy_number},
          last_physical_date = ${processedData.last_physical_date},
          last_dental_date = ${processedData.last_dental_date},
          last_eye_exam_date = ${processedData.last_eye_exam_date},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingRecord.id}
        RETURNING *
      `;
    } else {
      console.log("Creating new health questionnaire record");
      // Create new record
      [savedRecord] = await sql`
        INSERT INTO health_questionnaires (
          user_id,
          blood_type,
          height_feet,
          height_inches,
          weight,
          allergies,
          medications,
          chronic_conditions,
          surgeries,
          vaccinations,
          family_history,
          family_heart_disease,
          family_diabetes,
          family_cancer,
          family_mental_health,
          family_other_conditions,
          exercise_frequency,
          smoking_status,
          alcohol_consumption,
          diet_restrictions,
          mental_health_conditions,
          vision_aids,
          hearing_aids,
          mobility_aids,
          emergency_contact_name,
          emergency_contact_phone,
          emergency_contact_relationship,
          emergency_contact_1_name,
          emergency_contact_1_phone,
          emergency_contact_1_relationship,
          emergency_contact_2_name,
          emergency_contact_2_phone,
          emergency_contact_2_relationship,
          primary_physician,
          physician_phone,
          preferred_hospital,
          insurance_provider,
          insurance_policy_number,
          last_physical_date,
          last_dental_date,
          last_eye_exam_date
        ) VALUES (
          ${session.user.id},
          ${processedData.blood_type},
          ${processedData.height_feet},
          ${processedData.height_inches},
          ${processedData.weight},
          ${processedData.allergies},
          ${processedData.medications},
          ${processedData.chronic_conditions},
          ${processedData.surgeries},
          ${processedData.vaccinations},
          ${processedData.family_history},
          ${processedData.family_heart_disease},
          ${processedData.family_diabetes},
          ${processedData.family_cancer},
          ${processedData.family_mental_health},
          ${processedData.family_other_conditions},
          ${processedData.exercise_frequency},
          ${processedData.smoking_status},
          ${processedData.alcohol_consumption},
          ${processedData.diet_restrictions},
          ${processedData.mental_health_conditions},
          ${processedData.vision_aids},
          ${processedData.hearing_aids},
          ${processedData.mobility_aids},
          ${processedData.emergency_contact_name},
          ${processedData.emergency_contact_phone},
          ${processedData.emergency_contact_relationship},
          ${processedData.emergency_contact_1_name},
          ${processedData.emergency_contact_1_phone},
          ${processedData.emergency_contact_1_relationship},
          ${processedData.emergency_contact_2_name},
          ${processedData.emergency_contact_2_phone},
          ${processedData.emergency_contact_2_relationship},
          ${processedData.primary_physician},
          ${processedData.physician_phone},
          ${processedData.preferred_hospital},
          ${processedData.insurance_provider},
          ${processedData.insurance_policy_number},
          ${processedData.last_physical_date},
          ${processedData.last_dental_date},
          ${processedData.last_eye_exam_date}
        )
        RETURNING *
      `;
    }

    // Check if we got a result back
    if (!savedRecord) {
      console.error("No result returned from database operation");
      return {
        error: "Failed to save health questionnaire - no data returned",
        status: 500,
      };
    }

    console.log("Successfully saved health questionnaire:", {
      id: savedRecord.id,
      userId: savedRecord.user_id,
    });

    return {
      data: savedRecord,
      message: "Health questionnaire saved successfully",
    };
  } catch (error) {
    console.error("Error saving health questionnaire:", {
      error: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Check for specific database errors
    if (error.code === "23505") {
      // Unique violation
      return {
        error: "A health questionnaire already exists for this user.",
        status: 400,
      };
    }

    if (error.code === "23503") {
      // Foreign key violation
      return {
        error: "Invalid user account. Please try signing in again.",
        status: 401,
      };
    }

    // Check for transaction errors
    if (error.code === "40001") {
      // Serialization failure
      return {
        error:
          "Please try saving again - there was a conflict with another update.",
        status: 409,
      };
    }

    if (error.code === "40P01") {
      // Deadlock detected
      return {
        error:
          "Please try saving again - there was a conflict with another operation.",
        status: 409,
      };
    }

    return {
      error: `Failed to save health questionnaire: ${error.message}`,
      status: 500,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
async function handler() {
  const session = getSession();

  if (!session?.user?.id) {
    return {
      error: "Please sign in to access your health questionnaire.",
      status: 401,
    };
  }

  try {
    const results = await sql`
      SELECT 
        id,
        user_id,
        blood_type,
        height_feet,
        height_inches,
        weight,
        allergies,
        medications,
        chronic_conditions,
        surgeries,
        family_history,
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
        primary_physician,
        physician_phone,
        insurance_provider,
        insurance_policy_number,
        last_physical_date,
        last_dental_date,
        last_eye_exam_date,
        vaccinations,
        family_heart_disease,
        family_diabetes,
        family_cancer,
        family_mental_health,
        family_other_conditions,
        emergency_contact_1_name,
        emergency_contact_1_relationship,
        emergency_contact_1_phone,
        emergency_contact_2_name,
        emergency_contact_2_relationship,
        emergency_contact_2_phone,
        preferred_hospital,
        created_at,
        updated_at
      FROM health_questionnaires 
      WHERE user_id = ${session.user.id}
    `;

    if (!results?.length) {
      return { data: null };
    }

    // Process the result to ensure consistent data types
    const result = results[0];

    // Ensure arrays are always arrays, even if null
    const processArrayField = (field) => {
      if (!field) return [];
      return Array.isArray(field) ? field.filter(Boolean) : [];
    };

    // Ensure booleans are always booleans
    const processBooleanField = (field) => field === true;

    // Convert empty strings and nulls consistently
    const processTextField = (field) => field || null;

    const processedResult = {
      ...result,
      // Arrays
      allergies: processArrayField(result.allergies),
      medications: processArrayField(result.medications),
      chronic_conditions: processArrayField(result.chronic_conditions),
      surgeries: processArrayField(result.surgeries),
      diet_restrictions: processArrayField(result.diet_restrictions),
      mental_health_conditions: processArrayField(
        result.mental_health_conditions
      ),
      vaccinations: processArrayField(result.vaccinations),

      // Booleans
      vision_aids: processBooleanField(result.vision_aids),
      hearing_aids: processBooleanField(result.hearing_aids),
      mobility_aids: processBooleanField(result.mobility_aids),
      family_heart_disease: processBooleanField(result.family_heart_disease),
      family_diabetes: processBooleanField(result.family_diabetes),
      family_cancer: processBooleanField(result.family_cancer),
      family_mental_health: processBooleanField(result.family_mental_health),

      // Text fields
      blood_type: processTextField(result.blood_type),
      family_history: processTextField(result.family_history),
      exercise_frequency: processTextField(result.exercise_frequency),
      smoking_status: processTextField(result.smoking_status),
      alcohol_consumption: processTextField(result.alcohol_consumption),
      emergency_contact_name: processTextField(result.emergency_contact_name),
      emergency_contact_phone: processTextField(result.emergency_contact_phone),
      emergency_contact_relationship: processTextField(
        result.emergency_contact_relationship
      ),
      primary_physician: processTextField(result.primary_physician),
      physician_phone: processTextField(result.physician_phone),
      insurance_provider: processTextField(result.insurance_provider),
      insurance_policy_number: processTextField(result.insurance_policy_number),
      family_other_conditions: processTextField(result.family_other_conditions),
      emergency_contact_1_name: processTextField(
        result.emergency_contact_1_name
      ),
      emergency_contact_1_relationship: processTextField(
        result.emergency_contact_1_relationship
      ),
      emergency_contact_1_phone: processTextField(
        result.emergency_contact_1_phone
      ),
      emergency_contact_2_name: processTextField(
        result.emergency_contact_2_name
      ),
      emergency_contact_2_relationship: processTextField(
        result.emergency_contact_2_relationship
      ),
      emergency_contact_2_phone: processTextField(
        result.emergency_contact_2_phone
      ),
      preferred_hospital: processTextField(result.preferred_hospital),

      // Numeric fields
      height_feet: result.height_feet,
      height_inches: result.height_inches,
      weight: result.weight,

      // Date fields
      last_physical_date: result.last_physical_date,
      last_dental_date: result.last_dental_date,
      last_eye_exam_date: result.last_eye_exam_date,
    };

    return { data: processedResult };
  } catch (err) {
    console.error("Error fetching health questionnaire:", err);
    return {
      error: "Failed to fetch health questionnaire. Please try again.",
      status: 500,
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
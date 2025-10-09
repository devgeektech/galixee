import sql from "@/db";
import { NextResponse } from "next/server";
import getSession from "@/utilities/getSession";
async function handler({ method, id, ...data }) {
  const session = await getSession();
  if (!session?.user?.id) {
      return NextResponse.json( {error: "Not authenticated" });
  }

  const userId = session.user.id;

  try {
    switch (method) {
      case "GET": {
        const questionnaire = await sql`
          SELECT * FROM health_questionnaires 
          WHERE user_id = ${userId}
          ORDER BY created_at DESC 
          LIMIT 1
        `;
         return NextResponse.json(  { data: questionnaire[0] || null });
      }

      case "POST": {
        // First check if a questionnaire already exists
        const [existingQuestionnaire] = await sql`
          SELECT id FROM health_questionnaires 
          WHERE user_id = ${userId}
        `;

        if (existingQuestionnaire) {
          // If exists, update it
          const [questionnaire] = await sql`
            UPDATE health_questionnaires SET
              blood_type = ${data.blood_type || null},
              height_feet = ${
                data.height_feet ? parseInt(data.height_feet) : null
              },
              height_inches = ${
                data.height_inches ? parseInt(data.height_inches) : null
              },
              weight = ${data.weight ? parseInt(data.weight) : null},
              allergies = ${
                data.allergies
                  ? data.allergies.split(",").map((s) => s.trim())
                  : []
              },
              medications = ${
                data.medications
                  ? data.medications.split(",").map((s) => s.trim())
                  : []
              },
              chronic_conditions = ${
                data.chronic_conditions
                  ? data.chronic_conditions.split(",").map((s) => s.trim())
                  : []
              },
              surgeries = ${
                data.surgeries
                  ? data.surgeries.split(",").map((s) => s.trim())
                  : []
              },
              family_history = ${data.family_history || null},
              exercise_frequency = ${data.exercise_frequency || null},
              smoking_status = ${data.smoking_status || null},
              alcohol_consumption = ${data.alcohol_consumption || null},
              diet_restrictions = ${
                data.diet_restrictions
                  ? data.diet_restrictions.split(",").map((s) => s.trim())
                  : []
              },
              mental_health_conditions = ${
                data.mental_health_conditions
                  ? data.mental_health_conditions
                      .split(",")
                      .map((s) => s.trim())
                  : []
              },
              vision_aids = ${data.vision_aids || false},
              hearing_aids = ${data.hearing_aids || false},
              mobility_aids = ${data.mobility_aids || false},
              emergency_contact_name = ${data.emergency_contact_name || null},
              emergency_contact_phone = ${data.emergency_contact_phone || null},
              emergency_contact_relationship = ${
                data.emergency_contact_relationship || null
              },
              primary_physician = ${data.primary_physician || null},
              physician_phone = ${data.physician_phone || null},
              insurance_provider = ${data.insurance_provider || null},
              insurance_policy_number = ${data.insurance_policy_number || null},
              last_physical_date = ${data.last_physical_date || null},
              last_dental_date = ${data.last_dental_date || null},
              last_eye_exam_date = ${data.last_eye_exam_date || null},
              vaccinations = ${
                data.vaccinations
                  ? data.vaccinations.split(",").map((s) => s.trim())
                  : []
              },
              family_heart_disease = ${data.family_heart_disease || false},
              family_diabetes = ${data.family_diabetes || false},
              family_cancer = ${data.family_cancer || false},
              family_mental_health = ${data.family_mental_health || false},
              family_other_conditions = ${data.family_other_conditions || null},
              emergency_contact_1_name = ${
                data.emergency_contact_1_name || null
              },
              emergency_contact_1_relationship = ${
                data.emergency_contact_1_relationship || null
              },
              emergency_contact_1_phone = ${
                data.emergency_contact_1_phone || null
              },
              emergency_contact_2_name = ${
                data.emergency_contact_2_name || null
              },
              emergency_contact_2_relationship = ${
                data.emergency_contact_2_relationship || null
              },
              emergency_contact_2_phone = ${
                data.emergency_contact_2_phone || null
              },
              preferred_hospital = ${data.preferred_hospital || null},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existingQuestionnaire.id} AND user_id = ${userId}
            RETURNING *
          `;
           return NextResponse.json( { data: questionnaire });
        } else {
          // If doesn't exist, create new
          const [questionnaire] = await sql`
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
              preferred_hospital
            ) VALUES (
              ${userId},
              ${data.blood_type || null},
              ${data.height_feet ? parseInt(data.height_feet) : null},
              ${data.height_inches ? parseInt(data.height_inches) : null},
              ${data.weight ? parseInt(data.weight) : null},
              ${
                data.allergies
                  ? data.allergies.split(",").map((s) => s.trim())
                  : []
              },
              ${
                data.medications
                  ? data.medications.split(",").map((s) => s.trim())
                  : []
              },
              ${
                data.chronic_conditions
                  ? data.chronic_conditions.split(",").map((s) => s.trim())
                  : []
              },
              ${
                data.surgeries
                  ? data.surgeries.split(",").map((s) => s.trim())
                  : []
              },
              ${data.family_history || null},
              ${data.exercise_frequency || null},
              ${data.smoking_status || null},
              ${data.alcohol_consumption || null},
              ${
                data.diet_restrictions
                  ? data.diet_restrictions.split(",").map((s) => s.trim())
                  : []
              },
              ${
                data.mental_health_conditions
                  ? data.mental_health_conditions
                      .split(",")
                      .map((s) => s.trim())
                  : []
              },
              ${data.vision_aids || false},
              ${data.hearing_aids || false},
              ${data.mobility_aids || false},
              ${data.emergency_contact_name || null},
              ${data.emergency_contact_phone || null},
              ${data.emergency_contact_relationship || null},
              ${data.primary_physician || null},
              ${data.physician_phone || null},
              ${data.insurance_provider || null},
              ${data.insurance_policy_number || null},
              ${data.last_physical_date || null},
              ${data.last_dental_date || null},
              ${data.last_eye_exam_date || null},
              ${
                data.vaccinations
                  ? data.vaccinations.split(",").map((s) => s.trim())
                  : []
              },
              ${data.family_heart_disease || false},
              ${data.family_diabetes || false},
              ${data.family_cancer || false},
              ${data.family_mental_health || false},
              ${data.family_other_conditions || null},
              ${data.emergency_contact_1_name || null},
              ${data.emergency_contact_1_relationship || null},
              ${data.emergency_contact_1_phone || null},
              ${data.emergency_contact_2_name || null},
              ${data.emergency_contact_2_relationship || null},
              ${data.emergency_contact_2_phone || null},
              ${data.preferred_hospital || null}
            ) RETURNING *
          `;
           return NextResponse.json({data: questionnaire });
        }
      }

      default:
         return NextResponse.json({ error: "Method not allowed" });
    }
  } catch (error) {
    console.error("Health questionnaire handler error:", error);
     return NextResponse.json({error: "Internal server error" });
  }
}
export async function POST(request) {
  return handler(await request.json());
}
async function handler({ action, data, serviceId }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  switch (action) {
    case "saveCustomFields": {
      const { fieldName, fieldValue, fieldType, category } = data;

      const result = await sql`
        INSERT INTO dna_custom_fields 
        (user_id, field_name, field_value, field_type, category)
        VALUES 
        (${userId}, ${fieldName}, ${fieldValue}, ${fieldType}, ${category})
        ON CONFLICT (user_id, field_name) DO UPDATE
        SET field_value = ${fieldValue},
            field_type = ${fieldType},
            category = ${category},
            updated_at = CURRENT_TIMESTAMP
        RETURNING *`;

      return { field: result[0] };
    }

    case "getCustomFields": {
      const fields = await sql`
        SELECT * FROM dna_custom_fields 
        WHERE user_id = ${userId}
        ORDER BY category, field_name`;

      return { fields };
    }

    case "saveDNAService": {
      const {
        serviceName,
        serviceId,
        ancestryData,
        healthData,
        traitsData,
        relativeConnections,
        rawDataUrl,
      } = data;

      const result = await sql`
        INSERT INTO dna_services 
        (user_id, service_name, service_id, ancestry_data, health_data, traits_data, 
         relative_connections, raw_data_url, last_sync_date)
        VALUES 
        (${userId}, ${serviceName}, ${serviceId}, ${ancestryData}, ${healthData}, 
         ${traitsData}, ${relativeConnections}, ${rawDataUrl}, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id, service_name) DO UPDATE
        SET service_id = ${serviceId},
            ancestry_data = ${ancestryData},
            health_data = ${healthData},
            traits_data = ${traitsData},
            relative_connections = ${relativeConnections},
            raw_data_url = ${rawDataUrl},
            last_sync_date = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        RETURNING *`;

      return { service: result[0] };
    }

    case "getDNAServices": {
      const services = await sql`
        SELECT * FROM dna_services 
        WHERE user_id = ${userId}
        ORDER BY service_name`;

      return { services };
    }

    case "removeDNAService": {
      if (!serviceId) {
        return { error: "Service ID is required" };
      }

      await sql`
        DELETE FROM dna_services 
        WHERE user_id = ${userId} 
        AND id = ${serviceId}`;

      return { success: true };
    }

    default:
      return { error: "Invalid action" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
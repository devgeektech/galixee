async function handler({ method, ...data }) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  try {
    if (method === "GET") {
      const results = await sql`
        SELECT 
          up.image,
          up.first_name,
          up.middle_name,
          up.last_name,
          up.maiden_name,
          up.race,
          up.sex,
          up.birthdate,
          up.height,
          up.weight,
          up.current_city,
          up.current_state,
          up.current_country,
          up.birthplace_city,
          up.birthplace_state,
          up.birthplace_country,
          up.religious_affiliation,
          up.favorite_sports_team,
          up.favorite_color,
          up.first_vehicle,
          up.favorite_hobbies,
          up.favorite_music_genre,
          up.favorite_music_band,
          up.favorite_travel_destination
        FROM user_profiles up
        WHERE up.user_id = ${session.user.id}
      `;

      return { data: results[0] || null };
    }

    if (method === "POST") {
      // Convert empty strings to null for numeric fields
      const height = data.height === "" ? null : data.height;
      const weight = data.weight === "" ? null : data.weight;

      // First check if a profile exists
      const existingProfile = await sql`
        SELECT id FROM user_profiles WHERE user_id = ${session.user.id}
      `;

      let result;
      if (existingProfile.length === 0) {
        // Insert new profile
        result = await sql`
          INSERT INTO user_profiles (
            user_id,
            image,
            first_name,
            middle_name,
            last_name,
            maiden_name,
            race,
            sex,
            birthdate,
            height,
            weight,
            current_city,
            current_state,
            current_country,
            birthplace_city,
            birthplace_state,
            birthplace_country,
            religious_affiliation,
            favorite_sports_team,
            favorite_color,
            first_vehicle,
            favorite_hobbies,
            favorite_music_genre,
            favorite_music_band,
            favorite_travel_destination
          ) VALUES (
            ${session.user.id},
            ${data.image},
            ${data.first_name},
            ${data.middle_name},
            ${data.last_name},
            ${data.maiden_name},
            ${data.race},
            ${data.sex},
            ${data.birthdate},
            ${height},
            ${weight},
            ${data.current_city},
            ${data.current_state},
            ${data.current_country},
            ${data.birthplace_city},
            ${data.birthplace_state},
            ${data.birthplace_country},
            ${data.religious_affiliation},
            ${data.favorite_sports_team},
            ${data.favorite_color},
            ${data.first_vehicle},
            ${data.favorite_hobbies},
            ${data.favorite_music_genre},
            ${data.favorite_music_band},
            ${data.favorite_travel_destination}
          )
          RETURNING *
        `;
      } else {
        // Update existing profile
        result = await sql`
          UPDATE user_profiles 
          SET
            image = COALESCE(${data.image}, image),
            first_name = COALESCE(${data.first_name}, first_name),
            middle_name = COALESCE(${data.middle_name}, middle_name),
            last_name = COALESCE(${data.last_name}, last_name),
            maiden_name = COALESCE(${data.maiden_name}, maiden_name),
            race = COALESCE(${data.race}, race),
            sex = COALESCE(${data.sex}, sex),
            birthdate = COALESCE(${data.birthdate}, birthdate),
            height = COALESCE(${height}, height),
            weight = COALESCE(${weight}, weight),
            current_city = COALESCE(${data.current_city}, current_city),
            current_state = COALESCE(${data.current_state}, current_state),
            current_country = COALESCE(${data.current_country}, current_country),
            birthplace_city = COALESCE(${data.birthplace_city}, birthplace_city),
            birthplace_state = COALESCE(${data.birthplace_state}, birthplace_state),
            birthplace_country = COALESCE(${data.birthplace_country}, birthplace_country),
            religious_affiliation = COALESCE(${data.religious_affiliation}, religious_affiliation),
            favorite_sports_team = COALESCE(${data.favorite_sports_team}, favorite_sports_team),
            favorite_color = COALESCE(${data.favorite_color}, favorite_color),
            first_vehicle = COALESCE(${data.first_vehicle}, first_vehicle),
            favorite_hobbies = COALESCE(${data.favorite_hobbies}, favorite_hobbies),
            favorite_music_genre = COALESCE(${data.favorite_music_genre}, favorite_music_genre),
            favorite_music_band = COALESCE(${data.favorite_music_band}, favorite_music_band),
            favorite_travel_destination = COALESCE(${data.favorite_travel_destination}, favorite_travel_destination),
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${session.user.id}
          RETURNING *
        `;
      }

      return { data: result[0] };
    }

    return { error: "Method not allowed" };
  } catch (err) {
    console.error("Profile handler error:", err);
    return {
      error: err.message || "An error occurred while processing your request",
    };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
import sql from "@/db";
import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";

async function handler(request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json().catch(() => ({}));
    const method = request.method;

    if (method === "GET") {
      const results = await sql`
        SELECT *
        FROM user_profiles
        WHERE user_id = ${session.user.id}
      `;
      return NextResponse.json({ data: results[0] || null });
    }

   if (method === "POST") {
  // Helper: convert undefined or empty string to null
  const sanitize = (value) => value === undefined || value === "" ? null : value;

  const height = sanitize(data.height);
  const weight = sanitize(data.weight);

  const insertData = {
    image: sanitize(data.image),
    first_name: sanitize(data.first_name),
    middle_name: sanitize(data.middle_name),
    last_name: sanitize(data.last_name),
    maiden_name: sanitize(data.maiden_name),
    race: sanitize(data.race),
    sex: sanitize(data.sex),
    birthdate: sanitize(data.birthdate),
    height,
    weight,
    current_city: sanitize(data.current_city),
    current_state: sanitize(data.current_state),
    current_country: sanitize(data.current_country),
    birthplace_city: sanitize(data.birthplace_city),
    birthplace_state: sanitize(data.birthplace_state),
    birthplace_country: sanitize(data.birthplace_country),
    religious_affiliation: sanitize(data.religious_affiliation),
    favorite_sports_team: sanitize(data.favorite_sports_team),
    favorite_color: sanitize(data.favorite_color),
    first_vehicle: sanitize(data.first_vehicle),
    favorite_hobbies: sanitize(data.favorite_hobbies),
    favorite_music_genre: sanitize(data.favorite_music_genre),
    favorite_music_band: sanitize(data.favorite_music_band),
    favorite_travel_destination: sanitize(data.favorite_travel_destination),
    bio: sanitize(data.bio),
  };

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
        favorite_travel_destination,
        bio
      ) VALUES (
        ${session.user.id},
        ${insertData.image},
        ${insertData.first_name},
        ${insertData.middle_name},
        ${insertData.last_name},
        ${insertData.maiden_name},
        ${insertData.race},
        ${insertData.sex},
        ${insertData.birthdate},
        ${insertData.height},
        ${insertData.weight},
        ${insertData.current_city},
        ${insertData.current_state},
        ${insertData.current_country},
        ${insertData.birthplace_city},
        ${insertData.birthplace_state},
        ${insertData.birthplace_country},
        ${insertData.religious_affiliation},
        ${insertData.favorite_sports_team},
        ${insertData.favorite_color},
        ${insertData.first_vehicle},
        ${insertData.favorite_hobbies},
        ${insertData.favorite_music_genre},
        ${insertData.favorite_music_band},
        ${insertData.favorite_travel_destination},
        ${insertData.bio}
      )
      RETURNING *
    `;
  } else {
    // Update existing profile
    result = await sql`
      UPDATE user_profiles
      SET
        image = COALESCE(${insertData.image}, image),
        first_name = COALESCE(${insertData.first_name}, first_name),
        middle_name = COALESCE(${insertData.middle_name}, middle_name),
        last_name = COALESCE(${insertData.last_name}, last_name),
        maiden_name = COALESCE(${insertData.maiden_name}, maiden_name),
        race = COALESCE(${insertData.race}, race),
        sex = COALESCE(${insertData.sex}, sex),
        birthdate = COALESCE(${insertData.birthdate}, birthdate),
        height = COALESCE(${insertData.height}, height),
        weight = COALESCE(${insertData.weight}, weight),
        current_city = COALESCE(${insertData.current_city}, current_city),
        current_state = COALESCE(${insertData.current_state}, current_state),
        current_country = COALESCE(${insertData.current_country}, current_country),
        birthplace_city = COALESCE(${insertData.birthplace_city}, birthplace_city),
        birthplace_state = COALESCE(${insertData.birthplace_state}, birthplace_state),
        birthplace_country = COALESCE(${insertData.birthplace_country}, birthplace_country),
        religious_affiliation = COALESCE(${insertData.religious_affiliation}, religious_affiliation),
        favorite_sports_team = COALESCE(${insertData.favorite_sports_team}, favorite_sports_team),
        favorite_color = COALESCE(${insertData.favorite_color}, favorite_color),
        first_vehicle = COALESCE(${insertData.first_vehicle}, first_vehicle),
        favorite_hobbies = COALESCE(${insertData.favorite_hobbies}, favorite_hobbies),
        favorite_music_genre = COALESCE(${insertData.favorite_music_genre}, favorite_music_genre),
        favorite_music_band = COALESCE(${insertData.favorite_music_band}, favorite_music_band),
        favorite_travel_destination = COALESCE(${insertData.favorite_travel_destination}, favorite_travel_destination),
        bio = COALESCE(${insertData.bio}, bio),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${session.user.id}
      RETURNING *
    `;
  }

  return NextResponse.json({ data: result[0] });
  }


    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  } catch (err) {
    console.error("Profile handler error:", err);
    return NextResponse.json(
      { error: err.message || "An error occurred while processing your request" },
      { status: 500 }
    );
  }
}

// Next.js API handler
export async function GET(request) {
  return handler(request);
}

export async function POST(request) {
  return handler(request);
}

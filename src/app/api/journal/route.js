import getSession from "@/utilities/getSession";
import { NextResponse } from "next/server";
import sql from "@/db";

async function handler({
  method,
  id,
  title,
  content,
  visibility,
  media,
  thumbnails,
  comment_content,
  request_content,
  request_id,
  request_status,
  entry_id,
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized", status: 401 });
  }

  // Helper function to check if URL is a video
  const isVideoUrl = (url) => {
    return (
      url.match(
        /\.(mp4|webm|mov|avi|m4v|mkv|flv|wmv|ogg|ogv|3gp|m2v|f4v)(\?|$)/i
      ) || url.includes("video")
    );
  };

  try {
    switch (method) {
      // =====================================================
      // GET ENTRIES
      // =====================================================
      case "GET": {
        const entries = await sql`
          WITH entry_data AS (
            SELECT 
              je.*,
              COALESCE(
                json_agg(
                  DISTINCT jsonb_build_object(
                    'id', jm.id,
                    'media_url', jm.media_url,
                    'media_type', jm.media_type,
                    'thumbnail_url', jm.thumbnail_url
                  )
                ) FILTER (WHERE jm.id IS NOT NULL),
                '[]'::json
              ) as media,
              je.user_id as owner_id
            FROM journal_entries je
            LEFT JOIN journal_media jm ON je.id = jm.journal_id AND jm.status = 'approved'
            WHERE je.user_id = ${session.user.id}
              OR je.visibility IN ('public', 'semi-public')
            GROUP BY je.id, je.user_id
          ),
          request_data AS (
            SELECT 
              jar.journal_id,
              json_agg(
                jsonb_build_object(
                  'id', jar.id,
                  'content', jar.content,
                  'status', jar.status,
                  'created_at', jar.created_at,
                  'media', jar.media,
                  'requester_id', jar.requester_id,
                  'requester_name', au.name,
                  'requester_image', au.image
                )
                ORDER BY 
                  CASE 
                    WHEN jar.status = 'approved' THEN 1
                    WHEN jar.status = 'pending' THEN 2
                    ELSE 3
                  END,
                  jar.created_at DESC
              ) FILTER (WHERE jar.id IS NOT NULL AND jar.status != 'declined') as add_requests
            FROM journal_add_requests jar
            JOIN auth_users au ON jar.requester_id = au.id
            GROUP BY jar.journal_id
          )
          SELECT 
            e.*,
            e.owner_id as user_id,
            COALESCE(r.add_requests, '[]'::json) as add_requests
          FROM entry_data e
          LEFT JOIN request_data r ON e.id = r.journal_id
          ORDER BY e.created_at DESC
        `;

        return NextResponse.json({ data: entries });
      }

      // =====================================================
      // CREATE ENTRY
      // =====================================================
      case "POST": {
        if (!title || !content || !visibility) {
          return NextResponse.json({
            error: "Missing required fields",
            status: 400,
          });
        }

        const [newEntry] = await sql`
          INSERT INTO journal_entries (user_id, title, content, visibility)
          VALUES (${session.user.id}, ${title}, ${content}, ${visibility})
          RETURNING *
        `;

        if (!newEntry?.id) {
          return NextResponse.json({
            error: "Failed to create journal entry",
            status: 500,
          });
        }


        if (media && Array.isArray(media) && media.length > 0) {
          const thumbnailMap = {};
          if (thumbnails && Array.isArray(thumbnails)) {
            thumbnails.forEach((thumb) => {
              thumbnailMap[thumb.url] = thumb.thumbnail;
            });
          }

          const mediaInserts = media.map((url) => {
            const isVideo = isVideoUrl(url);
            return {
              journal_id: newEntry.id,
              user_id: session.user.id,
              media_type: isVideo ? "video" : "image",
              media_url: url,
              thumbnail_url: thumbnailMap[url] || null,
              status: "approved",
            };
          });

          await sql`
    INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
    VALUES ${sql(
            mediaInserts.map((m) => [
              m.journal_id,
              m.user_id,
              m.media_type,
              m.media_url,
              m.thumbnail_url,
              m.status,
            ])
          )}
  `;
        }


        const [completeEntry] = await sql`
          SELECT 
            je.*,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', jm.id,
                  'media_url', jm.media_url,
                  'media_type', jm.media_type,
                  'thumbnail_url', jm.thumbnail_url
                )
              ) FILTER (WHERE jm.id IS NOT NULL),
              '[]'
            ) as media
          FROM journal_entries je
          LEFT JOIN journal_media jm ON je.id = jm.journal_id AND jm.status = 'approved'
          WHERE je.id = ${newEntry.id}
          GROUP BY je.id
        `;

        return NextResponse.json({ data: completeEntry });
      }

      // =====================================================
      // UPDATE ENTRY
      // =====================================================
      case "PUT": {
        if (!id) {
          return NextResponse.json({ error: "Missing entry ID", status: 400 });
        }

        const [existingEntry] = await sql`
          SELECT * FROM journal_entries 
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (!existingEntry) {
          return NextResponse.json({ error: "Entry not found", status: 404 });
        }

        await sql`
          UPDATE journal_entries 
          SET 
            title = COALESCE(${title}, title),
            content = COALESCE(${content}, content),
            visibility = COALESCE(${visibility}, visibility),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (media && Array.isArray(media) && media.length > 0) {
          const thumbnailMap = {};
          if (thumbnails && Array.isArray(thumbnails)) {
            thumbnails.forEach((thumb) => {
              thumbnailMap[thumb.url] = thumb.thumbnail;
            });
          }

          const mediaInserts = media.map((url) => {
            const isVideo = isVideoUrl(url);
            return {
              journal_id: id,
              user_id: session.user.id,
              media_type: isVideo ? "video" : "image",
              media_url: url,
              thumbnail_url: thumbnailMap[url] || null,
              status: "approved",
            };
          });

          await sql`
            INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
            VALUES ${sql(
            mediaInserts.map((m) => [
              m.journal_id,
              m.user_id,
              m.media_type,
              m.media_url,
              m.thumbnail_url,
              m.status,
            ])
          )}
          `;
        }

        const [updatedEntry] = await sql`
          SELECT 
            je.*,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object(
                  'id', jm.id,
                  'media_url', jm.media_url,
                  'media_type', jm.media_type,
                  'thumbnail_url', jm.thumbnail_url
                )
              ) FILTER (WHERE jm.id IS NOT NULL),
              '[]'
            ) as media
          FROM journal_entries je
          LEFT JOIN journal_media jm ON je.id = jm.journal_id AND jm.status = 'approved'
          WHERE je.id = ${id}
          GROUP BY je.id
        `;

        return NextResponse.json({ data: updatedEntry });
      }

      // =====================================================
      // DELETE ENTRY
      // =====================================================
      case "DELETE": {
        if (!id) {
          return NextResponse.json({ error: "Missing entry ID", status: 400 });
        }

        await sql`
          DELETE FROM journal_entries 
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        return NextResponse.json({
          data: { message: "Entry deleted successfully" },
        });
      }

      // =====================================================
      // COMMENT
      // =====================================================
      case "COMMENT": {
        if (!id || !comment_content) {
          return NextResponse.json({
            error: "Missing required fields",
            status: 400,
          });
        }

        const [newComment] = await sql`
          INSERT INTO journal_comments (journal_id, user_id, content)
          VALUES (${id}, ${session.user.id}, ${comment_content})
          RETURNING *
        `;

        return NextResponse.json({ data: newComment });
      }

      // =====================================================
      // ADD REQUEST
      // =====================================================
      case "ADD_REQUEST": {
        if (!id || !request_content) {
          return NextResponse.json({
            error: "Missing required fields",
            status: 400,
          });
        }

        const [entry] = await sql`
          SELECT * FROM journal_entries 
          WHERE id = ${id} 
          AND visibility IN ('public', 'semi-public')
        `;

        if (!entry) {
          return NextResponse.json({
            error: "Entry not found or not public",
            status: 404,
          });
        }

        const [existingRequest] = await sql`
          SELECT * FROM journal_add_requests
          WHERE journal_id = ${id}
          AND requester_id = ${session.user.id}
          AND status = 'pending'
        `;

        if (existingRequest) {
          return NextResponse.json({
            error: "You already have a pending request",
            status: 400,
          });
        }

        const [newRequest] = await sql`
          INSERT INTO journal_add_requests 
            (journal_id, requester_id, content, media)
          VALUES 
            (${id}, ${session.user.id}, ${request_content}, ${media || null})
          RETURNING *
        `;

        return NextResponse.json({ data: newRequest });
      }

      // =====================================================
      // UPDATE ADD REQUEST
      // =====================================================
      case "UPDATE_ADD_REQUEST": {
        if (!request_id || !request_status) {
          return NextResponse.json({
            error: "Missing required fields",
            status: 400,
          });
        }

        const [request] = await sql`
          SELECT 
            jar.*,
            je.user_id as entry_owner_id,
            je.id as journal_id
          FROM journal_add_requests jar
          JOIN journal_entries je ON jar.journal_id = je.id
          WHERE jar.id = ${request_id}
        `;

        if (!request) {
          return NextResponse.json({ error: "Request not found", status: 404 });
        }

        if (request.entry_owner_id !== session.user.id) {
          return NextResponse.json({
            error: "Unauthorized to update this request",
            status: 403,
          });
        }

        await sql`
          UPDATE journal_add_requests
          SET 
            status = ${request_status},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${request_id}
        `;

        if (
          request_status === "approved" &&
          request.media &&
          Array.isArray(request.media) &&
          request.media.length > 0
        ) {
          const mediaInserts = request.media.map((url) => {
            const isVideo = isVideoUrl(url);
            return {
              journal_id: request.journal_id,
              user_id: request.requester_id,
              media_type: isVideo ? "video" : "image",
              media_url: url,
              thumbnail_url: null,
              status: "approved",
            };
          });

          await sql`
            INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
            VALUES ${sql(
            mediaInserts.map((m) => [
              m.journal_id,
              m.user_id,
              m.media_type,
              m.media_url,
              m.thumbnail_url,
              m.status,
            ])
          )}
          `;
        }

        return NextResponse.json({ data: "Request updated successfully" });
      }

      default:
        return NextResponse.json({ error: "Method not allowed", status: 405 });
    }
  } catch (error) {
    console.error("Journal handler error:", error);
    return NextResponse.json({
      error: error.message || "Internal server error",
      status: 500,
    });
  }
}

export async function POST(request) {
  return handler(await request.json());
}

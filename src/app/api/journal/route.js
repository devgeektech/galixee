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
  const session = getSession();

  if (!session?.user?.id) {
    return { error: "Unauthorized", status: 401 };
  }

  // Helper function to generate video thumbnail
  const generateVideoThumbnail = async (videoUrl) => {
    try {
      // Create a canvas to capture video frame
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const video = document.createElement("video");

      return new Promise((resolve, reject) => {
        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Seek to 1 second or 10% of duration, whichever is smaller
          const seekTime = Math.min(1, video.duration * 0.1);
          video.currentTime = seekTime;
        };

        video.onseeked = () => {
          try {
            ctx.drawImage(video, 0, 0);
            const thumbnailDataUrl = canvas.toDataURL("image/jpeg", 0.8);
            resolve(thumbnailDataUrl);
          } catch (error) {
            reject(error);
          }
        };

        video.onerror = () => reject(new Error("Failed to load video"));
        video.src = videoUrl;
        video.load();
      });
    } catch (error) {
      console.error("Error generating thumbnail:", error);
      return null;
    }
  };

  // Helper function to determine if URL is a video
  const isVideoUrl = (url) => {
    return (
      url.match(
        /\.(mp4|webm|mov|avi|m4v|mkv|flv|wmv|ogg|ogv|3gp|m2v|f4v)(\?|$)/i
      ) || url.includes("video")
    );
  };

  try {
    switch (method) {
      case "GET": {
        // Get entries with their media and add requests
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

        return { data: entries };
      }

      case "POST": {
        if (!title || !content || !visibility) {
          return { error: "Missing required fields", status: 400 };
        }

        // First insert the journal entry
        const [newEntry] = await sql`
          INSERT INTO journal_entries (user_id, title, content, visibility)
          VALUES (${session.user.id}, ${title}, ${content}, ${visibility})
          RETURNING *
        `;

        if (!newEntry?.id) {
          console.error("Failed to create journal entry:", newEntry);
          return { error: "Failed to create journal entry", status: 500 };
        }

        // If there's media, insert it
        if (media && Array.isArray(media) && media.length > 0) {
          // Create a map of thumbnails for quick lookup
          const thumbnailMap = {};
          if (thumbnails && Array.isArray(thumbnails)) {
            thumbnails.forEach((thumb) => {
              thumbnailMap[thumb.url] = thumb.thumbnail;
            });
          }

          // Process each media URL
          const mediaInserts = [];
          for (const url of media) {
            const isVideo = isVideoUrl(url);
            const mediaType = isVideo ? "video" : "image";
            let thumbnailUrl = thumbnailMap[url] || null;

            // For videos without thumbnails, try to generate one
            if (isVideo && !thumbnailUrl) {
              try {
                // In a real implementation, you'd use a server-side video processing library
                // For now, we'll store the video URL and generate thumbnails client-side
                console.log(
                  `Video detected: ${url}, thumbnail generation would happen here`
                );
              } catch (error) {
                console.error(
                  "Error generating thumbnail for video:",
                  url,
                  error
                );
              }
            }

            mediaInserts.push({
              journal_id: newEntry.id,
              user_id: session.user.id,
              media_type: mediaType,
              media_url: url,
              thumbnail_url: thumbnailUrl,
              status: "approved",
            });
          }

          // Insert all media at once
          if (mediaInserts.length > 0) {
            await sql`
              INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
              SELECT * FROM ${sql(
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
        }

        // Fetch the complete entry with media
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

        if (!completeEntry) {
          console.error("Failed to fetch complete entry:", newEntry.id);
          return { error: "Failed to fetch complete entry", status: 500 };
        }

        return { data: completeEntry };
      }

      case "PUT": {
        if (!id) {
          return { error: "Missing entry ID", status: 400 };
        }

        // Check if entry exists and belongs to user
        const [existingEntry] = await sql`
          SELECT * FROM journal_entries 
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (!existingEntry) {
          return { error: "Entry not found", status: 404 };
        }

        // Update the journal entry
        await sql`
          UPDATE journal_entries 
          SET 
            title = COALESCE(${title}, title),
            content = COALESCE(${content}, content),
            visibility = COALESCE(${visibility}, visibility),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        // If there's new media, add it
        if (media && Array.isArray(media) && media.length > 0) {
          // Create a map of thumbnails for quick lookup
          const thumbnailMap = {};
          if (thumbnails && Array.isArray(thumbnails)) {
            thumbnails.forEach((thumb) => {
              thumbnailMap[thumb.url] = thumb.thumbnail;
            });
          }

          // Process each media URL
          const mediaInserts = [];
          for (const url of media) {
            const isVideo = isVideoUrl(url);
            const mediaType = isVideo ? "video" : "image";
            let thumbnailUrl = thumbnailMap[url] || null;

            mediaInserts.push({
              journal_id: id,
              user_id: session.user.id,
              media_type: mediaType,
              media_url: url,
              thumbnail_url: thumbnailUrl,
              status: "approved",
            });
          }

          // Insert all media at once
          if (mediaInserts.length > 0) {
            await sql`
              INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
              SELECT * FROM ${sql(
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
        }

        // Fetch the complete updated entry with media
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

        if (!updatedEntry) {
          console.error("Failed to fetch updated entry:", id);
          return { error: "Failed to fetch updated entry", status: 500 };
        }

        return { data: updatedEntry };
      }

      case "DELETE": {
        if (!id) {
          return { error: "Missing entry ID", status: 400 };
        }

        await sql`
          DELETE FROM journal_entries 
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        return { data: { message: "Entry deleted successfully" } };
      }

      case "COMMENT": {
        if (!id || !comment_content) {
          return { error: "Missing required fields", status: 400 };
        }

        const [newComment] = await sql`
          INSERT INTO journal_comments (journal_id, user_id, content)
          VALUES (${id}, ${session.user.id}, ${comment_content})
          RETURNING *
        `;

        return { data: newComment };
      }

      case "ADD_REQUEST": {
        if (!id || !request_content) {
          return { error: "Missing required fields", status: 400 };
        }

        // Check if entry exists and is public/semi-public
        const [entry] = await sql`
          SELECT * FROM journal_entries 
          WHERE id = ${id} 
          AND visibility IN ('public', 'semi-public')
        `;

        if (!entry) {
          return { error: "Entry not found or not public", status: 404 };
        }

        // Check if user already has a pending request
        const [existingRequest] = await sql`
          SELECT * FROM journal_add_requests
          WHERE journal_id = ${id}
          AND requester_id = ${session.user.id}
          AND status = 'pending'
        `;

        if (existingRequest) {
          return { error: "You already have a pending request", status: 400 };
        }

        // Create the add request
        const [newRequest] = await sql`
          INSERT INTO journal_add_requests 
            (journal_id, requester_id, content, media)
          VALUES 
            (${id}, ${session.user.id}, ${request_content}, ${media || null})
          RETURNING *
        `;

        return { data: newRequest };
      }

      case "GET_ADD_REQUESTS": {
        if (!id) {
          return { error: "Missing entry ID", status: 400 };
        }

        // Check if user owns the entry
        const [entry] = await sql`
          SELECT * FROM journal_entries 
          WHERE id = ${id} AND user_id = ${session.user.id}
        `;

        if (!entry) {
          return { error: "Entry not found", status: 404 };
        }

        // Get all requests with requester information
        const requests = await sql`
          SELECT 
            jar.*,
            au.name as requester_name,
            au.image as requester_image
          FROM journal_add_requests jar
          JOIN auth_users au ON jar.requester_id = au.id
          WHERE jar.journal_id = ${id}
          ORDER BY jar.created_at DESC
        `;

        return { data: requests };
      }

      case "UPDATE_ADD_REQUEST": {
        if (!request_id || !request_status) {
          return { error: "Missing required fields", status: 400 };
        }

        // First verify the request exists and get the journal entry owner
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
          return { error: "Request not found", status: 404 };
        }

        // Check if the current user owns the journal entry
        if (request.entry_owner_id !== session.user.id) {
          return { error: "Unauthorized to update this request", status: 403 };
        }

        // Update request status
        await sql`
          UPDATE journal_add_requests
          SET 
            status = ${request_status},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${request_id}
          RETURNING *
        `;

        // If approved, add any media
        if (
          request_status === "approved" &&
          request.media &&
          Array.isArray(request.media) &&
          request.media.length > 0
        ) {
          // Process each media URL with thumbnail support
          const mediaInserts = [];
          for (const url of request.media) {
            const isVideo = isVideoUrl(url);
            const mediaType = isVideo ? "video" : "image";

            mediaInserts.push({
              journal_id: request.journal_id,
              user_id: request.requester_id,
              media_type: mediaType,
              media_url: url,
              thumbnail_url: null, // Could be enhanced to generate thumbnails for approved requests
              status: "approved",
            });
          }

          if (mediaInserts.length > 0) {
            await sql`
              INSERT INTO journal_media (journal_id, user_id, media_type, media_url, thumbnail_url, status)
              SELECT * FROM ${sql(
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
        }

        // Fetch the complete updated entry with media and requests
        const [updatedEntry] = await sql`
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
                ) FILTER (WHERE jm.id IS NOT NULL AND jm.status = 'approved'),
                '[]'::json
              ) as media,
              je.user_id as owner_id
            FROM journal_entries je
            LEFT JOIN journal_media jm ON je.id = jm.journal_id
            WHERE je.id = ${request.journal_id}
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
            WHERE jar.journal_id = ${request.journal_id}
            GROUP BY jar.journal_id
          )
          SELECT 
            e.*,
            e.owner_id as user_id,
            COALESCE(r.add_requests, '[]'::json) as add_requests
          FROM entry_data e
          LEFT JOIN request_data r ON e.id = r.journal_id
        `;

        return { data: updatedEntry };
      }

      default:
        return { error: "Method not allowed", status: 405 };
    }
  } catch (error) {
    console.error("Journal handler error:", error);
    if (error.code === "429") {
      return {
        error: "Too many requests. Please try again in a moment.",
        status: 429,
      };
    }
    return { error: error.message || "Internal server error", status: 500 };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
async function handler({
  action,
  albumId,
  videoId,
  title,
  description,
  visibility,
  videoUrl,
  caption,
  labels,
  commentId,
  content,
  requestId,
  status,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  const userId = session.user.id;

  switch (action) {
    case "createAlbum": {
      const result = await sql`
        INSERT INTO video_albums (user_id, title, description, visibility)
        VALUES (${userId}, ${title}, ${description}, ${visibility})
        RETURNING id, title, description, visibility, created_at
      `;
      return { album: result[0] };
    }

    case "getAlbums": {
      const albums = await sql`
        SELECT * FROM video_albums 
        WHERE user_id = ${userId} 
        ORDER BY created_at DESC
      `;

      // Fetch videos for each album
      const albumsWithVideos = await Promise.all(
        albums.map(async (album) => {
          const videos = await sql`
            SELECT * FROM videos 
            WHERE album_id = ${album.id} 
            ORDER BY created_at DESC
          `;
          return {
            ...album,
            videos: videos,
          };
        })
      );

      return { albums: albumsWithVideos };
    }

    case "addVideo": {
      const result = await sql`
        INSERT INTO videos (album_id, user_id, video_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${videoUrl}, ${caption}, ${labels})
        RETURNING id, video_url, caption, labels, created_at
      `;
      return { video: result[0] };
    }

    case "getVideos": {
      const videos = await sql`
        SELECT v.*, va.visibility 
        FROM videos v
        JOIN video_albums va ON v.album_id = va.id
        WHERE v.album_id = ${albumId}
        ORDER BY v.created_at DESC
      `;
      return { videos };
    }

    case "addComment": {
      // Check if user owns the album to auto-approve their comments
      const albumOwnership = await sql`
        SELECT va.user_id 
        FROM video_albums va
        JOIN videos v ON v.album_id = va.id
        WHERE v.id = ${videoId}
      `;

      const isOwner = albumOwnership[0]?.user_id === userId;
      const status = isOwner ? "approved" : "pending";

      const result = await sql`
        INSERT INTO video_comments (video_id, user_id, content, status)
        VALUES (${videoId}, ${userId}, ${content}, ${status})
        RETURNING id, content, status, created_at
      `;

      // Get user information to return complete comment data
      const user = await sql`
        SELECT name, image FROM auth_users WHERE id = ${userId}
      `;

      return {
        comment: {
          ...result[0],
          user_name: user[0]?.name,
          user_image: user[0]?.image,
        },
      };
    }

    case "getComments": {
      // Check if user owns the album to see pending comments
      const albumOwnership = await sql`
        SELECT va.user_id 
        FROM video_albums va
        JOIN videos v ON v.album_id = va.id
        WHERE v.id = ${videoId}
      `;

      const isOwner = albumOwnership[0]?.user_id === userId;

      let comments;
      if (isOwner) {
        // Album owner sees all comments (pending and approved)
        comments = await sql`
          SELECT vc.*, au.name as user_name, au.image as user_image
          FROM video_comments vc
          JOIN auth_users au ON vc.user_id = au.id
          WHERE vc.video_id = ${videoId}
          ORDER BY vc.created_at DESC
        `;
      } else {
        // Other users only see approved comments and their own pending comments
        comments = await sql`
          SELECT vc.*, au.name as user_name, au.image as user_image
          FROM video_comments vc
          JOIN auth_users au ON vc.user_id = au.id
          WHERE vc.video_id = ${videoId} 
          AND (vc.status = 'approved' OR vc.user_id = ${userId})
          ORDER BY vc.created_at DESC
        `;
      }

      return { comments, isOwner };
    }

    case "approveComment": {
      // Only album owner can approve comments
      const result = await sql`
        UPDATE video_comments 
        SET status = 'approved'
        WHERE id = ${commentId}
        AND video_id IN (
          SELECT v.id FROM videos v
          JOIN video_albums va ON v.album_id = va.id
          WHERE va.user_id = ${userId}
        )
        RETURNING id, status
      `;

      if (!result[0]) {
        return { error: "Unauthorized or comment not found" };
      }

      return { updated: result[0] };
    }

    case "declineComment": {
      // Only album owner can decline comments
      const result = await sql`
        UPDATE video_comments 
        SET status = 'declined'
        WHERE id = ${commentId}
        AND video_id IN (
          SELECT v.id FROM videos v
          JOIN video_albums va ON v.album_id = va.id
          WHERE va.user_id = ${userId}
        )
        RETURNING id, status
      `;

      if (!result[0]) {
        return { error: "Unauthorized or comment not found" };
      }

      return { updated: result[0] };
    }

    case "createAddRequest": {
      const result = await sql`
        INSERT INTO video_add_requests (album_id, requester_id, video_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${videoUrl}, ${caption}, ${labels})
        RETURNING id, video_url, caption, labels, status, created_at
      `;
      return { request: result[0] };
    }

    case "getAddRequests": {
      const requests = await sql`
        SELECT var.*, au.name as requester_name
        FROM video_add_requests var
        JOIN auth_users au ON var.requester_id = au.id
        WHERE var.album_id = ${albumId}
        ORDER BY var.created_at DESC
      `;
      return { requests };
    }

    case "updateRequestStatus": {
      const result = await sql`
        UPDATE video_add_requests
        SET status = ${status}
        WHERE id = ${requestId} AND album_id IN (
          SELECT id FROM video_albums WHERE user_id = ${userId}
        )
        RETURNING id, status
      `;

      if (status === "approved" && result[0]) {
        const request = await sql`
          SELECT * FROM video_add_requests WHERE id = ${requestId}
        `;
        if (request[0]) {
          await sql`
            INSERT INTO videos (album_id, user_id, video_url, caption, labels)
            VALUES (${request[0].album_id}, ${request[0].requester_id}, ${request[0].video_url}, ${request[0].caption}, ${request[0].labels})
          `;
        }
      }

      return { updated: result[0] };
    }

    case "deleteVideo": {
      const result = await sql`
        DELETE FROM videos
        WHERE id = ${videoId} AND user_id = ${userId}
        RETURNING id
      `;
      return { deleted: result[0] };
    }

    case "deleteAlbum": {
      const result = await sql`
        DELETE FROM video_albums
        WHERE id = ${albumId} AND user_id = ${userId}
        RETURNING id
      `;
      return { deleted: result[0] };
    }

    default:
      return { error: "Invalid action" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
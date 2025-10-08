async function handler({
  operation,
  albumId,
  photoId,
  imageUrl,
  commentId,
  comment,
  status,
  title,
  description,
  visibility,
  caption,
  labels,
  content,
  requestId,
}) {
  const session = getSession();
  if (!session?.user?.id) {
    return { error: "Authentication required" };
  }

  const userId = session.user.id;

  // If no operation is specified, default to listing albums
  if (!operation) {
    try {
      const albums = await sql`
        SELECT pa.*, 
          (SELECT json_agg(p.*) 
           FROM photos p 
           WHERE p.album_id = pa.id) as photos
        FROM photo_albums pa 
        WHERE pa.user_id = ${userId}
        ORDER BY pa.created_at DESC
      `;

      // Ensure photos is an array even if null
      return {
        albums: albums.map((album) => ({
          ...album,
          photos: album.photos || [],
        })),
      };
    } catch (err) {
      console.error("Error fetching albums:", err);
      return { error: "Failed to fetch albums" };
    }
  }

  switch (operation) {
    case "createAlbum": {
      if (!title) {
        return { error: "Album title is required" };
      }
      const [album] = await sql`
        INSERT INTO photo_albums (user_id, title, description, visibility)
        VALUES (${userId}, ${title}, ${description || ""}, ${
        visibility || "private"
      })
        RETURNING *`;
      return { album };
    }

    case "getAlbum": {
      const [album] = await sql`
        SELECT * FROM photo_albums WHERE id = ${albumId} AND 
        (user_id = ${userId} OR visibility = 'public' OR 
        (visibility = 'semi-public' AND EXISTS(
          SELECT 1 FROM user_connections 
          WHERE (user_id = ${userId} AND connected_user_id = photo_albums.user_id) 
          OR (connected_user_id = ${userId} AND user_id = photo_albums.user_id)
          AND status = 'accepted'
        )))`;

      if (!album) return { error: "Album not found" };

      const photos = await sql`
        SELECT * FROM photos WHERE album_id = ${albumId}`;
      return { album, photos };
    }

    case "updateAlbum": {
      const [album] = await sql`
        UPDATE photo_albums 
        SET title = ${title}, description = ${description}, visibility = ${visibility}
        WHERE id = ${albumId} AND user_id = ${userId}
        RETURNING *`;
      return { album };
    }

    case "deleteAlbum": {
      await sql`DELETE FROM photo_albums WHERE id = ${albumId} AND user_id = ${userId}`;
      return { success: true };
    }

    case "addPhoto": {
      if (!albumId || !imageUrl) {
        return { error: "Album ID and image URL are required" };
      }

      // Verify the album belongs to the user
      const [album] = await sql`
        SELECT id FROM photo_albums WHERE id = ${albumId} AND user_id = ${userId}
      `;

      if (!album) {
        return { error: "Album not found or access denied" };
      }

      const [photo] = await sql`
        INSERT INTO photos (album_id, user_id, image_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${imageUrl}, ${caption || ""}, ${
        labels || Array()
      })
        RETURNING *`;
      return { photo };
    }

    case "updatePhoto": {
      const [photo] = await sql`
        UPDATE photos 
        SET caption = ${caption}, labels = ${labels}
        WHERE id = ${photoId} AND user_id = ${userId}
        RETURNING *`;
      return { photo };
    }

    case "deletePhoto": {
      await sql`DELETE FROM photos WHERE id = ${photoId} AND user_id = ${userId}`;
      return { success: true };
    }

    case "addComment": {
      if (!photoId || !comment) {
        return { error: "Photo ID and comment are required" };
      }

      // Check if user owns the album to auto-approve their comments
      const albumOwnership = await sql`
        SELECT pa.user_id 
        FROM photo_albums pa
        JOIN photos p ON p.album_id = pa.id
        WHERE p.id = ${photoId}
      `;

      if (!albumOwnership[0]) {
        return { error: "Photo not found" };
      }

      const isOwner = albumOwnership[0]?.user_id === userId;
      const status = isOwner ? "approved" : "pending";

      const [newComment] = await sql`
        INSERT INTO photo_comments (photo_id, user_id, content, status)
        VALUES (${photoId}, ${userId}, ${comment}, ${status})
        RETURNING id, content, status, created_at
      `;

      // Get user information to return complete comment data
      const user = await sql`
        SELECT name, image FROM auth_users WHERE id = ${userId}
      `;

      return {
        comment: {
          ...newComment,
          user_name: user[0]?.name,
          user_image: user[0]?.image,
        },
      };
    }

    case "updateCommentStatus": {
      if (!commentId || !status || !["approved", "declined"].includes(status)) {
        return { error: "Invalid comment status update request" };
      }

      // Verify the user owns the photo
      const [comment] = await sql`
        SELECT pc.*, p.album_id, pa.user_id as album_owner_id
        FROM photo_comments pc
        JOIN photos p ON pc.photo_id = p.id
        JOIN photo_albums pa ON p.album_id = pa.id
        WHERE pc.id = ${commentId}
      `;

      if (!comment) {
        return { error: "Comment not found" };
      }

      if (comment.album_owner_id !== userId) {
        return {
          error: "Only the album owner can approve or decline comments",
        };
      }

      const [updatedComment] = await sql`
        UPDATE photo_comments
        SET status = ${status}
        WHERE id = ${commentId}
        RETURNING *
      `;

      return { comment: updatedComment };
    }

    case "getComments": {
      if (!photoId) {
        return { error: "Photo ID is required" };
      }

      // Check if user owns the album to see pending comments
      const albumOwnership = await sql`
        SELECT pa.user_id 
        FROM photo_albums pa
        JOIN photos p ON p.album_id = pa.id
        WHERE p.id = ${photoId}
      `;

      const isOwner = albumOwnership[0]?.user_id === userId;

      let comments;
      if (isOwner) {
        // Album owner sees all comments (pending and approved)
        comments = await sql`
          SELECT pc.*, au.name as user_name, au.image as user_image
          FROM photo_comments pc
          JOIN auth_users au ON pc.user_id = au.id
          WHERE pc.photo_id = ${photoId}
          ORDER BY pc.created_at DESC
        `;
      } else {
        // Other users only see approved comments and their own pending comments
        comments = await sql`
          SELECT pc.*, au.name as user_name, au.image as user_image
          FROM photo_comments pc
          JOIN auth_users au ON pc.user_id = au.id
          WHERE pc.photo_id = ${photoId}
          AND (pc.status = 'approved' OR pc.user_id = ${userId})
          ORDER BY pc.created_at DESC
        `;
      }

      return { comments, isOwner };
    }

    case "addPhotoRequest": {
      const [request] = await sql`
        INSERT INTO photo_add_requests (album_id, requester_id, image_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${imageUrl}, ${caption || ""}, ${
        labels || Array()
      })
        RETURNING *`;
      return { request };
    }

    case "updateRequestStatus": {
      const [request] = await sql`
        UPDATE photo_add_requests
        SET status = ${status}
        WHERE id = ${requestId}
        RETURNING *`;
      return { request };
    }

    default:
      return { error: "Invalid operation" };
  }
}
export async function POST(request) {
  return handler(await request.json());
}
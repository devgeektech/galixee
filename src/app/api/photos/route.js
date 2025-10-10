import getSession from "@/utilities/getSession";
import sql from "@/db";
import { NextResponse } from "next/server";

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
  requestId,
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" });
  }

  const userId = session.user.id;

  // Default operation: list albums
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

      return NextResponse.json({
        albums: albums.map((album) => ({
          ...album,
          photos: album.photos || [],
        })),
      });
    } catch (err) {
      console.error("Error fetching albums:", err);
      return NextResponse.json({ error: "Failed to fetch albums" });
    }
  }

  switch (operation) {
    case "createAlbum": {
      if (!title) return NextResponse.json({ error: "Album title is required" });
      const [album] = await sql`
        INSERT INTO photo_albums (user_id, title, description, visibility)
        VALUES (${userId}, ${title}, ${description || ""}, ${visibility || "private"})
        RETURNING *`;
      return NextResponse.json({ album });
    }

    case "getAlbum": {
      const [album] = await sql`
        SELECT * FROM photo_albums 
        WHERE id = ${albumId} AND 
        (user_id = ${userId} OR visibility = 'public' OR 
        (visibility = 'semi-public' AND EXISTS(
          SELECT 1 FROM user_connections 
          WHERE ((user_id = ${userId} AND connected_user_id = photo_albums.user_id) 
                 OR (connected_user_id = ${userId} AND user_id = photo_albums.user_id))
          AND status = 'accepted'
        )))`;

      if (!album) return NextResponse.json({ error: "Album not found" });

      const photos = await sql`SELECT * FROM photos WHERE album_id = ${albumId}`;
      return NextResponse.json({ album, photos });
    }

    case "updateAlbum": {
      const [album] = await sql`
        UPDATE photo_albums 
        SET title = ${title}, description = ${description}, visibility = ${visibility}
        WHERE id = ${albumId} AND user_id = ${userId}
        RETURNING *`;
      return NextResponse.json({ album });
    }

    case "deleteAlbum": {
      await sql`DELETE FROM photo_albums WHERE id = ${albumId} AND user_id = ${userId}`;
      return NextResponse.json({ success: true });
    }

    case "addPhoto": {
      if (!albumId || !imageUrl) return NextResponse.json({ error: "Album ID and image URL are required" });

      const [album] = await sql`SELECT id FROM photo_albums WHERE id = ${albumId} AND user_id = ${userId}`;
      if (!album) return NextResponse.json({ error: "Album not found or access denied" });

      const [photo] = await sql`
        INSERT INTO photos (album_id, user_id, image_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${imageUrl}, ${caption || ""}, ${labels || []})
        RETURNING *`;
      return NextResponse.json({ photo });
    }

    case "updatePhoto": {
      const [photo] = await sql`
        UPDATE photos 
        SET caption = ${caption}, labels = ${labels}
        WHERE id = ${photoId} AND user_id = ${userId}
        RETURNING *`;
      return NextResponse.json({ photo });
    }

    case "deletePhoto": {
      await sql`DELETE FROM photos WHERE id = ${photoId} AND user_id = ${userId}`;
      return NextResponse.json({ success: true });
    }

    case "addComment": {
      if (!photoId || !comment) return NextResponse.json({ error: "Photo ID and comment are required" });

      const albumOwnership = await sql`
        SELECT pa.user_id 
        FROM photo_albums pa
        JOIN photos p ON p.album_id = pa.id
        WHERE p.id = ${photoId}
      `;
      if (!albumOwnership[0]) return NextResponse.json({ error: "Photo not found" });

      const isOwner = albumOwnership[0]?.user_id === userId;
      const commentStatus = isOwner ? "approved" : "pending";

      const [newComment] = await sql`
        INSERT INTO photo_comments (photo_id, user_id, content, status)
        VALUES (${photoId}, ${userId}, ${comment}, ${commentStatus})
        RETURNING id, content, status, created_at
      `;

      const user = await sql`SELECT name, image FROM auth_users WHERE id = ${userId}`;
      return NextResponse.json({
        comment: {
          ...newComment,
          user_name: user[0]?.name,
          user_image: user[0]?.image,
        },
      });
    }

    case "updateCommentStatus": {
      if (!commentId || !status || !["approved", "declined"].includes(status))
        return NextResponse.json({ error: "Invalid comment status update request" });

      const [comment] = await sql`
        SELECT pc.*, p.album_id, pa.user_id as album_owner_id
        FROM photo_comments pc
        JOIN photos p ON pc.photo_id = p.id
        JOIN photo_albums pa ON p.album_id = pa.id
        WHERE pc.id = ${commentId}
      `;
      if (!comment) return NextResponse.json({ error: "Comment not found" });
      if (comment.album_owner_id !== userId) return NextResponse.json({ error: "Only album owner can approve/decline comments" });

      const [updatedComment] = await sql`
        UPDATE photo_comments
        SET status = ${status}
        WHERE id = ${commentId}
        RETURNING *
      `;
      return NextResponse.json({ comment: updatedComment });
    }

    case "getComments": {
      if (!photoId) return NextResponse.json({ error: "Photo ID is required" });

      const albumOwnership = await sql`
        SELECT pa.user_id 
        FROM photo_albums pa
        JOIN photos p ON p.album_id = pa.id
        WHERE p.id = ${photoId}
      `;
      const isOwner = albumOwnership[0]?.user_id === userId;

      let comments;
      if (isOwner) {
        comments = await sql`
          SELECT pc.*, au.name as user_name, au.image as user_image
          FROM photo_comments pc
          JOIN auth_users au ON pc.user_id = au.id
          WHERE pc.photo_id = ${photoId}
          ORDER BY pc.created_at DESC
        `;
      } else {
        comments = await sql`
          SELECT pc.*, au.name as user_name, au.image as user_image
          FROM photo_comments pc
          JOIN auth_users au ON pc.user_id = au.id
          WHERE pc.photo_id = ${photoId} AND (pc.status = 'approved' OR pc.user_id = ${userId})
          ORDER BY pc.created_at DESC
        `;
      }
      return NextResponse.json({ comments, isOwner });
    }

    case "addPhotoRequest": {
      const [request] = await sql`
        INSERT INTO photo_add_requests (album_id, requester_id, image_url, caption, labels)
        VALUES (${albumId}, ${userId}, ${imageUrl}, ${caption || ""}, ${labels || []})
        RETURNING *`;
      return NextResponse.json({ request });
    }

    case "updateRequestStatus": {
      const [request] = await sql`
        UPDATE photo_add_requests
        SET status = ${status}
        WHERE id = ${requestId}
        RETURNING *`;
      return NextResponse.json({ request });
    }

    default:
      return NextResponse.json({ error: "Invalid operation" });
  }
}

// POST handler
export async function POST(request) {
  const body = await request.json();
  return handler(body);
}

// GET handler (for listing albums or default operation)
export async function GET(request) {
  return handler({});
}

"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const fileInputRef = useRef(null);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isAlbumOwner, setIsAlbumOwner] = useState(false);
  const { data: user } = useUser();

  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/photos-handler", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch albums");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        setAlbums(data.albums || []);
      } catch (err) {
        console.error("Error fetching albums:", err);
        setError("Failed to load albums. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  const fetchComments = async (photoId) => {
    try {
      setLoadingComments(true);
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "getComments",
          photoId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch comments");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setComments(data.comments || []);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments. Please try again later.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "createAlbum",
          title: newAlbumTitle,
          description: newAlbumDescription,
          visibility: "private", // Default to private
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create album");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Initialize the photos array for the new album
      const newAlbum = {
        ...data.album,
        photos: [],
      };

      setAlbums([newAlbum, ...albums]);
      setIsCreatingAlbum(false);
      setNewAlbumTitle("");
      setNewAlbumDescription("");
    } catch (err) {
      console.error("Error creating album:", err);
      setError("Failed to create album. Please try again.");
    }
  };

  const handleDeletePhoto = async (albumId, photoId) => {
    try {
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "deletePhoto",
          photoId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      setAlbums(
        albums.map((album) => {
          if (album.id === albumId) {
            return {
              ...album,
              photos: album.photos.filter((photo) => photo.id !== photoId),
            };
          }
          return album;
        })
      );
    } catch (err) {
      console.error("Error deleting photo:", err);
      setError("Failed to delete photo. Please try again.");
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this album? This will also delete all photos in the album. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "deleteAlbum",
          albumId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Remove the album from the local state
      setAlbums(albums.filter((album) => album.id !== albumId));
    } catch (err) {
      console.error("Error deleting album:", err);
      setError("Failed to delete album. Please try again.");
    }
  };

  const handleFileSelect = async (albumId, files) => {
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploadingPhoto(albumId);

    try {
      const newPhotos = [];

      // Upload each file sequentially
      for (const file of files) {
        try {
          console.log("Attempting upload for file:", file.name);

          // Call upload and handle the result very carefully
          let uploadResult;
          try {
            uploadResult = await upload({ file });
            console.log("Raw upload result:", uploadResult);
          } catch (uploadError) {
            console.error("Upload threw an error:", uploadError);
            throw new Error(`Upload failed: ${uploadError.message}`);
          }

          // Check if we got a result at all
          if (!uploadResult) {
            console.error("Upload returned null/undefined");
            throw new Error("Upload failed - no result returned");
          }

          // Check for errors in the result
          if (uploadResult.error) {
            console.error("Upload returned error:", uploadResult.error);
            throw new Error(`Upload failed: ${uploadResult.error}`);
          }

          // Get the URL
          const url = uploadResult.url;
          if (!url) {
            console.error("Upload result missing URL:", uploadResult);
            throw new Error("Upload failed - no URL returned");
          }

          console.log("Upload successful, URL:", url);

          // Save the photo in the database
          console.log("Attempting to save photo to database...");
          const response = await fetch("/api/photos-handler", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: "addPhoto",
              albumId,
              imageUrl: url,
            }),
          });

          console.log("Database response status:", response.status);
          console.log("Database response ok:", response.ok);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("Database response error text:", errorText);
            throw new Error("Failed to save photo");
          }

          let data;
          try {
            const responseText = await response.text();
            console.log("Raw database response text:", responseText);

            if (!responseText) {
              throw new Error("Empty response from database");
            }

            data = JSON.parse(responseText);
            console.log("Parsed database response:", data);
          } catch (parseError) {
            console.error("Failed to parse database response:", parseError);
            throw new Error("Invalid response from database");
          }

          if (data && data.error) {
            throw new Error(data.error);
          }

          if (!data || !data.photo) {
            throw new Error("Database did not return photo data");
          }

          newPhotos.push(data.photo);
          console.log("Photo saved successfully:", data.photo);
        } catch (fileError) {
          console.error("Error processing file:", file.name, fileError);
          throw fileError; // Re-throw to be caught by outer catch
        }
      }

      // Update the local state with all new photos at once
      setAlbums(
        albums.map((album) => {
          if (album.id === albumId) {
            return {
              ...album,
              photos: [...(album.photos || []), ...newPhotos],
            };
          }
          return album;
        })
      );

      console.log("All photos uploaded and saved successfully");
    } catch (err) {
      console.error("Error uploading photo:", err);
      setError(`Failed to upload photo: ${err.message || "Unknown error"}`);
    } finally {
      setIsUploadingPhoto(null);
    }
  };

  const toggleAlbum = (albumId) => {
    setExpandedAlbumId(expandedAlbumId === albumId ? null : albumId);
  };

  const handlePhotoClick = async (photo, e) => {
    e.stopPropagation();
    setSelectedPhoto(photo);
    await fetchComments(photo.id);
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "addComment",
          photoId: selectedPhoto.id,
          comment: newComment.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add comment");
      }

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      if (data && data.error) {
        throw new Error(data.error);
      }

      if (!data || !data.comment) {
        throw new Error("Server did not return comment data");
      }

      // Add the new comment to the list
      setComments([data.comment, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err.message || "Failed to add comment. Please try again.");
    }
  };

  const handleCommentStatus = async (commentId, status) => {
    try {
      const response = await fetch("/api/photos-handler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "updateCommentStatus",
          commentId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update comment status");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update the comment in the list
      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, status } : comment
        )
      );
    } catch (err) {
      console.error("Error updating comment status:", err);
      setError("Failed to update comment status. Please try again.");
    }
  };

  const closePhotoModal = () => {
    setSelectedPhoto(null);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-6">
          <a
            href="/welcome"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Back to Welcome
          </a>
          <a
            href="/account/logout"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Sign Out
          </a>
        </div>
      </nav>

      <main className="pt-24 px-6 pb-16 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Photo Albums
          </h1>
          <button
            onClick={() => setIsCreatingAlbum(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>New Album</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {isCreatingAlbum && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl">
              <h3 className="text-xl font-bold mb-4 text-white">
                Create New Album
              </h3>
              <form onSubmit={handleCreateAlbum} className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={newAlbumTitle}
                    onChange={(e) => setNewAlbumTitle(e.target.value)}
                    placeholder="Album Title"
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <textarea
                    value={newAlbumDescription}
                    onChange={(e) => setNewAlbumDescription(e.target.value)}
                    placeholder="Album Description"
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsCreatingAlbum(false)}
                    className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
                  >
                    Create Album
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6366F1]"></div>
          </div>
        ) : !albums || albums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <i className="fas fa-images text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-400 text-lg">No photo albums yet.</p>
            <p className="text-gray-500 mt-2">
              Create your first album to start organizing your memories!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {albums.map((album) =>
              album && album.id ? (
                <div
                  key={album.id}
                  className="bg-[#1A1A1A] border border-[#333333] hover:border-[#6366F1]/50 rounded-xl p-6 transition-all duration-300"
                >
                  <div
                    className="flex justify-between items-start mb-4 cursor-pointer"
                    onClick={() => toggleAlbum(album.id)}
                  >
                    <div className="flex items-center">
                      <i
                        className={`fas fa-chevron-right mr-3 transition-transform duration-200 ${
                          expandedAlbumId === album.id ? "rotate-90" : ""
                        }`}
                      ></i>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">
                          {album.title || "Untitled Album"}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {album.photos?.length || 0} photos
                        </p>
                      </div>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) =>
                        handleFileSelect(album.id, e.target.files)
                      }
                      ref={fileInputRef}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        disabled={
                          isUploadingPhoto === album.id || uploadLoading
                        }
                        className={`flex items-center space-x-2 px-3 py-1.5 ${
                          isUploadingPhoto === album.id || uploadLoading
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-[#6366F1] hover:bg-[#4F46E5]"
                        } rounded-lg text-white text-sm transition-colors`}
                      >
                        {isUploadingPhoto === album.id || uploadLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload"></i>
                            <span>Upload</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.id);
                        }}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
                        title="Delete Album"
                      >
                        <i className="fas fa-trash"></i>
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>

                  {album.description && (
                    <p className="text-gray-300 mb-4 line-clamp-2 pl-7">
                      {album.description}
                    </p>
                  )}

                  {expandedAlbumId === album.id && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                      {(album.photos || []).map((photo) =>
                        photo && photo.id ? (
                          <div
                            key={photo.id}
                            className="relative aspect-square group cursor-pointer"
                            onClick={(e) => handlePhotoClick(photo, e)}
                          >
                            <img
                              src={photo.image_url || photo.url}
                              alt={photo.caption || "Album photo"}
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePhoto(album.id, photo.id);
                                }}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 rounded-full w-8 h-8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <i className="fas fa-trash text-white text-sm"></i>
                              </button>
                              <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <i className="fas fa-expand text-white text-sm mr-2"></i>
                                <span className="text-white text-sm">
                                  Click to expand
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>
              ) : null
            )}
          </div>
        )}
      </main>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closePhotoModal}
        >
          <div
            className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side - Photo */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={selectedPhoto.image_url || selectedPhoto.url}
                alt={selectedPhoto.caption || "Expanded photo"}
                className="max-h-[85vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Right side - Comments */}
            <div className="w-96 bg-[#1A1A1A] h-[85vh] rounded-lg p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Comments</h3>
                <button
                  onClick={closePhotoModal}
                  className="bg-black/50 hover:bg-black/75 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-white"></i>
                </button>
              </div>

              {/* Comments list */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {loadingComments ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#6366F1]"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-4">
                    No comments yet
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className={`bg-[#242424] rounded-lg p-3 ${
                        comment.status === "pending"
                          ? "border border-yellow-500/50"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {comment.user_image ? (
                          <img
                            src={comment.user_image}
                            alt={comment.user_name}
                            className="w-6 h-6 rounded-full"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-[#6366F1] flex items-center justify-center">
                            <span className="text-xs text-white">
                              {comment.user_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="text-sm text-white font-medium">
                          {comment.user_name}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{comment.content}</p>

                      {/* Show approval buttons for pending comments to album owner */}
                      {comment.status === "pending" &&
                        selectedPhoto.user_id === user?.id && (
                          <div className="flex gap-2 mt-2">
                            <button
                              onClick={() =>
                                handleCommentStatus(comment.id, "approved")
                              }
                              className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() =>
                                handleCommentStatus(comment.id, "declined")
                              }
                              className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        )}
                    </div>
                  ))
                )}
              </div>

              {/* Comment input */}
              <form onSubmit={handleAddComment} className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-[#242424] border border-[#333333] rounded-lg px-3 py-2 text-white text-sm"
                  />
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
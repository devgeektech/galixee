"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isAddingAlbum, setIsAddingAlbum] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [error, setError] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDescription, setNewAlbumDescription] = useState("");
  const [expandedAlbumId, setExpandedAlbumId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loadingComments, setLoadingComments] = useState(false);
  const [isAlbumOwner, setIsAlbumOwner] = useState(false);

  // Add constants for upload limits
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
  const ACCEPTED_VIDEO_TYPES = [
    "video/mp4",
    "video/quicktime",
    "video/x-m4v",
    "video/webm",
    "video/ogg",
  ];

  const features = [
    {
      title: "End of Life Planning",
      icon: "fa-scroll",
      description: "Plan for the future",
      href: user
        ? "/end-of-life-planning"
        : "/account/signin?callbackUrl=/end-of-life-planning",
    },
    {
      title: "Video Albums",
      icon: "fa-folder",
      description: "Organize your videos",
      href: "/videos",
    },
    {
      title: "Upload Videos",
      icon: "fa-upload",
      description: "Upload your videos",
      href: "/videos/upload",
    },
    {
      title: "Comments",
      icon: "fa-comment",
      description: "Add comments to videos",
      href: "/videos/comments",
    },
    {
      title: "Search",
      icon: "fa-search",
      description: "Search for videos",
      href: "/videos/search",
    },
    {
      title: "Settings",
      icon: "fa-cog",
      description: "Manage your account",
      href: "/account/settings",
    },
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchAlbums();
  }, [user, userLoading]);

  const fetchAlbums = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getAlbums" }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch albums: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      if (data && data.error) {
        throw new Error(data.error);
      }

      // Ensure we have an array of albums, even if empty
      setAlbums(data?.albums || []);
    } catch (err) {
      console.error("Error fetching albums:", err);
      setError("Failed to load video albums. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAlbum",
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

      // Initialize the videos array for the new album
      const newAlbum = {
        ...data.album,
        videos: [],
      };

      setAlbums([newAlbum, ...albums]);
      setIsAddingAlbum(false);
      setNewAlbumTitle("");
      setNewAlbumDescription("");
    } catch (err) {
      console.error("Error creating album:", err);
      setError("Failed to create album. Please try again.");
    }
  };

  const handleVideoUpload = async (albumId, files) => {
    if (!files || files.length === 0) return;

    setError(null);
    setIsUploadingVideo(albumId);

    try {
      const newVideos = [];
      // Upload each file sequentially
      for (const file of files) {
        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(
            `Video "${file.name}" is too large. Maximum size is 25MB.`
          );
        }

        // Validate file type
        if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
          throw new Error(
            `Invalid file type for "${file.name}". Please upload MP4, MOV, M4V, WebM, or OGG videos.`
          );
        }

        // Upload the file and get the URL
        const { url, error: uploadError } = await upload({ file });
        if (uploadError) {
          throw new Error(uploadError);
        }

        // Save the video in the database
        const response = await fetch("/api/videos-handler", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "addVideo",
            albumId,
            videoUrl: url,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save video");
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }

        newVideos.push(data.video);
      }

      // Update the local state with all new videos at once
      setAlbums(
        albums.map((album) => {
          if (album.id === albumId) {
            return {
              ...album,
              videos: [...(album.videos || []), ...newVideos],
            };
          }
          return album;
        })
      );
    } catch (err) {
      console.error("Error uploading video:", err);
      setError(err.message || "Failed to upload video. Please try again.");
    } finally {
      setIsUploadingVideo(null);
    }
  };

  const handleDeleteVideo = async (albumId, videoId) => {
    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteVideo",
          videoId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete video");
      }

      setAlbums(
        albums.map((album) => {
          if (album.id === albumId) {
            return {
              ...album,
              videos: album.videos.filter((video) => video.id !== videoId),
            };
          }
          return album;
        })
      );
    } catch (err) {
      console.error("Error deleting video:", err);
      setError("Failed to delete video. Please try again.");
    }
  };

  const handleDeleteAlbum = async (albumId) => {
    if (
      !confirm(
        "Are you sure you want to delete this album? This will also delete all videos in the album."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteAlbum",
          albumId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete album");
      }

      setAlbums(albums.filter((album) => album.id !== albumId));
    } catch (err) {
      console.error("Error deleting album:", err);
      setError("Failed to delete album. Please try again.");
    }
  };

  const toggleAlbum = (albumId) => {
    setExpandedAlbumId(expandedAlbumId === albumId ? null : albumId);
  };

  const handleVideoClick = async (video, e) => {
    e.stopPropagation();
    setSelectedVideo(video);
    await fetchComments(video.id);
  };

  const fetchComments = async (videoId) => {
    try {
      setLoadingComments(true);
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getComments",
          videoId,
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
      setIsAlbumOwner(data.isOwner || false);
    } catch (err) {
      console.error("Error fetching comments:", err);
      setError("Failed to load comments. Please try again later.");
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addComment",
          videoId: selectedVideo.id,
          content: newComment.trim(),
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

      setComments([data.comment, ...comments]);
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setError(err.message || "Failed to add comment. Please try again.");
    }
  };

  const handleApproveComment = async (commentId) => {
    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approveComment",
          commentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve comment");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update comment status in local state
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, status: "approved" }
            : comment
        )
      );
    } catch (err) {
      console.error("Error approving comment:", err);
      setError("Failed to approve comment. Please try again.");
    }
  };

  const handleDeclineComment = async (commentId) => {
    try {
      const response = await fetch("/api/videos-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "declineComment",
          commentId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to decline comment");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // Update comment status in local state
      setComments(
        comments.map((comment) =>
          comment.id === commentId
            ? { ...comment, status: "declined" }
            : comment
        )
      );
    } catch (err) {
      console.error("Error declining comment:", err);
      setError("Failed to decline comment. Please try again.");
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
    setComments([]);
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
            Video Albums
          </h1>
          <button
            onClick={() => setIsAddingAlbum(true)}
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

        {isAddingAlbum && (
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
                    onClick={() => setIsAddingAlbum(false)}
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
            <i className="fas fa-video text-4xl text-gray-500 mb-4"></i>
            <p className="text-gray-400 text-lg">No video albums yet.</p>
            <p className="text-gray-500 mt-2">
              Create your first album to start organizing your videos!
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
                          {album.videos?.length || 0} videos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="file"
                        accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/ogg"
                        multiple
                        className="hidden"
                        onChange={(e) =>
                          handleVideoUpload(album.id, e.target.files)
                        }
                        id={`video-upload-${album.id}`}
                      />
                      <label
                        htmlFor={`video-upload-${album.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className={`flex items-center space-x-2 px-3 py-1.5 ${
                          isUploadingVideo === album.id
                            ? "bg-gray-600 cursor-not-allowed"
                            : "bg-[#6366F1] hover:bg-[#4F46E5] cursor-pointer"
                        } rounded-lg text-white text-sm transition-colors relative group`}
                      >
                        {isUploadingVideo === album.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-upload"></i>
                            <span>Upload</span>
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-black/75 text-xs text-white rounded-lg opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity">
                              Max size: 100MB
                              <br />
                              Formats: MP4, MOV, M4V, WebM, OGG
                            </div>
                          </>
                        )}
                      </label>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteAlbum(album.id);
                        }}
                        className="flex items-center justify-center w-8 h-8 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm transition-colors"
                        title="Delete Album"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {album.description && (
                    <p className="text-gray-300 mb-4 line-clamp-2 pl-7">
                      {album.description}
                    </p>
                  )}

                  {expandedAlbumId === album.id && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {(album.videos || []).map((video) =>
                        video && video.id ? (
                          <div
                            key={video.id}
                            className="relative aspect-video cursor-pointer"
                            onClick={(e) => handleVideoClick(video, e)}
                          >
                            <video
                              src={video.video_url}
                              className="w-full h-full rounded-lg"
                              controls
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteVideo(album.id, video.id);
                                }}
                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/75 rounded-full w-8 h-8 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <i className="fas fa-trash text-white text-sm"></i>
                              </button>
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

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={closeVideoModal}
        >
          <div
            className="relative max-w-7xl w-full max-h-[90vh] flex items-center justify-center gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side - Video */}
            <div className="flex-1 flex items-center justify-center">
              <video
                src={selectedVideo.video_url}
                controls
                className="max-h-[85vh] max-w-full rounded-lg"
              />
            </div>

            {/* Right side - Comments */}
            <div className="w-96 bg-[#1A1A1A] h-[85vh] rounded-lg p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">Comments</h3>
                <button
                  onClick={closeVideoModal}
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
                      className="bg-[#242424] rounded-lg p-3"
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
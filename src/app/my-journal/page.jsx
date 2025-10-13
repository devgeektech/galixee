"use client";
import React, { useState, useEffect } from "react";
import useUser from "@/components/use-user";
import { useUpload } from "@/utilities/runtime-helpers";
function MainComponent() {
  const { data: user, loading: userLoading } = useUser();

  // Add debug logging
  useEffect(() => {
    console.log("User loading:", userLoading);
    console.log("User data:", user);
  }, [user, userLoading]);

  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [showAddRequest, setShowAddRequest] = useState(false);
  const [selectedEntryForAdd, setSelectedEntryForAdd] = useState(null);
  const [showRequests, setShowRequests] = useState(false);
  const [addRequests, setAddRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchEntries();
  }, [user, userLoading]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });

      if (response.status === 429) {
        setError("Too many requests. Please wait a moment and try again.");
        return;
      }

      if (!response.ok) throw new Error("Failed to fetch entries");

      const result = await response.json();
      const validEntries = (result.data || []).filter(
        (entry) => entry && entry.id
      );
      setEntries(validEntries);
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError(err.message || "Could not load journal entries");
    } finally {
      setLoading(false);
    }
  };

  // Add retry logic for rate limited requests
  useEffect(() => {
    if (error === "Too many requests. Please wait a moment and try again.") {
      const timer = setTimeout(() => {
        fetchEntries();
      }, 5000); // Retry after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [error]);

  const JournalForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
      title: initialData?.title || "",
      content: initialData?.content || "",
      visibility: initialData?.visibility || "private",
      media: [],
    });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [uploadError, setUploadError] = useState(null);
    const [isUploading, setIsUploading] = useState(false);

    // Add constants for upload limits
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit
    const ACCEPTED_VIDEO_TYPES = [
      "video/mp4",
      "video/quicktime",
      "video/x-m4v",
      "video/webm",
      "video/ogg",
    ];
    const ACCEPTED_IMAGE_TYPES = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    useEffect(() => {
      if (initialData?.media) {
        setFormData((prev) => ({
          ...prev,
          media: initialData.media.map((m) => m.media_url || m),
        }));
      }
    }, [initialData]);

    const validateFile = (file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(
          `File "${file.name}" is too large. Maximum size is 100MB.`
        );
      }

      // Check file type
      const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
      const isImage = ACCEPTED_IMAGE_TYPES.includes(file.type);

      if (!isVideo && !isImage) {
        throw new Error(
          `Invalid file type for "${file.name}". Please upload images (JPEG, PNG, GIF, WebP) or videos (MP4, MOV, M4V, WebM, OGG).`
        );
      }

      return { isVideo, isImage };
    };

    const handleFileSelect = (e) => {
      const files = Array.from(e.target.files);
      setUploadError(null);

      try {
        // Validate all files first
        files.forEach((file) => validateFile(file));
        setMediaFiles(files);
      } catch (error) {
        setUploadError(error.message);
        e.target.value = ""; // Clear the file input
      }
    };

    // Helper function to generate video thumbnail
    const generateVideoThumbnail = (videoFile) => {
      return new Promise((resolve, reject) => {
        const video = document.createElement("video");
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

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
            console.error("Error generating thumbnail:", error);
            resolve(null);
          }
        };

        video.onerror = () => {
          console.error("Error loading video for thumbnail generation");
          resolve(null);
        };

        // Create object URL from file
        const videoUrl = URL.createObjectURL(videoFile);
        video.src = videoUrl;
        video.load();

        // Clean up object URL after processing
        video.onloadeddata = () => {
          URL.revokeObjectURL(videoUrl);
        };
      });
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setUploadError(null);
      setIsUploading(true);
      const uploadedMedia = [];
      const thumbnails = [];

      try {
        // Upload all new media files
        for (const file of mediaFiles) {
          const { isVideo } = validateFile(file);

          const { url, error } = await upload({ file });
          if (error) {
            throw new Error(`Failed to upload ${file.name}: ${error}`);
          }

          uploadedMedia.push({
            url,
            type: isVideo ? "video" : "image",
            name: file.name,
          });

          // Generate thumbnail for videos
          if (isVideo) {
            console.log(`Generating thumbnail for video: ${file.name}`);
            const thumbnail = await generateVideoThumbnail(file);
            if (thumbnail) {
              thumbnails.push({
                url: url,
                thumbnail: thumbnail,
              });
              console.log(`Generated thumbnail for ${file.name}`);
            } else {
              console.warn(`Failed to generate thumbnail for ${file.name}`);
            }
          }
        }

        // Combine existing media URLs with new ones
        await onSubmit({
          ...formData,
          media: [...formData.media, ...uploadedMedia.map((m) => m.url)],
          thumbnails: thumbnails.length > 0 ? thumbnails : undefined,
        });
      } catch (err) {
        console.error("Error handling media:", err);
        setUploadError(err.message || "Error uploading media");
      } finally {
        setIsUploading(false);
      }
    };

    const removeMediaFile = (index) => {
      setMediaFiles(mediaFiles.filter((_, i) => i !== index));
    };

    const removeExistingMedia = (index) => {
      const newMedia = [...formData.media];
      newMedia.splice(index, 1);
      setFormData({ ...formData, media: newMedia });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <h3 className="text-xl font-bold mb-4 text-white">
            {initialData ? "Edit Entry" : "New Journal Entry"}
          </h3>
          {uploadError && (
            <div className="mb-4 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
              {uploadError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="title"
                placeholder="Title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <textarea
                name="content"
                placeholder="Write your thoughts..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[200px]"
                required
              />
            </div>
            <div>
              <select
                name="visibility"
                value={formData.visibility}
                onChange={(e) =>
                  setFormData({ ...formData, visibility: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              >
                <option value="private">Private</option>
                <option value="semi-public">Semi-Public</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Media Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Upload Images & Videos
              </label>
              <div className="border-2 border-dashed border-[#333333] rounded-lg p-4 text-center hover:border-[#6366F1] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="media-upload"
                  disabled={isUploading}
                />
                <label
                  htmlFor="media-upload"
                  className={`cursor-pointer ${
                    isUploading ? "cursor-not-allowed opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-2"></i>
                    <div className="text-sm text-gray-300">
                      Click to upload images or videos
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Max size: 100MB • Formats: JPG, PNG, GIF, WebP, MP4, MOV,
                      M4V, WebM, OGG
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Show selected files */}
            {mediaFiles.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Selected Files ({mediaFiles.length})
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {mediaFiles.map((file, index) => {
                    const isVideo = ACCEPTED_VIDEO_TYPES.includes(file.type);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-[#242424] rounded-lg px-3 py-2"
                      >
                        <div className="flex items-center space-x-2">
                          <i
                            className={`fas ${
                              isVideo ? "fa-video" : "fa-image"
                            } text-gray-400`}
                          ></i>
                          <span className="text-sm text-white truncate">
                            {file.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / (1024 * 1024)).toFixed(1)}MB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMediaFile(index)}
                          className="text-red-400 hover:text-red-300 text-sm"
                          disabled={isUploading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Show existing media */}
            {formData.media.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Media ({formData.media.length})
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {formData.media.map((mediaUrl, index) => {
                    const isVideo = mediaUrl.match(
                      /\.(mp4|webm|mov|avi|m4v|mkv|flv|wmv|ogg|ogv|3gp|m2v|f4v)(\?|$)/i
                    );
                    return (
                      <div key={index} className="relative group">
                        {isVideo ? (
                          <video
                            src={mediaUrl}
                            className="w-full h-16 object-cover rounded border border-[#333333]"
                            muted
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            className="w-full h-16 object-cover rounded border border-[#333333]"
                            alt={`Media ${index + 1}`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeExistingMedia(index)}
                          className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isUploading}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <span>Save Entry</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddRequestForm = ({ onSubmit, onCancel, entry }) => {
    const [formData, setFormData] = useState({
      content: "",
      media: [],
    });
    const [mediaFiles, setMediaFiles] = useState([]);
    const [uploadError, setUploadError] = useState(null);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setUploadError(null);
      const uploadedMedia = [];

      try {
        // Upload media files
        for (const file of mediaFiles) {
          const { url, error } = await upload({ file });
          if (error) {
            setUploadError(`Failed to upload ${file.name}: ${error}`);
            return;
          }
          uploadedMedia.push(url);
        }

        // Submit the request
        const response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "ADD_REQUEST",
            id: entry.id,
            request_content: formData.content,
            media: uploadedMedia,
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to submit request");
        }

        setSuccess("Add request submitted successfully!");
        onCancel();
      } catch (err) {
        console.error("Error submitting request:", err);
        setError(err.message || "Could not submit request");
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl">
          <h3 className="text-xl font-bold mb-4 text-white">Add to Entry</h3>
          {uploadError && (
            <div className="mb-4 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
              {uploadError}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <textarea
                placeholder="What would you like to add?"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[200px]"
                required
              />
            </div>
            <div>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => setMediaFiles(Array.from(e.target.files))}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadLoading}
                className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors disabled:opacity-50"
              >
                {uploadLoading ? "Uploading..." : "Submit Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddRequestsList = ({ entry, onClose }) => {
    useEffect(() => {
      fetchAddRequests(entry.id);
    }, [entry.id]);

    const handleUpdateRequest = async (requestId, status) => {
      try {
        setError(null);
        console.log("Updating request:", { requestId, status }); // Debug log

        const response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "UPDATE_ADD_REQUEST",
            request_id: requestId,
            request_status: status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update request");
        }

        const result = await response.json();
        console.log("Update response:", result); // Debug log

        if (result.data) {
          // Update the entries list with the updated entry
          setEntries((prevEntries) =>
            prevEntries.map((e) => (e.id === entry.id ? result.data : e))
          );

          // Update the requests list
          setAddRequests((prevRequests) =>
            prevRequests
              .map((request) =>
                request.id === requestId ? { ...request, status } : request
              )
              .filter((request) => request.status !== "declined")
          );

          setSuccess(`Request ${status} successfully!`);

          // Close the modal if there are no more pending requests
          const remainingPendingRequests =
            result.data.add_requests?.filter((r) => r.status === "pending") ||
            [];
          if (remainingPendingRequests.length === 0) {
            onClose();
          }
        }
      } catch (err) {
        console.error("Error updating request:", err);
        setError(err.message || "Could not update request");
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Add Requests</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {requestsLoading ? (
            <div className="text-center py-8">Loading requests...</div>
          ) : addRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No requests yet
            </div>
          ) : (
            <div className="space-y-4">
              {addRequests
                .filter((request) => request.status === "pending")
                .map((request) => (
                  <div
                    key={request.id}
                    className="border border-[#333333] rounded-lg p-4"
                  >
                    <div className="flex items-center mb-2">
                      <img
                        src={
                          request.requester_image ||
                          "https://via.placeholder.com/40"
                        }
                        alt={request.requester_name}
                        className="w-8 h-8 rounded-full mr-2"
                      />
                      <span className="text-white">
                        {request.requester_name}
                      </span>
                    </div>
                    <p className="text-gray-300 mb-4">{request.content}</p>
                    {request.media &&
                      request.media.length > 0 &&
                      renderMedia(request.media)}
                    {request.status === "pending" && (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() =>
                            handleUpdateRequest(request.id, "approved")
                          }
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateRequest(request.id, "declined")
                          }
                          className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const JournalEntry = ({
    entry,
    user,
    setSelectedEntry,
    setShowRequests,
    setSelectedEntryForAdd,
    setShowAddRequest,
  }) => {
    const entryUserId = Number(entry.user_id);
    const currentUserId = Number(user?.id);
    const isOwner = entryUserId === currentUserId;

    // Track both pending and approved requests separately
    const [localRequests, setLocalRequests] = useState({
      pending: [],
      approved: [],
    });

    // Update local state whenever entry.add_requests changes
    useEffect(() => {
      if (entry.add_requests) {
        setLocalRequests({
          pending: entry.add_requests.filter(
            (request) => request.status === "pending"
          ),
          approved: entry.add_requests.filter(
            (request) => request.status === "approved"
          ),
        });
      }
    }, [entry.add_requests]);

    const handleDeleteEntry = async () => {
      if (
        !window.confirm(
          "Are you sure you want to delete this journal entry? This action cannot be undone."
        )
      ) {
        return;
      }

      try {
        setError(null);

        const response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "DELETE",
            id: entry.id,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete entry");
        }

        // Remove the entry from the list
        setEntries((prevEntries) =>
          prevEntries.filter((e) => e.id !== entry.id)
        );

        setSuccess("Journal entry deleted successfully!");

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        console.error("Error deleting entry:", err);
        setError(err.message || "Could not delete journal entry");
      }
    };

    const handleUpdateRequestLocal = async (requestId, status) => {
      try {
        setError(null);
        console.log("Updating request:", { requestId, status }); // Debug log

        // First verify the request exists in our local state
        const request = localRequests.pending.find((r) => r.id === requestId);
        if (!request) {
          throw new Error("Request not found");
        }

        const response = await fetch("/api/journal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "UPDATE_ADD_REQUEST",
            request_id: requestId,
            request_status: status,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to update request");
        }

        const result = await response.json();
        console.log("Update response:", result); // Debug log

        if (result.data) {
          // Update the entries list with the updated entry
          setEntries((prevEntries) =>
            prevEntries.map((e) => (e.id === entry.id ? result.data : e))
          );

          // Update local requests state
          setLocalRequests((prevRequests) => ({
            pending: prevRequests.pending.filter((r) => r.id !== requestId),
            approved:
              status === "approved"
                ? [
                    ...prevRequests.approved,
                    result.data.add_requests.find((r) => r.id === requestId),
                  ].filter(Boolean)
                : prevRequests.approved,
          }));

          setSuccess(`Request ${status} successfully!`);

          // Scroll to the newly approved request if it was approved
          if (status === "approved") {
            setTimeout(() => {
              const approvedSection = document.getElementById(
                `approved-requests-${entry.id}`
              );
              if (approvedSection) {
                approvedSection.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }
            }, 100);
          }
        }
      } catch (err) {
        console.error("Error updating request:", err);
        setError(err.message || "Could not update request");
      }
    };

    const renderMedia = (mediaItems) => {
      console.log("Rendering media items count:", mediaItems?.length);

      if (!mediaItems || !Array.isArray(mediaItems)) {
        console.log("No media items or not an array");
        return null;
      }

      // Helper function to fix potentially broken CDN URLs
      const fixCdnUrl = (url) => {
        if (!url || typeof url !== "string") return url;

        // If URL contains any createusercontent.com domain, try alternative CDN domains
        if (url.includes("createusercontent.com")) {
          console.log(
            "🔧 Detected potentially broken CDN URL, trying alternatives for:",
            url
          );

          // Extract the file ID from the URL
          const fileIdMatch = url.match(/([a-f0-9-]{36})/);
          const fileId = fileIdMatch ? fileIdMatch[1] : null;

          console.log("📁 Extracted file ID:", fileId);

          // Try different CDN variations that might work
          const alternatives = [
            // Try the original URL first
            url,
            // Try different CDN subdomains with original path
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://cdn.createusercontent.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://media.createusercontent.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://assets.createusercontent.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://files.createusercontent.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://storage.createusercontent.com/"
            ),
            // Try S3 alternatives
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://create-media-uploads.s3.amazonaws.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://create-uploads.s3.amazonaws.com/"
            ),
            url.replace(
              /https:\/\/[^.]*\.createusercontent\.com\//,
              "https://create-assets.s3.amazonaws.com/"
            ),
          ];

          // If we have a file ID, try additional path variations
          if (fileId) {
            alternatives.push(
              // Try different path structures
              `https://cdn.createusercontent.com/files/${fileId}`,
              `https://media.createusercontent.com/uploads/${fileId}`,
              `https://assets.createusercontent.com/media/${fileId}`,
              `https://files.createusercontent.com/${fileId}`,
              `https://storage.createusercontent.com/${fileId}`,
              // Try with common file extensions
              `https://cdn.createusercontent.com/${fileId}.jpg`,
              `https://cdn.createusercontent.com/${fileId}.png`,
              `https://cdn.createusercontent.com/${fileId}.webp`,
              `https://media.createusercontent.com/${fileId}.jpg`,
              `https://media.createusercontent.com/${fileId}.png`,
              `https://media.createusercontent.com/${fileId}.webp`,
              // Try S3 direct access
              `https://create-media-uploads.s3.amazonaws.com/${fileId}`,
              `https://create-uploads.s3.amazonaws.com/${fileId}`,
              `https://create-assets.s3.amazonaws.com/${fileId}`,
              // Try CloudFront CDN patterns
              `https://d1234567890.cloudfront.net/${fileId}`,
              `https://cdn.create.xyz/${fileId}`,
              // Try alternative CDN services
              `https://cdn.jsdelivr.net/gh/create-xyz/uploads/${fileId}`
            );
          }

          // Remove duplicates and filter out invalid URLs
          const uniqueAlternatives = [...new Set(alternatives)].filter(Boolean);

          console.log(
            `🔄 Generated ${uniqueAlternatives.length} alternative URLs:`,
            uniqueAlternatives
          );

          return uniqueAlternatives;
        }

        return [url];
      };

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {mediaItems
            .map((mediaItem, index) => {
              const originalUrl = mediaItem.media_url || mediaItem;

              if (!originalUrl || typeof originalUrl !== "string") {
                console.log("❌ Invalid URL at index:", index);
                return null;
              }

              // Simple video type detection
              const isVideo = originalUrl.match(
                /\.(mp4|webm|mov|avi|m4v|mkv|flv|wmv|ogg|ogv|3gp|m2v|f4v)(\?|$)/i
              );

              console.log(
                `🎬 Media ${index} type: ${
                  isVideo ? "video" : "image"
                }, URL: ${originalUrl}`
              );

              // Get potential URL alternatives
              const urlOptions = fixCdnUrl(originalUrl);

              return (
                <div
                  key={`${index}-${originalUrl}`}
                  className="rounded-lg overflow-hidden bg-[#242424] border border-[#333333] w-full"
                >
                  {isVideo ? (
                    <div className="w-full">
                      <MediaVideoPlayer urls={urlOptions} index={index} />
                    </div>
                  ) : (
                    <div className="w-full relative">
                      <MediaImagePlayer urls={urlOptions} index={index} />
                    </div>
                  )}
                </div>
              );
            })
            .filter(Boolean)}
        </div>
      );
    };

    const pendingRequestsCount = localRequests.pending.length;

    // Default avatar URL
    const defaultAvatar =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3-3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

    return (
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-6 relative">
        {/* Main post header */}
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-white">{entry.title}</h3>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm px-2 py-1 rounded ${
                entry.visibility === "private"
                  ? "bg-red-900/20 text-red-400"
                  : entry.visibility === "semi-public"
                  ? "bg-yellow-900/20 text-yellow-400"
                  : "bg-green-900/20 text-green-400"
              }`}
            >
              {entry.visibility}
            </span>
            {isOwner &&
              (entry.visibility === "public" ||
                entry.visibility === "semi-public") && (
                <button
                  onClick={() => {
                    setSelectedEntry(entry);
                    setShowRequests(true);
                  }}
                  className="text-gray-400 hover:text-white transition-colors relative"
                >
                  <i className="fas fa-user-plus"></i>
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>
              )}
            {!isOwner &&
              (entry.visibility === "public" ||
                entry.visibility === "semi-public") && (
                <button
                  onClick={() => {
                    setSelectedEntryForAdd(entry);
                    setShowAddRequest(true);
                  }}
                  className="px-3 py-1 bg-[#6366F1] hover:bg-[#4F46E5] rounded text-white text-sm"
                >
                  Add to Post
                </button>
              )}
          </div>
        </div>

        {/* Main post content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4 whitespace-pre-wrap">
            {entry.content}
          </p>
          {entry.media && entry.media.length > 0 && renderMedia(entry.media)}
          <div className="text-sm text-gray-400">
            {new Date(entry.created_at).toLocaleDateString()}
          </div>
        </div>

        {/* Approved requests section with improved styling */}
        {localRequests.approved.length > 0 && (
          <div id={`approved-requests-${entry.id}`} className="mt-6 space-y-4">
            <div className="h-px bg-[#333333] mb-6"></div>
            <h4 className="text-lg font-semibold text-gray-300 mb-4">
              Added Content
            </h4>
            <div className="space-y-4 pl-4 border-l-2 border-[#333333]">
              {localRequests.approved.map((request) => (
                <div
                  key={request.id}
                  className="bg-[#242424] rounded-lg p-4 transition-all duration-300 ease-in-out"
                >
                  <div className="flex items-center mb-3">
                    <img
                      src={request.requester_image || defaultAvatar}
                      alt={request.requester_name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-sm text-gray-400">
                      Added by {request.requester_name} on{" "}
                      {new Date(request.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {request.content}
                  </p>
                  {request.media &&
                    request.media.length > 0 &&
                    renderMedia(request.media)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending requests section - only visible to owner */}
        {isOwner && localRequests.pending.length > 0 && (
          <div className="mt-6">
            <div className="h-px bg-[#333333] mb-6"></div>
            <h4 className="text-lg font-semibold text-gray-300 mb-4">
              Pending Requests
            </h4>
            <div className="space-y-4">
              {localRequests.pending.map((request) => (
                <div
                  key={request.id}
                  className="bg-[#242424] rounded-lg p-4 transition-all duration-300 ease-in-out"
                >
                  <div className="flex items-center mb-3">
                    <img
                      src={request.requester_image || defaultAvatar}
                      alt={request.requester_name}
                      className="w-6 h-6 rounded-full mr-2"
                    />
                    <span className="text-sm text-gray-400">
                      {request.requester_name} wants to add content
                    </span>
                    <div className="ml-auto flex space-x-2">
                      <button
                        onClick={() =>
                          handleUpdateRequestLocal(request.id, "approved")
                        }
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleUpdateRequestLocal(request.id, "declined")
                        }
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-300 whitespace-pre-wrap">
                    {request.content}
                  </p>
                  {request.media &&
                    request.media.length > 0 &&
                    renderMedia(request.media)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit and Delete buttons in bottom right corner */}
        {isOwner && (
          <div className="absolute bottom-6 right-6 flex items-center space-x-2">
            <button
              onClick={handleDeleteEntry}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors shadow-lg"
            >
              <i className="fas fa-trash"></i>
              <span>Delete</span>
            </button>
            <button
              onClick={() => setSelectedEntry(entry)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors shadow-lg"
            >
              <i className="fas fa-edit"></i>
              <span>Edit</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleSaveEntry = async (formData) => {
    try {
      console.log("Sending form data:", formData); // Debug log

      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: selectedEntry ? "PUT" : "POST",
          id: selectedEntry?.id,
          ...formData,
        }),
      });

      const result = await response.json();
      console.log("Server response:", result); // Debug log

      if (!response.ok) {
        throw new Error(
          result.error || `HTTP error! status: ${response.status}`
        );
      }

      // Check if result exists
      if (!result) {
        console.error("Empty response from server");
        throw new Error("Empty response from server");
      }

      // Check if result has data property
      if (!("data" in result)) {
        console.error("Response missing data property:", result);
        throw new Error("Invalid server response format");
      }

      // Check if data exists and has required properties
      if (!result.data || typeof result.data !== "object") {
        console.error("Invalid data in response:", result.data);
        throw new Error("Invalid data format in server response");
      }

      if (!result.data.id) {
        console.error("Missing ID in entry data:", result.data);
        throw new Error("Server returned entry without ID");
      }

      // Process the successful response
      if (selectedEntry) {
        setEntries(
          entries.map((entry) =>
            entry.id === selectedEntry.id ? result.data : entry
          )
        );
        setSuccess("Journal entry updated successfully!");
      } else {
        setEntries([result.data, ...entries]);
        setSuccess("New journal entry created successfully!");
      }

      // Close the modal immediately after successful save
      setIsAddingEntry(false);
      setSelectedEntry(null);
      setError(null);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error saving entry:", err);
      setError(err.message || "Could not save journal entry");
      // Don't close the modal on error so user can try again
    }
  };

  const fetchAddRequests = async (entryId) => {
    try {
      setRequestsLoading(true);
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "GET_ADD_REQUESTS",
          id: entryId,
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch requests");
      const result = await response.json();
      setAddRequests(result.data || []);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Could not load add requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleUpdateRequest = async (requestId, status) => {
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE_ADD_REQUEST",
          request_id: requestId,
          request_status: status,
          entry_id: selectedEntry.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update request");
      }

      if (result.data) {
        // Update the entries list with the updated entry
        setEntries((prevEntries) =>
          prevEntries.map((e) => (e.id === selectedEntry.id ? result.data : e))
        );

        // Update the requests list
        setAddRequests((prevRequests) =>
          prevRequests
            .map((request) =>
              request.id === requestId ? { ...request, status } : request
            )
            .filter((request) => request.status !== "declined")
        );

        setSuccess(`Request ${status} successfully!`);

        // Close the modal if there are no more pending requests
        const remainingPendingRequests =
          result.data.add_requests?.filter((r) => r.status === "pending") || [];
        if (remainingPendingRequests.length === 0) {
          setShowRequests(false);
          setSelectedEntry(null);
        }
      }
    } catch (err) {
      console.error("Error updating request:", err);
      setError("Could not update request");
    }
  };

  // Component for handling video with multiple URL fallbacks
  const MediaVideoPlayer = ({ urls, index, originalUrl, thumbnail }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showThumbnail, setShowThumbnail] = useState(!!thumbnail);

    const currentUrl = Array.isArray(urls) ? urls[currentUrlIndex] : urls;

    const handleVideoError = (e) => {
      console.error(`❌ Video ${index} failed to load from: ${currentUrl}`);

      setIsLoading(false);

      // If we have more URLs to try
      if (Array.isArray(urls) && currentUrlIndex < urls.length - 1) {
        console.log(
          `🔄 Trying next URL for video ${index}: ${urls[currentUrlIndex + 1]}`
        );
        setCurrentUrlIndex(currentUrlIndex + 1);
        setIsLoading(true);
      } else {
        console.log(`❌ All URLs failed for video ${index}`);
        setHasError(true);
      }
    };

    const handlePlayClick = () => {
      setShowThumbnail(false);
    };

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm bg-[#1a1a1a] p-4 aspect-video">
          <i className="fas fa-video text-3xl mb-2"></i>
          <div className="text-center">
            <div className="mb-2">Video failed to load</div>
            <div className="text-xs text-gray-500 mb-3">
              CDN might be temporarily unavailable
            </div>
            <a
              href={Array.isArray(urls) ? urls[0] : urls}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
            >
              Open Video
            </a>
          </div>
        </div>
      );
    }

    // Show thumbnail with play button overlay
    if (showThumbnail && thumbnail) {
      return (
        <div
          className="relative aspect-video cursor-pointer group"
          onClick={handlePlayClick}
        >
          <img
            src={thumbnail}
            alt={`Video ${index + 1} thumbnail`}
            className="w-full h-full rounded-lg object-cover"
            onError={() => {
              console.warn(
                `Thumbnail failed to load for video ${index}, showing video directly`
              );
              setShowThumbnail(false);
            }}
          />
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 group-hover:bg-opacity-50 transition-all duration-300 rounded-lg">
            <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition-all duration-300 shadow-lg">
              <i className="fas fa-play text-2xl text-gray-800 ml-1"></i>
            </div>
          </div>
          {/* Video indicator */}
          <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1 text-xs text-white">
            <i className="fas fa-video mr-1"></i>
            Video
          </div>
        </div>
      );
    }

    return (
      <div className="relative aspect-video cursor-pointer group">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a] rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
        )}
        <video
          key={currentUrlIndex} // Force re-render when URL changes
          src={currentUrl}
          className="w-full h-full rounded-lg object-cover"
          controls
          preload="metadata"
          onError={handleVideoError}
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onCanPlay={() => setIsLoading(false)}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 rounded-lg pointer-events-none">
          <div className="absolute top-2 right-2 bg-black/50 rounded px-2 py-1 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
            <i className="fas fa-video mr-1"></i>
            Video
          </div>
        </div>
      </div>
    );
  };

  // Component for handling images with multiple URL fallbacks
  const MediaImagePlayer = ({ urls, index }) => {
    const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const currentUrl = Array.isArray(urls) ? urls[currentUrlIndex] : urls;

    const handleImageError = (e) => {
      console.error(`❌ Image ${index} failed to load from: ${currentUrl}`);

      setIsLoading(false);

      // If we have more URLs to try
      if (Array.isArray(urls) && currentUrlIndex < urls.length - 1) {
        console.log(
          `🔄 Trying next URL for image ${index}: ${urls[currentUrlIndex + 1]}`
        );
        setCurrentUrlIndex(currentUrlIndex + 1);
        setIsLoading(true);
      } else {
        console.log(`❌ All URLs failed for image ${index}`);
        setHasError(true);
      }
    };

    if (hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm bg-[#1a1a1a] p-4">
          <i className="fas fa-image text-3xl mb-2"></i>
          <div className="text-center">
            <div className="mb-2">Image failed to load</div>
            <div className="text-xs text-gray-500 mb-3">
              CDN might be temporarily unavailable
            </div>
            <a
              href={Array.isArray(urls) ? urls[0] : urls}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs"
            >
              Open Media
            </a>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        <img
          key={currentUrlIndex} // Force re-render when URL changes
          src={currentUrl}
          alt={`Media ${index + 1}`}
          className="w-full h-auto max-h-[400px] object-contain"
          onError={handleImageError}
          onLoad={() => setIsLoading(false)}
        />
      </div>
    );
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
            My Journal
          </h1>
          <button
            onClick={() => setIsAddingEntry(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>New Entry</span>
          </button>
        </div>

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No journal entries yet. Start writing your first entry!
          </div>
        ) : (
          <div>
            {entries
              .filter((entry) => entry && entry.id)
              .map((entry) => (
                <JournalEntry
                  key={entry.id}
                  entry={entry}
                  user={user}
                  setSelectedEntry={setSelectedEntry}
                  setShowRequests={setShowRequests}
                  setSelectedEntryForAdd={setSelectedEntryForAdd}
                  setShowAddRequest={setShowAddRequest}
                />
              ))}
          </div>
        )}

        {(isAddingEntry || selectedEntry) && (
          <JournalForm
            onSubmit={handleSaveEntry}
            onCancel={() => {
              setIsAddingEntry(false);
              setSelectedEntry(null);
              setError(null);
            }}
            initialData={selectedEntry}
          />
        )}

        {showAddRequest && selectedEntryForAdd && (
          <AddRequestForm
            entry={selectedEntryForAdd}
            onCancel={() => {
              setShowAddRequest(false);
              setSelectedEntryForAdd(null);
            }}
          />
        )}

        {showRequests && selectedEntry && (
          <AddRequestsList
            entry={selectedEntry}
            onClose={() => {
              setShowRequests(false);
              setSelectedEntry(null);
            }}
          />
        )}
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
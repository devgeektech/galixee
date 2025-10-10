"use client";
import { React, useState, useEffect} from "react";
import { useUpload } from "@/utilities/runtime-helpers";
import useUser from "@/components/use-user";
function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingMessage, setIsAddingMessage] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [successMessage, setSuccessMessage] = useState("");

  const setTemporarySuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
  }, [user, userLoading]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      const response = await fetch("/api/scheduled-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "GET" }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 504) {
          throw new Error("Request timed out. Please try refreshing the page.");
        }
        throw new Error(
          `Failed to fetch scheduled messages (${response.status})`
        );
      }

      const { data } = await response.json();
      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      if (err.name === "AbortError") {
        setError("Request timed out. Please try refreshing the page.");
      } else {
        setError(err.message || "Could not load scheduled messages");
      }
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
    if (!userLoading && user) {
      fetchMessages();
    }
  }, [user, userLoading]);

  const MessageForm = ({ onSubmit, onCancel, initialData }) => {
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const [formData, setFormData] = useState({
      recipient_name: initialData?.recipient_name || "",
      recipient_email: initialData?.recipient_email || "",
      recipient_phone: initialData?.recipient_phone || "",
      message_type: initialData?.message_type || "text",
      message_content: initialData?.message_content || "",
      scheduled_date: initialData?.scheduled_date
        ? new Date(initialData.scheduled_date).toISOString().split("T")[0]
        : "",
      scheduled_time: initialData?.scheduled_date
        ? new Date(initialData.scheduled_date).toTimeString().slice(0, 5)
        : "",
      media_url: initialData?.media_url || "",
      timezone: initialData?.timezone || userTimezone,
    });
    const [file, setFile] = useState(null);
    const [uploadError, setUploadError] = useState(null);

    const timezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "America/Honolulu",
      "America/Puerto_Rico",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Dubai",
      "Australia/Sydney",
      "Pacific/Auckland",
    ];

    const formatTimezone = (tz) => {
      try {
        const now = new Date();
        const tzString = now.toLocaleString("en-US", {
          timeZone: tz,
          timeZoneName: "long",
        });
        const offset = tzString.split(" ").slice(-1)[0];
        return `${tz.replace("_", " ")} (${offset})`;
      } catch (e) {
        return tz.replace("_", " ");
      }
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setUploadError(null);

      try {
        let mediaUrl = formData.media_url;

        if (
          file &&
          (formData.message_type === "video" ||
            formData.message_type === "picture")
        ) {
          const { url, error } = await upload({ file });
          if (error) throw new Error(error);
          mediaUrl = url;
        }

        const delivery_method =
          formData.message_type === "email" ? "email" : "sms";

        await onSubmit({
          ...formData,
          media_url: mediaUrl,
          delivery_method,
          scheduled_date: `${formData.scheduled_date}T${formData.scheduled_time}:00`,
        });
      } catch (err) {
        setUploadError(err.message);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-white">
            {initialData ? "Edit Scheduled Message" : "Schedule New Message"}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Recipient Name
              </label>
              <input
                type="text"
                name="recipient_name"
                value={formData.recipient_name}
                onChange={(e) =>
                  setFormData({ ...formData, recipient_name: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message Type
              </label>
              <select
                name="message_type"
                value={formData.message_type}
                onChange={(e) =>
                  setFormData({ ...formData, message_type: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              >
                <option value="text">Text Message</option>
                <option value="email">Email</option>
                <option value="video">Video Message</option>
                <option value="picture">Picture Message</option>
              </select>
            </div>

            {formData.message_type === "email" && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="recipient_email"
                  value={formData.recipient_email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipient_email: e.target.value,
                    })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            )}

            {(formData.message_type === "text" ||
              formData.message_type === "video" ||
              formData.message_type === "picture") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Recipient Phone
                </label>
                <input
                  type="tel"
                  name="recipient_phone"
                  value={formData.recipient_phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recipient_phone: e.target.value,
                    })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            )}

            {(formData.message_type === "video" ||
              formData.message_type === "picture") && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Upload{" "}
                  {formData.message_type === "video" ? "Video" : "Picture"}
                </label>
                <input
                  type="file"
                  accept={
                    formData.message_type === "video" ? "video/*" : "image/*"
                  }
                  onChange={(e) => setFile(e.target.files?.[0])}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Message Content
              </label>
              <textarea
                name="message_content"
                value={formData.message_content}
                onChange={(e) =>
                  setFormData({ ...formData, message_content: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_date: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Time
                </label>
                <input
                  type="time"
                  name="scheduled_time"
                  value={formData.scheduled_time}
                  onChange={(e) =>
                    setFormData({ ...formData, scheduled_time: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timezone
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              >
                <option value={userTimezone}>
                  {formatTimezone(userTimezone)} (Your Local Time)
                </option>
                {timezones
                  .filter((tz) => tz !== userTimezone)
                  .map((tz) => (
                    <option key={tz} value={tz}>
                      {formatTimezone(tz)}
                    </option>
                  ))}
              </select>
            </div>

            {uploadError && (
              <div className="text-red-400 text-sm">{uploadError}</div>
            )}

            <div className="flex justify-end space-x-4 mt-6">
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
                {uploadLoading
                  ? "Uploading..."
                  : initialData
                  ? "Save Changes"
                  : "Schedule Message"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const MessageCard = ({ message }) => {
    if (!message || !message.recipient_name) {
      return null;
    }

    const formatMessageDateTime = (dateTimeStr, timezone) => {
      try {
        // Parse the date string directly without timezone conversion
        const [datePart, timePart] = dateTimeStr.split("T");
        const [year, month, day] = datePart.split("-");
        const [time] = timePart.split("."); // Remove any milliseconds
        const [hours, minutes] = time.split(":");

        // Format month name
        const monthNames = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ];
        const monthName = monthNames[parseInt(month) - 1];

        // Format hour for 12-hour clock
        let hour = parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        hour = hour ? hour : 12; // Convert 0 to 12

        // Build the formatted string
        return `${monthName} ${parseInt(
          day
        )}, ${year} ${hour}:${minutes.padStart(2, "0")} ${ampm} (${timezone})`;
      } catch (err) {
        console.error("Error formatting date:", err);
        return dateTimeStr;
      }
    };

    const handleDelete = async () => {
      if (!confirm("Are you sure you want to delete this scheduled message?")) {
        return;
      }

      try {
        const response = await fetch("/api/scheduled-messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            method: "DELETE",
            id: message.id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to delete message");
        }

        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      } catch (err) {
        console.error("Error deleting message:", err);
        setError("Could not delete message");
      }
    };

    return (
      <div className="message-card bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">
              {message.recipient_name}
            </h3>
            <p className="text-gray-400">
              {formatMessageDateTime(message.scheduled_date, message.timezone)}
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setEditingMessage(message)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="fas fa-edit"></i>
            </button>
            <button
              onClick={handleDelete}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <i className="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div className="space-y-2 text-gray-300">
          <p className="text-sm text-gray-400">
            Type:{" "}
            {message.message_type.charAt(0).toUpperCase() +
              message.message_type.slice(1)}
          </p>
          <p>{message.message_content}</p>
          {message.media_url && (
            <div className="mt-4">
              {message.message_type === "picture" ? (
                <img
                  src={message.media_url}
                  alt="Scheduled message attachment"
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                message.message_type === "video" && (
                  <video
                    src={message.media_url}
                    controls
                    className="max-w-full h-auto rounded-lg"
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <style jsx global>{`
        @keyframes fadeOut {
          0% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-fade-out {
          animation: fadeOut 3s ease-in-out forwards;
        }
      `}</style>

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

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Scheduled Messages
          </h1>
          <button
            onClick={() => {
              setIsAddingMessage(true);
              setSuccessMessage("");
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>New Message</span>
          </button>
        </div>

        {/* Show success message if present */}
        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400 flex items-center justify-between animate-fade-out">
            <div className="flex items-center">
              <i className="fas fa-check-circle mr-2"></i>
              {successMessage}
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6366F1]"></div>
            <p className="text-gray-400">Loading your messages...</p>
          </div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-lg text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => fetchMessages()}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No scheduled messages yet
          </div>
        ) : (
          <div className="space-y-12">
            {/* Waiting to be Sent Section */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <i className="fas fa-clock mr-3 text-[#6366F1]"></i>
                Waiting to be Sent
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {messages
                  .filter(
                    (message) =>
                      message.status === "pending" ||
                      message.status === "test_pending"
                  )
                  .map((message, index) => (
                    <MessageCard key={`pending-${index}`} message={message} />
                  ))}
                {messages.filter(
                  (message) =>
                    message.status === "pending" ||
                    message.status === "test_pending"
                ).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400 bg-[#1A1A1A] border border-[#333333] rounded-xl">
                    No pending messages
                  </div>
                )}
              </div>
            </div>

            {/* Message Sent History Section */}
            <div>
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <i className="fas fa-history mr-3 text-[#4FD1C5]"></i>
                Message Sent History
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {messages
                  .filter((message) => message.status === "sent")
                  .map((message, index) => (
                    <MessageCard key={`sent-${index}`} message={message} />
                  ))}
                {messages.filter((message) => message.status === "sent")
                  .length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-400 bg-[#1A1A1A] border border-[#333333] rounded-xl">
                    No sent messages
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {(isAddingMessage || editingMessage) && (
          <MessageForm
            onSubmit={async (formData) => {
              try {
                const response = await fetch("/api/scheduled-messages", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    method: editingMessage ? "PUT" : "POST",
                    id: editingMessage?.id,
                    ...formData,
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || "Failed to save message");
                }

                const result = await response.json();

                if (editingMessage) {
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === editingMessage.id ? result.data : msg
                    )
                  );
                  setTemporarySuccessMessage("Message updated successfully!");
                } else {
                  setMessages((prev) => [...prev, result.data]);
                  setTemporarySuccessMessage("Message scheduled successfully!");
                }

                setIsAddingMessage(false);
                setEditingMessage(null);

                // Scroll the new message into view if it's not visible
                setTimeout(() => {
                  const messageElements =
                    document.querySelectorAll(".message-card");
                  const lastMessage =
                    messageElements[messageElements.length - 1];
                  if (lastMessage) {
                    lastMessage.scrollIntoView({
                      behavior: "smooth",
                      block: "nearest",
                    });
                  }
                }, 100);
              } catch (err) {
                console.error("Error saving message:", err);
                setError(err.message || "Could not save message");
              }
            }}
            onCancel={() => {
              setIsAddingMessage(false);
              setEditingMessage(null);
            }}
            initialData={editingMessage}
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
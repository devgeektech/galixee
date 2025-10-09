"use client";
import {React,useState, useCallback, useEffect}  from "react";
import useUser from '../../components/use-user'

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [testMessage, setTestMessage] = useState({
    phone: "",
    content: "",
  });

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchMessages();
  }, [user, userLoading]);

  const fetchMessages = async () => {
    try {
      console.log("Debug - Fetching messages...");
      const response = await fetch("/api/test-message-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Debug - Fetched messages result:", result);

      if (!result.success) {
        throw new Error(result.error || "Unknown error occurred");
      }

      setMessages(result.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(
        `Could not load message status: ${err.message}. Please try refreshing the page.`
      );
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMessage = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage("");
    setLoading(true);

    try {
      console.log("Debug - Sending test message:", {
        phone: testMessage.phone,
      });
      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: testMessage.phone,
          content: testMessage.content,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Debug - Send message result:", result);

      if (result.error) {
        throw new Error(result.error);
      }

      setSuccessMessage(result.message || "Test SMS sent successfully!");
      setTestMessage({
        phone: "",
        content: "",
      });

      // Add delay before first fetch to allow database to update
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await fetchMessages();

      // Fetch again after a longer delay in case of slower database updates
      setTimeout(async () => {
        await fetchMessages();
      }, 3000);
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Failed to send test message");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
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
            href="/pre-messaging"
            className="text-gray-300 hover:text-white transition-colors"
          >
            Back to Messages
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
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          Message Testing
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Send Test SMS
            </h2>
            {successMessage && (
              <div className="mb-4 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="mb-4 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                {error}
              </div>
            )}
            <form onSubmit={handleTestMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number (E.164 format)
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1234567890"
                  value={testMessage.phone}
                  onChange={(e) =>
                    setTestMessage({
                      ...testMessage,
                      phone: e.target.value,
                    })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Example: +1234567890 (include country code)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message Content
                </label>
                <textarea
                  name="content"
                  value={testMessage.content}
                  onChange={(e) =>
                    setTestMessage({ ...testMessage, content: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[150px]"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors"
              >
                Send Test SMS
              </button>
            </form>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Message Status
            </h2>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No messages found
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="bg-[#242424] rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-gray-300">
                        {message.recipient_name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-sm ${
                          message.status === "sent"
                            ? "bg-green-900/20 text-green-400"
                            : message.status === "failed"
                            ? "bg-red-900/20 text-red-400"
                            : message.status === "test_pending"
                            ? "bg-yellow-900/20 text-yellow-400"
                            : "bg-blue-900/20 text-blue-400"
                        }`}
                      >
                        {message.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      Phone: {message.recipient_phone}
                    </div>
                    <div className="text-sm text-gray-400">
                      Scheduled: {formatDate(message.scheduled_date)}
                    </div>
                    <div className="text-sm text-gray-400">
                      Content: {message.message_content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
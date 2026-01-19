"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useUser } from "../../components/use-user";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [templates, setTemplates] = useState([]);
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isSchedulingMessage, setIsSchedulingMessage] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [newTemplate, setNewTemplate] = useState({
    name: "",
    content: "",
  });

  const [newSchedule, setNewSchedule] = useState({
    templateId: "",
    recipientPhone: "",
    recipientName: "",
    scheduledDate: "",
    scheduledTime: "",
  });

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchScheduledMessages();
  }, [user, userLoading]);

  const fetchScheduledMessages = async () => {
    try {
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
      if (!result.success) {
        throw new Error(result.error || "Unknown error occurred");
      }

      setScheduledMessages(result.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Could not load scheduled messages");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    try {
      setTemplates([...templates, { ...newTemplate, id: Date.now() }]);
      setNewTemplate({ name: "", content: "" });
      setIsAddingTemplate(false);
      setSuccessMessage("Template saved successfully!");
    } catch (err) {
      setError("Failed to save template");
    }
  };

  const handleScheduleMessage = async (e) => {
    e.preventDefault();
    try {
      const scheduledDateTime = `${newSchedule.scheduledDate}T${newSchedule.scheduledTime}:00`;

      const response = await fetch("/api/send-sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: newSchedule.recipientPhone,
          content: selectedTemplate.content,
          scheduledDate: scheduledDateTime,
          recipientName: newSchedule.recipientName,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to schedule message");
      }

      setNewSchedule({
        templateId: "",
        recipientPhone: "",
        recipientName: "",
        scheduledDate: "",
        scheduledTime: "",
      });
      setIsSchedulingMessage(false);
      setSuccessMessage("Message scheduled successfully!");
      await fetchScheduledMessages();
    } catch (err) {
      setError("Failed to schedule message");
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
          Message Scheduler
        </h1>

        {successMessage && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6366F1]">
                Message Templates
              </h2>
              <button
                onClick={() => setIsAddingTemplate(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                New Template
              </button>
            </div>

            {isAddingTemplate && (
              <form onSubmit={handleSaveTemplate} className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message Content
                  </label>
                  <textarea
                    value={newTemplate.content}
                    onChange={(e) =>
                      setNewTemplate({
                        ...newTemplate,
                        content: e.target.value,
                      })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingTemplate(false)}
                    className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    Save Template
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="bg-[#242424] p-4 rounded-lg cursor-pointer hover:border-[#6366F1] border border-[#333333] transition-colors"
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsSchedulingMessage(true);
                  }}
                >
                  <h3 className="font-medium text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-gray-400 text-sm">{template.content}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Scheduled Messages
            </h2>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : scheduledMessages.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No messages scheduled
              </div>
            ) : (
              <div className="space-y-4">
                {scheduledMessages.map((message) => (
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
                      Message: {message.message_content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isSchedulingMessage && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">Schedule Message</h3>
              <form onSubmit={handleScheduleMessage} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    value={newSchedule.recipientName}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        recipientName: e.target.value,
                      })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Phone Number (E.164 format)
                  </label>
                  <input
                    type="tel"
                    value={newSchedule.recipientPhone}
                    onChange={(e) =>
                      setNewSchedule({
                        ...newSchedule,
                        recipientPhone: e.target.value,
                      })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    placeholder="+1234567890"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={newSchedule.scheduledDate}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          scheduledDate: e.target.value,
                        })
                      }
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      value={newSchedule.scheduledTime}
                      onChange={(e) =>
                        setNewSchedule({
                          ...newSchedule,
                          scheduledTime: e.target.value,
                        })
                      }
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message Preview
                  </label>
                  <div className="bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-gray-400">
                    {selectedTemplate.content}
                  </div>
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSchedulingMessage(false);
                      setSelectedTemplate(null);
                    }}
                    className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    Schedule Message
                  </button>
                </div>
              </form>
            </div>
          </div>
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
"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({
  isOpen = false,
  onToggle = () => {},
  onSubmit = () => {},
  position = "bottom-right",
  theme = "dark",
}) {
  const [feedbackType, setFeedbackType] = React.useState("feedback");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [screenshot, setScreenshot] = React.useState(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deviceInfo, setDeviceInfo] = React.useState(null);

  React.useEffect(() => {
    // Collect device info when component mounts
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      timestamp: new Date().toISOString(),
    };
    setDeviceInfo(info);
  }, []);

  const captureScreenshot = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: { mediaSource: "screen" },
        });

        const video = document.createElement("video");
        video.srcObject = stream;
        video.play();

        video.addEventListener("loadedmetadata", () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0);

          canvas.toBlob((blob) => {
            setScreenshot(blob);
            stream.getTracks().forEach((track) => track.stop());
          }, "image/png");
        });
      }
    } catch (error) {
      console.error("Screenshot capture failed:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const feedbackData = {
      type: feedbackType,
      title,
      description,
      email,
      deviceInfo,
      screenshot,
      timestamp: new Date().toISOString(),
    };

    try {
      await onSubmit(feedbackData);
      // Reset form
      setTitle("");
      setDescription("");
      setEmail("");
      setScreenshot(null);
      setFeedbackType("feedback");
      onToggle();
    } catch (error) {
      console.error("Failed to submit feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6",
  };

  const themeClasses =
    theme === "dark"
      ? "bg-[#1A1A1A] border-[#333333] text-white"
      : "bg-white border-gray-300 text-gray-900";

  const buttonTheme =
    theme === "dark"
      ? "bg-[#6366F1] hover:bg-[#4F46E5] text-white"
      : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <>
      {/* Floating Button */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <button
          onClick={onToggle}
          className={`${buttonTheme} w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center justify-center`}
          title="Send Feedback"
        >
          <i className="fas fa-comment-dots text-xl"></i>
        </button>
      </div>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div
            className={`${themeClasses} border rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto`}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Send Feedback</h2>
              <button
                onClick={onToggle}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feedback Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Feedback Type
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value)}
                  className={`w-full ${theme === "dark" ? "bg-[#242424] border-[#333333]" : "bg-gray-50 border-gray-300"} border rounded-lg px-3 py-2`}
                  required
                >
                  <option value="feedback">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="improvement">Improvement Suggestion</option>
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full ${theme === "dark" ? "bg-[#242424] border-[#333333]" : "bg-gray-50 border-gray-300"} border rounded-lg px-3 py-2`}
                  placeholder="Brief summary of your feedback"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`w-full ${theme === "dark" ? "bg-[#242424] border-[#333333]" : "bg-gray-50 border-gray-300"} border rounded-lg px-3 py-2 min-h-[100px]`}
                  placeholder="Please provide detailed information..."
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${theme === "dark" ? "bg-[#242424] border-[#333333]" : "bg-gray-50 border-gray-300"} border rounded-lg px-3 py-2`}
                  placeholder="your@email.com"
                />
              </div>

              {/* Screenshot */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">
                    Screenshot (optional)
                  </label>
                  <button
                    type="button"
                    onClick={captureScreenshot}
                    className={`text-sm ${theme === "dark" ? "text-[#6366F1] hover:text-[#4F46E5]" : "text-blue-600 hover:text-blue-700"} transition-colors`}
                  >
                    <i className="fas fa-camera mr-1"></i>
                    Capture Screen
                  </button>
                </div>
                {screenshot && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <i className="fas fa-check"></i>
                    <span>Screenshot captured</span>
                    <button
                      type="button"
                      onClick={() => setScreenshot(null)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Device Info Preview */}
              {deviceInfo && (
                <div
                  className={`${theme === "dark" ? "bg-[#242424]" : "bg-gray-50"} p-3 rounded-lg`}
                >
                  <div className="text-sm font-medium mb-2">
                    Device Information (auto-collected)
                  </div>
                  <div className="text-xs space-y-1 text-gray-500">
                    <div>Browser: {deviceInfo.userAgent.split(" ")[0]}</div>
                    <div>Platform: {deviceInfo.platform}</div>
                    <div>Screen: {deviceInfo.screenResolution}</div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onToggle}
                  className={`px-4 py-2 border ${theme === "dark" ? "border-[#333333] text-gray-300 hover:text-white" : "border-gray-300 text-gray-700 hover:text-gray-900"} rounded-lg transition-colors`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${buttonTheme} px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Sending...
                    </>
                  ) : (
                    "Send Feedback"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function StoryComponent() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [submittedFeedback, setSubmittedFeedback] = React.useState(null);

  const handleSubmit = async (feedbackData) => {
    console.log("Feedback submitted:", feedbackData);
    setSubmittedFeedback(feedbackData);
    return new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Beta Feedback Widget Examples
        </h1>

        {/* Dark Theme - Bottom Right */}
        <div className="bg-[#121212] p-8 rounded-lg relative min-h-[400px]">
          <h2 className="text-white text-xl font-bold mb-4">
            Dark Theme - Bottom Right
          </h2>
          <p className="text-gray-400 mb-4">
            This shows the widget in a dark interface
          </p>
          <MainComponent
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            onSubmit={handleSubmit}
            position="bottom-right"
            theme="dark"
          />
        </div>

        {/* Light Theme - Bottom Left */}
        <div className="bg-white border border-gray-200 p-8 rounded-lg relative min-h-[400px]">
          <h2 className="text-gray-900 text-xl font-bold mb-4">
            Light Theme - Bottom Left
          </h2>
          <p className="text-gray-600 mb-4">
            This shows the widget in a light interface
          </p>
          <MainComponent
            isOpen={false}
            onToggle={() => {}}
            onSubmit={handleSubmit}
            position="bottom-left"
            theme="light"
          />
        </div>

        {/* Modal Open State */}
        <div className="bg-gray-50 p-8 rounded-lg">
          <h2 className="text-gray-900 text-xl font-bold mb-4">
            Modal Open State
          </h2>
          <p className="text-gray-600 mb-4">
            This shows the feedback form when opened
          </p>
          <MainComponent
            isOpen={true}
            onToggle={() => {}}
            onSubmit={handleSubmit}
            position="bottom-right"
            theme="dark"
          />
        </div>

        {/* Feedback Display */}
        {submittedFeedback && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
            <h3 className="text-green-800 font-bold mb-2">
              Last Submitted Feedback:
            </h3>
            <pre className="text-sm text-green-700 overflow-auto">
              {JSON.stringify(submittedFeedback, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
});
}
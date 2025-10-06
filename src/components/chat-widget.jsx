"use client";
import React from "react";

import { useHandleStreamResponse } from '../utilities/runtime-helpers'

export default function Index() {
  return (function MainComponent({
  isOpen = false,
  onToggle,
  messages = [],
  onSendMessage,
  isLoading = false,
  streamingMessage = "",
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue("");
    }
  };

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingMessage]);

  return (
    <>
      <button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 z-50 bg-[#6366F1] hover:bg-[#4F46E5] text-white rounded-full p-4 shadow-lg transition-transform transform hover:scale-105 ${
          isOpen ? "hidden" : "flex"
        }`}
      >
        <i className="fas fa-comment text-xl"></i>
      </button>

      <div
        className={`fixed bottom-6 right-6 z-50 w-[360px] bg-[#1A1A1A] border border-[#333333] rounded-xl shadow-xl transition-transform duration-300 transform ${
          isOpen ? "translate-y-0" : "translate-y-[150%]"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-[#333333]">
          <h3 className="text-white font-bold">Chat Assistant</h3>
          <button
            onClick={onToggle}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-minus"></i>
          </button>
        </div>

        <div className="h-[400px] overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.role === "user"
                    ? "bg-[#6366F1] text-white"
                    : "bg-[#242424] text-gray-200"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-[#242424] text-gray-200">
                {streamingMessage}
              </div>
            </div>
          )}
          {isLoading && !streamingMessage && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg p-3 bg-[#242424] text-gray-200">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}></div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t border-[#333333]">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-[#242424] text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fas fa-paper-plane"></i>
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

function StoryComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingMessage,
    onFinish: (message) => {
      setMessages((prev) => [...prev, { role: "assistant", content: message }]);
      setStreamingMessage("");
      setIsLoading(false);
    },
  });

  const handleSendMessage = async (message) => {
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: message }]);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: message }],
          stream: true,
        }),
      });

      handleStreamResponse(response);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] p-4">
      <h2 className="text-white text-2xl mb-4">Chat Widget Demo</h2>
      <p className="text-gray-400 mb-8">
        Click the chat button in the bottom right corner to start a conversation.
      </p>

      <MainComponent
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingMessage={streamingMessage}
      />
    </div>
  );
});
}
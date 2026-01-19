"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useHandleStreamResponse } from "../../utilities/runtime-helpers";
import { useUser } from "../../components/use-user";
import ChatWidget from "../../components/chat-widget";

function MainComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const { data: user, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
  }, [user, userLoading]);

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
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI assistant. Be concise and friendly in your responses.",
            },
            ...messages,
            { role: "user", content: message },
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      handleStreamResponse(response);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
      setIsLoading(false);
    }
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

      <main className="pt-24 px-6 pb-16 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          Chat Provider
        </h1>

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <p className="text-gray-400 mb-4">
            The chat widget is now available across your application. Click the
            chat button in the bottom right corner to start a conversation.
          </p>
        </div>
      </main>

      <ChatWidget
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        streamingMessage={streamingMessage}
      />

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
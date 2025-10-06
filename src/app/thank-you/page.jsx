"use client";
import React from "react";

function MainComponent() {
  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] border border-[#333333] p-8 rounded-xl text-center relative z-10">
        <div className="mb-8">
          <i className="fas fa-galaxy text-[#6366F1] text-4xl mb-4"></i>
          <h1 className="text-3xl font-bold text-white mb-4">
            See You Among the Stars
          </h1>
          <p className="text-gray-400 text-lg">
            You've successfully signed out of Galixee
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-[#242424] p-6 rounded-lg">
            <i className="fas fa-rocket text-[#4FD1C5] text-2xl mb-3"></i>
            <p className="text-white text-lg mb-2">
              Your cosmic journey awaits your return
            </p>
            <p className="text-gray-400">
              We'll keep your universe safe until next time
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <a
              href="/account/signin"
              className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors"
            >
              Sign Back In
            </a>
          </div>
        </div>
      </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[100px] animate-pulse"></div>
      </div>
    </div>
  );
}

export default MainComponent;
"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useUser } from "../../components/use-user";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [currentModule, setCurrentModule] = useState(0);
  const [progress, setProgress] = useState({});
  const [quizAnswers, setQuizAnswers] = useState({});
  const [showCertificate, setShowCertificate] = useState(false);
  const [error, setError] = useState(null);

  const courseModules = [
    {
      id: 1,
      title: "Understanding Money Basics",
      video: "https://example.com/video1.mp4",
      description:
        "Learn the fundamentals of money, saving, and spending wisely.",
      quiz: [
        {
          question: "What is the main purpose of a savings account?",
          options: [
            "To spend money quickly",
            "To keep money safe and earn interest",
            "To share with friends",
            "To buy video games",
          ],
          correct: 1,
        },
      ],
    },
    {
      id: 2,
      title: "Smart Saving Strategies",
      video: "https://example.com/video2.mp4",
      description:
        "Discover effective ways to save money and set financial goals.",
      quiz: [
        {
          question: "What is a good saving habit?",
          options: [
            "Spending all your allowance immediately",
            "Saving 20% of your money",
            "Borrowing from friends",
            "Buying everything on sale",
          ],
          correct: 1,
        },
      ],
    },
    {
      id: 3,
      title: "Introduction to Budgeting",
      video: "https://example.com/video3.mp4",
      description: "Learn how to create and stick to a budget.",
      quiz: [
        {
          question: "Why is budgeting important?",
          options: [
            "It's not important at all",
            "To track spending and saving",
            "To spend more money",
            "To make parents happy",
          ],
          correct: 1,
        },
      ],
    },
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    // Load saved progress
    const loadProgress = async () => {
      try {
        const response = await fetch("/api/financial-course", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET_PROGRESS" }),
        });

        if (!response.ok) throw new Error("Failed to load progress");

        const data = await response.json();
        setProgress(data.progress || {});
      } catch (err) {
        setError("Could not load your progress");
      }
    };

    loadProgress();
  }, [user, userLoading]);

  const handleModuleCompletion = async (moduleId) => {
    try {
      const response = await fetch("/api/financial-course", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "UPDATE_PROGRESS",
          moduleId,
          completed: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to update progress");

      setProgress((prev) => ({ ...prev, [moduleId]: true }));
    } catch (err) {
      setError("Could not save your progress");
    }
  };

  const handleQuizSubmit = async (moduleId, answers) => {
    const module = courseModules[moduleId];
    const isCorrect = module.quiz.every((q, idx) => answers[idx] === q.correct);

    if (isCorrect) {
      await handleModuleCompletion(moduleId);

      if (moduleId === courseModules.length - 1) {
        setShowCertificate(true);
      } else {
        setCurrentModule(moduleId + 1);
      }
    }
  };

  const ModuleCard = ({ module, index }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{module.title}</h3>
        {progress[module.id] && (
          <span className="text-green-400">
            <i className="fas fa-check-circle"></i>
          </span>
        )}
      </div>
      <p className="text-gray-400 mb-4">{module.description}</p>
      <div className="aspect-w-16 aspect-h-9 mb-6">
        <video
          controls
          className="rounded-lg w-full"
          src={module.video}
          poster="/video-placeholder.jpg"
        >
          Your browser does not support video playback.
        </video>
      </div>
      {currentModule === index && (
        <div className="space-y-4">
          {module.quiz.map((q, qIndex) => (
            <div key={qIndex} className="bg-[#242424] p-4 rounded-lg">
              <p className="text-white mb-4">{q.question}</p>
              <div className="space-y-2">
                {q.options.map((option, oIndex) => (
                  <button
                    key={oIndex}
                    onClick={() =>
                      setQuizAnswers({ ...quizAnswers, [qIndex]: oIndex })
                    }
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      quizAnswers[qIndex] === oIndex
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#333333] text-gray-300 hover:bg-[#444444]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={() => handleQuizSubmit(index, quizAnswers)}
            className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors"
          >
            Submit Answers
          </button>
        </div>
      )}
    </div>
  );

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
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Financial Planning for Young People
          </h1>
          <p className="text-gray-400 text-lg">
            Learn essential money management skills for a successful future
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {showCertificate ? (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8 text-center">
            <i className="fas fa-award text-[#6366F1] text-5xl mb-4"></i>
            <h2 className="text-2xl font-bold text-white mb-4">
              Congratulations!
            </h2>
            <p className="text-gray-400 mb-6">
              You've completed the Financial Planning Course
            </p>
            <button
              onClick={() => window.print()}
              className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors"
            >
              <i className="fas fa-print mr-2"></i>
              Print Certificate
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {courseModules.map((module, index) => (
              <ModuleCard key={module.id} module={module} index={index} />
            ))}
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
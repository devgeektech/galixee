"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useHandleStreamResponse } from "../../utilities/runtime-helpers";
import { useUser } from "../../components/use-user";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [streamingResponse, setStreamingResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStreamResponse = useHandleStreamResponse({
    onChunk: setStreamingResponse,
    onFinish: () => setLoading(false),
  });

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
  }, [user, userLoading]);

  const lifeSkillsCategories = [
    {
      title: "Financial Management",
      icon: "fa-wallet",
      color: "from-[#6366F1] to-[#4FD1C5]",
      skills: [
        {
          name: "Financial Planning",
          description: "Learn the basics of creating a financial plan",
          href: "/financial-planning-course",
        },
        {
          name: "Investment Basics",
          description: "Understanding stocks, bonds, and investment options",
        },
        {
          name: "Credit Score Management",
          description: "How credit scores work and how to improve them",
        },
        {
          name: "Budgeting Essentials",
          description: "Creating and maintaining a personal budget",
        },
        {
          name: "Understanding Interest Rates",
          description: "How interest rates affect loans and savings",
        },
      ],
    },
    {
      title: "Vehicle & Insurance",
      icon: "fa-car",
      color: "from-[#4FD1C5] to-[#6366F1]",
      skills: [
        {
          name: "Car Buying Guide",
          description: "Steps to purchase a car with credit or lease",
        },
        {
          name: "Auto Insurance Basics",
          description: "Understanding and choosing auto insurance",
        },
        {
          name: "Home Insurance Guide",
          description: "How to select and purchase home insurance",
        },
        {
          name: "Vehicle Maintenance",
          description: "Basic car maintenance and care tips",
        },
      ],
    },
    {
      title: "Education & Career",
      icon: "fa-graduation-cap",
      color: "from-[#FF6B6B] to-[#6366F1]",
      skills: [
        {
          name: "College Application Process",
          description: "Step-by-step guide to college applications",
        },
        {
          name: "Job Application Tips",
          description: "How to fill out job applications effectively",
        },
        {
          name: "Interview Preparation",
          description: "Dressing, acting, and responding in interviews",
        },
        {
          name: "Resume Writing",
          description: "Creating an effective resume",
        },
        {
          name: "Professional Communication",
          description: "Email and workplace communication skills",
        },
      ],
    },
    {
      title: "Life Management",
      icon: "fa-house",
      color: "from-[#6366F1] to-[#FF6B6B]",
      skills: [
        {
          name: "Time Management",
          description: "Organizing and prioritizing your time",
        },
        {
          name: "Healthy Living",
          description: "Basic nutrition and exercise guidelines",
        },
        {
          name: "Home Organization",
          description: "Keeping your living space organized",
        },
        {
          name: "Basic Home Repairs",
          description: "Simple home maintenance and repairs",
        },
        {
          name: "Emergency Preparedness",
          description: "Planning for unexpected situations",
        },
      ],
    },
  ];

  const handleSkillClick = async (skill) => {
    if (skill.href) {
      window.location.href = skill.href;
      return;
    }

    setSelectedSkill(skill);
    setLoading(true);
    setStreamingResponse("");
    setError(null);

    try {
      const response = await fetch("/integrations/chat-gpt/conversationgpt4", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "You are a knowledgeable instructor teaching practical life skills. Provide clear, actionable advice with specific steps and examples. Format your response with clear sections and bullet points where appropriate.",
            },
            {
              role: "user",
              content: `Teach me about ${skill.name}. Focus on practical advice and include:
              1. A brief introduction to why this skill is important
              2. Key concepts to understand
              3. Step-by-step guidance or actionable tips
              4. Common mistakes to avoid
              5. Additional resources or next steps for learning more`,
            },
          ],
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Failed to get skill information");
      handleStreamResponse(response);
    } catch (err) {
      setError("Could not load skill information");
      setLoading(false);
      console.error(err);
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
          Life Skills Training
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {lifeSkillsCategories.map((category) => (
            <div
              key={category.title}
              className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6"
            >
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-lg bg-[#242424] flex items-center justify-center">
                  <i
                    className={`fas ${category.icon} text-2xl bg-gradient-to-r ${category.color} bg-clip-text text-transparent`}
                  ></i>
                </div>
                <h2 className="text-2xl font-bold ml-3">{category.title}</h2>
              </div>
              <div className="space-y-3">
                {category.skills.map((skill) => (
                  <button
                    key={skill.name}
                    onClick={() => handleSkillClick(skill)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedSkill?.name === skill.name
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#242424] hover:bg-[#333333] text-gray-300 hover:text-white"
                    }`}
                  >
                    <div className="font-semibold">{skill.name}</div>
                    <div className="text-sm text-gray-400">
                      {skill.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {selectedSkill && (
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-4">{selectedSkill.name}</h3>
            {loading && !streamingResponse && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6366F1]"></div>
              </div>
            )}
            {error ? (
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                {error}
              </div>
            ) : (
              <div className="prose prose-invert max-w-none">
                <div className="text-gray-300 whitespace-pre-line">
                  {streamingResponse || (
                    <div className="text-gray-400">Loading content...</div>
                  )}
                </div>
              </div>
            )}
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
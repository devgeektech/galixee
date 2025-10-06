"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({ page = "default", onAdClick = () => {} }) {
  // External advertiser ads that appear on all pages
  const externalAds = [
    {
      id: "ext_1",
      title: "Real Estate Commander",
      description: "Master your real estate investments",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "https://www.realestatecommander.com",
      backgroundColor: "#2563EB",
      isExternal: true,
    },
    {
      id: "ext_2",
      title: "Wing & Collar",
      description:
        "Modern rank for the modern pilot - Magnetic collar bars that fly with you",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "https://www.wingandcollar.com",
      backgroundColor: "#1E3A8A",
      isExternal: true,
    },
  ];

  const adConfigs = {
    welcome: [
      ...externalAds,
      {
        id: 1,
        title: "Complete Your Profile",
        description: "Build your digital identity in the FOREVERVERSE",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/profile",
        backgroundColor: "#6366F1",
      },
      {
        id: 2,
        title: "Digital Vault",
        description: "Secure your important documents forever",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/digital-vault",
        backgroundColor: "#4FD1C5",
      },
    ],
    profile: [
      ...externalAds,
      {
        id: 4,
        title: "Health & Wellbeing",
        description: "Track your wellness journey",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/health-and-wellbeing",
        backgroundColor: "#10B981",
      },
      {
        id: 5,
        title: "Education History",
        description: "Document your learning achievements",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/education-history",
        backgroundColor: "#8B5CF6",
      },
    ],
    health: [
      ...externalAds,
      {
        id: 7,
        title: "DNA Services",
        description: "Unlock your genetic story",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/dna-services",
        backgroundColor: "#EF4444",
      },
      {
        id: 8,
        title: "End of Life Planning",
        description: "Plan for your eternal legacy",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/end-of-life-planning",
        backgroundColor: "#6B7280",
      },
    ],
    education: [
      ...externalAds,
      {
        id: 10,
        title: "Financial Planning Course",
        description: "Master your cosmic finances",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/financial-planning-course",
        backgroundColor: "#DC2626",
      },
      {
        id: 11,
        title: "Life Skills Academy",
        description: "Essential skills for the FOREVERVERSE",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/life-skills",
        backgroundColor: "#7C3AED",
      },
    ],
    employment: [
      ...externalAds,
      {
        id: 13,
        title: "IP Protection Guide",
        description: "Protect your creative works",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/ip-protection",
        backgroundColor: "#7C2D12",
      },
      {
        id: 14,
        title: "My Creations",
        description: "Showcase your professional portfolio",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/my-creations",
        backgroundColor: "#BE185D",
      },
    ],
    entertainment: [
      ...externalAds,
      {
        id: 16,
        title: "Mission Into Space",
        description: "Embark on your cosmic adventure",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/mission-into-space",
        backgroundColor: "#1E1B4B",
      },
      {
        id: 17,
        title: "Talk With Me",
        description: "AI conversations in the FOREVERVERSE",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/talk-with-me",
        backgroundColor: "#581C87",
      },
    ],
    media: [
      ...externalAds,
      {
        id: 19,
        title: "My Journal",
        description: "Chronicle your cosmic journey",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/my-journal",
        backgroundColor: "#92400E",
      },
      {
        id: 20,
        title: "Pictures & Videos",
        description: "Preserve your memories forever",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/pictures",
        backgroundColor: "#7C2D12",
      },
    ],
    social: [
      ...externalAds,
      {
        id: 22,
        title: "Social Media Hub",
        description: "Connect across the cosmos",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/social-media",
        backgroundColor: "#1DA1F2",
      },
      {
        id: 23,
        title: "Message Scheduler",
        description: "Send messages across time",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/message-scheduler",
        backgroundColor: "#25D366",
      },
    ],
    default: [
      ...externalAds,
      {
        id: 25,
        title: "Explore Galixee Premium",
        description: "Unlock unlimited cosmic potential",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/subscription",
        backgroundColor: "#6366F1",
      },
      {
        id: 26,
        title: "Weather Favorites",
        description: "Track cosmic weather patterns",
        imageUrl: "/api/placeholder/728/90",
        mobileImageUrl: "/api/placeholder/320/50",
        clickUrl: "/weather",
        backgroundColor: "#0EA5E9",
      },
    ],
  };

  const getAdsForPage = (pageName) => {
    return adConfigs[pageName] || adConfigs.default;
  };

  const handleAdClick = (ad) => {
    onAdClick(ad);
  };

  const currentAds = getAdsForPage(page);

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 font-roboto">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">
          Ad Configuration: {page}
        </h3>
        <p className="text-gray-400 text-sm">
          {currentAds.length} advertisements configured for this page
        </p>
      </div>

      <div className="space-y-3">
        {currentAds.map((ad) => (
          <div
            key={ad.id}
            className="bg-[#242424] border border-[#333333] rounded-lg p-4 cursor-pointer hover:bg-[#2A2A2A] transition-colors"
            onClick={() => handleAdClick(ad)}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{ backgroundColor: ad.backgroundColor }}
                  ></div>
                  <h4 className="text-white font-medium">{ad.title}</h4>
                  {ad.isExternal && (
                    <span className="ml-2 px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                      SPONSOR
                    </span>
                  )}
                  {ad.clickUrl.startsWith("http") && (
                    <i className="fas fa-external-link-alt text-gray-400 text-xs ml-2"></i>
                  )}
                </div>
                <p className="text-gray-400 text-sm mb-2">{ad.description}</p>
                <div className="flex items-center text-xs text-gray-500">
                  <i className="fas fa-link mr-1"></i>
                  <span className="truncate">{ad.clickUrl}</span>
                </div>
              </div>
              <div className="ml-4 text-gray-400">
                <i className="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-[#333333]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-[#242424] p-3 rounded-lg">
            <div className="text-[#6366F1] font-medium mb-1">Internal Ads</div>
            <div className="text-white">
              {
                currentAds.filter((ad) => !ad.clickUrl.startsWith("http"))
                  .length
              }
            </div>
          </div>
          <div className="bg-[#242424] p-3 rounded-lg">
            <div className="text-[#4FD1C5] font-medium mb-1">External Ads</div>
            <div className="text-white">
              {currentAds.filter((ad) => ad.clickUrl.startsWith("http")).length}
            </div>
          </div>
          <div className="bg-[#242424] p-3 rounded-lg">
            <div className="text-[#F59E0B] font-medium mb-1">Sponsors</div>
            <div className="text-white">
              {currentAds.filter((ad) => ad.isExternal).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryComponent() {
  const handleAdClick = (ad) => {
    console.log("Ad clicked:", ad);
  };

  return (
    <div className="space-y-8 bg-[#121212] min-h-screen p-4 font-roboto">
      <div className="text-white">
        <h2 className="text-2xl font-bold mb-4">AdConfig Component Variants</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Welcome Page Ads
            </h3>
            <MainComponent page="welcome" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Profile Page Ads
            </h3>
            <MainComponent page="profile" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Health Page Ads
            </h3>
            <MainComponent page="health" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Education Page Ads
            </h3>
            <MainComponent page="education" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Employment Page Ads
            </h3>
            <MainComponent page="employment" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Entertainment Page Ads
            </h3>
            <MainComponent page="entertainment" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Media Page Ads
            </h3>
            <MainComponent page="media" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Social Page Ads
            </h3>
            <MainComponent page="social" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Default Ads
            </h3>
            <MainComponent page="default" onAdClick={handleAdClick} />
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2 text-[#6366F1]">
              Unknown Page (Fallback)
            </h3>
            <MainComponent page="unknown-page" onAdClick={handleAdClick} />
          </div>
        </div>
      </div>
    </div>
  );
});
}
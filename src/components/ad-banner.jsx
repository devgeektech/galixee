"use client";
import React from "react";



export default function Index() {
  return (function MainComponent({
  ads = [],
  autoRotateInterval = 15000,
  position = "bottom",
  showControls = true,
  onAdClick = () => {},
}) {
  const [currentAdIndex, setCurrentAdIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);
  const intervalRef = React.useRef(null);

  const defaultAds = [
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

  const displayAds = defaultAds;

  const startAutoRotation = React.useCallback(() => {
    if (displayAds.length <= 1) return;

    intervalRef.current = setInterval(() => {
      setCurrentAdIndex((prevIndex) => (prevIndex + 1) % displayAds.length);
    }, autoRotateInterval);
  }, [displayAds.length, autoRotateInterval]);

  const stopAutoRotation = React.useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    startAutoRotation();
    return () => stopAutoRotation();
  }, [startAutoRotation, stopAutoRotation]);

  const handleAdClick = (ad) => {
    onAdClick(ad);
    if (ad.clickUrl) {
      if (ad.clickUrl.startsWith("http")) {
        window.open(ad.clickUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = ad.clickUrl;
      }
    }
  };

  const handlePrevious = () => {
    stopAutoRotation();
    setCurrentAdIndex((prevIndex) =>
      prevIndex === 0 ? displayAds.length - 1 : prevIndex - 1,
    );
    setTimeout(startAutoRotation, 3000);
  };

  const handleNext = () => {
    stopAutoRotation();
    setCurrentAdIndex((prevIndex) => (prevIndex + 1) % displayAds.length);
    setTimeout(startAutoRotation, 3000);
  };

  const handleDotClick = (index) => {
    stopAutoRotation();
    setCurrentAdIndex(index);
    setTimeout(startAutoRotation, 3000);
  };

  if (displayAds.length === 0) {
    return null;
  }

  const currentAd = displayAds[currentAdIndex];
  const positionClasses = position === "top" ? "top-0" : "bottom-0";

  return (
    <div
      className={`fixed left-0 right-0 ${positionClasses} z-40 bg-[#1A1A1A] border-t border-[#333333] shadow-lg`}
    >
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}
        >
          {displayAds.map((ad, index) => (
            <div
              key={ad.id}
              className="w-full flex-shrink-0 cursor-pointer relative"
              onClick={() => handleAdClick(ad)}
              onMouseEnter={() => {
                stopAutoRotation();
                setIsHovered(true);
              }}
              onMouseLeave={() => {
                startAutoRotation();
                setIsHovered(false);
              }}
            >
              <div
                className="flex items-stretch h-[120px] md:h-[140px] relative"
                style={{ backgroundColor: ad.backgroundColor || "#1A1A1A" }}
              >
                {/* Image Half - Left Side - Exactly 50% */}
                <div className="w-1/2 flex items-center justify-center p-4 border-r border-white/10">
                  <img
                    src={
                      window.innerWidth >= 768
                        ? ad.imageUrl
                        : ad.mobileImageUrl || ad.imageUrl
                    }
                    alt={ad.title}
                    className="h-full w-full object-contain rounded-lg"
                    loading="lazy"
                  />
                </div>

                {/* Text Half - Right Side - Exactly 50% */}
                <div className="w-1/2 flex flex-col justify-center text-white p-4 md:p-6">
                  <h3 className="font-bold text-lg md:text-xl mb-2 leading-tight">
                    {ad.title}
                  </h3>
                  <p className="text-gray-300 text-sm md:text-base mb-4 leading-relaxed">
                    {ad.description}
                  </p>
                  <div>
                    <span className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-colors inline-block">
                      Visit Site →
                    </span>
                  </div>
                </div>

                {/* Enhanced hover effect */}
                {isHovered && index === currentAdIndex && (
                  <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-black/10 transition-opacity duration-300 pointer-events-none"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {showControls && displayAds.length > 1 && (
          <>
            <button
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Previous ad"
            >
              <i className="fas fa-chevron-left text-sm"></i>
            </button>

            <button
              onClick={handleNext}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              aria-label="Next ad"
            >
              <i className="fas fa-chevron-right text-sm"></i>
            </button>

            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {displayAds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentAdIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
})

function StoryComponent() {
  const sampleAds = [
    {
      id: 1,
      title: "Premium Subscription",
      description: "Unlock all features with Galixee Premium",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "/subscription",
      backgroundColor: "#6366F1",
    },
    {
      id: 2,
      title: "Digital Vault",
      description: "Secure your important documents",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "/digital-vault",
      backgroundColor: "#4FD1C5",
    },
    {
      id: 3,
      title: "Family Tree",
      description: "Build your family history",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "/family-tree",
      backgroundColor: "#FF6B6B",
    },
  ];

  const externalAds = [
    {
      id: 4,
      title: "External Partner",
      description: "Visit our partner site",
      imageUrl: "/api/placeholder/728/90",
      mobileImageUrl: "/api/placeholder/320/50",
      clickUrl: "https://example.com",
      backgroundColor: "#8B5CF6",
    },
  ];

  return (
    <div className="space-y-8 bg-[#121212] min-h-screen p-4">
      <div className="text-white font-roboto">
        <h2 className="text-2xl font-bold mb-4">Ad Banner Variants</h2>

        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-medium mb-2">
              Default Banner (Bottom Position)
            </h3>
            <div className="relative bg-gray-800 h-64 rounded-lg overflow-hidden">
              <p className="text-center pt-20 text-gray-400">
                Page content area
              </p>
              <MainComponent ads={sampleAds} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Top Position Banner</h3>
            <div className="relative bg-gray-800 h-64 rounded-lg overflow-hidden">
              <MainComponent ads={sampleAds} position="top" />
              <p className="text-center pt-20 text-gray-400">
                Page content area
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Single Ad (No Controls)
            </h3>
            <div className="relative bg-gray-800 h-64 rounded-lg overflow-hidden">
              <p className="text-center pt-20 text-gray-400">
                Page content area
              </p>
              <MainComponent ads={[sampleAds[0]]} showControls={false} />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">External Link Ad</h3>
            <div className="relative bg-gray-800 h-64 rounded-lg overflow-hidden">
              <p className="text-center pt-20 text-gray-400">
                Page content area
              </p>
              <MainComponent
                ads={externalAds}
                onAdClick={(ad) => console.log("Ad clicked:", ad)}
              />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">
              Fast Rotation (3 seconds)
            </h3>
            <div className="relative bg-gray-800 h-64 rounded-lg overflow-hidden">
              <p className="text-center pt-20 text-gray-400">
                Page content area
              </p>
              <MainComponent ads={sampleAds} autoRotateInterval={3000} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
}
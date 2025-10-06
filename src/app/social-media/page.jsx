"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const platforms = [
    { id: "Facebook", name: "Facebook", icon: "fa-facebook" },
    { id: "Instagram", name: "Instagram", icon: "fa-instagram" },
    { id: "TikTok", name: "TikTok", icon: "fa-tiktok" },
    { id: "LinkedIn", name: "LinkedIn", icon: "fa-linkedin" },
    { id: "X", name: "X (Twitter)", icon: "fa-x-twitter" },
    { id: "YouTube", name: "YouTube", icon: "fa-youtube" },
    { id: "Snapchat", name: "Snapchat", icon: "fa-snapchat" },
    { id: "Pinterest", name: "Pinterest", icon: "fa-pinterest" },
    { id: "Twitch", name: "Twitch", icon: "fa-twitch" },
    { id: "TruthSocial", name: "Truth Social", icon: "fa-flag-usa" },
    { id: "WhatsApp", name: "WhatsApp", icon: "fa-whatsapp" },
    { id: "Reddit", name: "Reddit", icon: "fa-reddit" },
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
    fetchLinks();
  }, [user, userLoading]);

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch social media links");
      }

      const result = await response.json();
      setLinks(result.links || []);
    } catch (err) {
      setError("Could not load social media links");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch("/api/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save social media link");
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      await fetchLinks();
      setIsAddingLink(false);
      setEditingLink(null);
      setSuccessMessage("Social media link saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (platform) => {
    if (!confirm("Are you sure you want to delete this social media link?")) {
      return;
    }

    try {
      const response = await fetch("/api/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          platform,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete social media link");
      }

      await fetchLinks();
      setSuccessMessage("Social media link deleted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const SocialMediaForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
      platform: initialData?.platform || "",
      url: initialData?.url || "",
      username: initialData?.username || "",
    });

    const [urlError, setUrlError] = useState("");

    const validateUrl = (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!validateUrl(formData.url)) {
        setUrlError("Please enter a valid URL");
        return;
      }
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-white">
            {initialData ? "Edit Social Media Link" : "Add Social Media Link"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Platform
              </label>
              <select
                name="platform"
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="">Select Platform</option>
                {platforms.map((platform) => (
                  <option key={platform.id} value={platform.id}>
                    {platform.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL
              </label>
              <input
                type="url"
                name="url"
                value={formData.url}
                onChange={(e) => {
                  setFormData({ ...formData, url: e.target.value });
                  setUrlError("");
                }}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              />
              {urlError && (
                <p className="text-red-400 text-sm mt-1">{urlError}</p>
              )}
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
              >
                {initialData ? "Save Changes" : "Add Link"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Social Media Links
          </h1>
          <button
            onClick={() => setIsAddingLink(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>Add Link</span>
          </button>
        </div>

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

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : links.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No social media links added yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {links.map((link) => (
              <div
                key={link.platform}
                className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <i
                      className={`fab ${
                        platforms.find((p) => p.id === link.platform)?.icon
                      } text-2xl text-[#6366F1] mr-3`}
                    ></i>
                    <div>
                      <h3 className="text-xl font-bold text-white">
                        {platforms.find((p) => p.id === link.platform)?.name}
                      </h3>
                      {link.username && (
                        <p className="text-gray-400">{link.username}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingLink(link)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(link.platform)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#6366F1] hover:text-[#4F46E5] transition-colors break-all"
                >
                  {link.url}
                </a>
              </div>
            ))}
          </div>
        )}

        {(isAddingLink || editingLink) && (
          <SocialMediaForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsAddingLink(false);
              setEditingLink(null);
            }}
            initialData={editingLink}
          />
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
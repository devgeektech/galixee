"use client";
import useUser from "@/components/use-user";
import React, { useState ,useEffect} from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message:
      "This service sounds amazing. Please keep me updated on when this service will become available.",
    preferred_contact: "email",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
    }
  }, [user, userLoading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/space-mission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "POST",
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit request");
      }

      setSuccess(true);
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        preferred_contact: "email",
      });
    } catch (err) {
      setError("Failed to submit your request. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Don't update message field even if someone tries to change it
    if (name === "message") return;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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

      <main className="pt-24 px-6 pb-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
              Space Memorial Service
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Honor your loved ones among the stars with our unique space
              memorial service
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <div className="text-[#6366F1]">
                <i className="fas fa-rocket text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold">Journey to the Stars</h3>
              <p className="text-gray-400">
                We launch a symbolic portion of your loved one's ashes into
                space, creating a lasting memorial in the cosmos.
              </p>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 space-y-4">
              <div className="text-[#4FD1C5]">
                <i className="fas fa-satellite text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold">Eternal Orbit</h3>
              <p className="text-gray-400">
                Your loved one's memorial will orbit Earth for years to come,
                visible from anywhere on the planet.
              </p>
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-2 text-center">
              Request Information
            </h2>
            <p className="text-sm text-gray-400 mb-6 text-center">
              Fields marked with an asterisk (*) are required
            </p>

            {success && (
              <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
                Thank you for your interest. We'll contact you soon with more
                information.
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Preferred Contact Method
                </label>
                <select
                  name="preferred_contact"
                  value={formData.preferred_contact}
                  onChange={handleInputChange}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  readOnly
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px] cursor-not-allowed opacity-75"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Request Information"}
              </button>
            </form>
          </div>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#6366F1] rounded-full filter blur-[100px] animate-pulse"></div>
      </div>
    </div>
  );
}

export default MainComponent;
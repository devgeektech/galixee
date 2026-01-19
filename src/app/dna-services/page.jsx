"use client";
export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from "react";

import { useUser } from "../../components/use-user";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [dnaServices, setDnaServices] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [isAddingField, setIsAddingField] = useState(false);
  const [newField, setNewField] = useState({ name: "", value: "" });

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchDnaData();
  }, [user, userLoading]);

  const fetchDnaData = async () => {
    try {
      const response = await fetch("/api/dna-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) throw new Error("Failed to fetch DNA data");

      const data = await response.json();
      setDnaServices(data.services || []);
      setCustomFields(data.customFields || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching DNA data:", err);
      setError("Could not load DNA information");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (service) => {
    try {
      const response = await fetch("/api/dna-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "CONNECT",
          service: service,
        }),
      });

      if (!response.ok) throw new Error(`Failed to connect to ${service}`);

      await fetchDnaData();
      setSuccessMessage(`Successfully connected to ${service}`);
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(`Could not connect to ${service}`);
    }
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/dna-services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "ADD_FIELD",
          field: newField,
        }),
      });

      if (!response.ok) throw new Error("Failed to save field");

      setCustomFields([...customFields, newField]);
      setNewField({ name: "", value: "" });
      setIsAddingField(false);
      setSuccessMessage("Field saved successfully");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Could not save field");
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
          DNA Services
        </h1>

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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Connect DNA Services
            </h2>
            <div className="grid gap-4">
              {["23andMe", "AncestryDNA", "MyHeritage"].map((service) => (
                <button
                  key={service}
                  onClick={() => handleConnect(service)}
                  className="flex items-center justify-between p-4 bg-[#242424] rounded-lg border border-[#333333] hover:border-[#6366F1] transition-colors"
                >
                  <span className="text-white">{service}</span>
                  <i className="fas fa-plug text-[#6366F1]"></i>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6366F1]">
                Custom DNA Information
              </h2>
              <button
                onClick={() => setIsAddingField(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Field
              </button>
            </div>

            {isAddingField && (
              <form onSubmit={handleSaveField} className="mb-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Field Name
                  </label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) =>
                      setNewField({ ...newField, name: e.target.value })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Value
                  </label>
                  <input
                    type="text"
                    value={newField.value}
                    onChange={(e) =>
                      setNewField({ ...newField, value: e.target.value })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsAddingField(false)}
                    className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    Save Field
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : customFields.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No custom fields added
              </div>
            ) : (
              <div className="space-y-4">
                {customFields.map((field, index) => (
                  <div
                    key={index}
                    className="bg-[#242424] p-4 rounded-lg border border-[#333333]"
                  >
                    <div className="font-medium text-white mb-1">
                      {field.name}
                    </div>
                    <div className="text-gray-400">{field.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
            Connected Services
          </h2>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : dnaServices.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No services connected
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dnaServices.map((service, index) => (
                <div
                  key={index}
                  className="bg-[#242424] p-6 rounded-lg border border-[#333333]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">
                      {service.name}
                    </h3>
                    <div className="text-green-400">
                      <i className="fas fa-check-circle"></i>
                    </div>
                  </div>
                  <p className="text-gray-400">
                    Connected:{" "}
                    {new Date(service.connectedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
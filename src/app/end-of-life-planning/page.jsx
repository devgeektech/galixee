"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("checklist");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planningData, setPlanningData] = useState({
    checklist: [],
    executors: [],
    assets: [],
  });
  const [isAddingExecutor, setIsAddingExecutor] = useState(false);
  const [isAddingAsset, setIsAddingAsset] = useState(false);

  const checklistCategories = [
    {
      name: "Legal Documents",
      items: [
        "Last Will and Testament",
        "Living Trust",
        "Power of Attorney",
        "Healthcare Directive",
        "Life Insurance Policy",
      ],
    },
    {
      name: "Asset Information",
      items: [
        "Bank Accounts",
        "Investment Accounts",
        "Real Estate Deeds",
        "Vehicle Titles",
        "Valuable Personal Property",
      ],
    },
    {
      name: "Digital Assets",
      items: [
        "Email Accounts",
        "Social Media Accounts",
        "Online Banking",
        "Cryptocurrency",
        "Digital Storage",
      ],
    },
    {
      name: "Personal Arrangements",
      items: [
        "Funeral Arrangements",
        "Burial/Cremation Preferences",
        "Memorial Service Plans",
        "Obituary Preferences",
        "Final Messages",
      ],
    },
  ];

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
    fetchPlanningData();
  }, [user, userLoading]);

  const fetchPlanningData = async () => {
    try {
      const [checklistRes, executorsRes, assetsRes] = await Promise.all([
        fetch("/api/end-of-life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", action: "checklist" }),
        }),
        fetch("/api/end-of-life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", action: "executors" }),
        }),
        fetch("/api/end-of-life", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method: "GET", action: "assets" }),
        }),
      ]);

      const [checklist, executors, assets] = await Promise.all([
        checklistRes.json(),
        executorsRes.json(),
        assetsRes.json(),
      ]);

      setPlanningData({
        checklist: checklist.checklist || [],
        executors: executors.executors || [],
        assets: assets.assets || [],
      });
      setError(null);
    } catch (err) {
      setError("Could not load planning data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateChecklistItem = async (id, status, itemName, category) => {
    try {
      const response = await fetch("/api/end-of-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          action: "updateChecklistItem",
          data: {
            id,
            status,
            item_name: itemName,
            category: category,
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to update checklist item");

      await fetchPlanningData();
      setSuccess("Checklist updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Could not update checklist item");
      console.error(err);
    }
  };

  const handleSaveExecutor = async (executorData) => {
    try {
      const response = await fetch("/api/end-of-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          action: "saveExecutor",
          data: executorData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save executor");

      await fetchPlanningData();
      setIsAddingExecutor(false);
      setSuccess("Executor saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Could not save executor");
      console.error(err);
    }
  };

  const handleSaveAsset = async (assetData) => {
    try {
      const response = await fetch("/api/end-of-life", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          action: "saveAsset",
          data: assetData,
        }),
      });

      if (!response.ok) throw new Error("Failed to save asset");

      await fetchPlanningData();
      setIsAddingAsset(false);
      setSuccess("Asset saved successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Could not save asset");
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
        <h1 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
          End of Life Planning
        </h1>

        <div className="mb-8 bg-[#1A1A1A] border border-[#333333] p-4 rounded-lg flex items-start space-x-3">
          <i className="fas fa-info-circle text-[#6366F1] mt-1"></i>
          <div>
            <p className="text-gray-300">
              Remember to store important documents securely in your{" "}
              <a
                href="/digital-vault"
                className="text-[#6366F1] hover:text-[#4F46E5] transition-colors"
              >
                Digital Vault
              </a>
              . You can upload and organize wills, trusts, insurance policies,
              and other critical documents there for safekeeping.
            </p>
          </div>
        </div>

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setActiveTab("checklist")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "checklist"
                ? "bg-[#6366F1] text-white"
                : "bg-[#242424] text-gray-300 hover:text-white"
            }`}
          >
            Checklist
          </button>
          <button
            onClick={() => setActiveTab("executors")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "executors"
                ? "bg-[#6366F1] text-white"
                : "bg-[#242424] text-gray-300 hover:text-white"
            }`}
          >
            Executors
          </button>
          <button
            onClick={() => setActiveTab("assets")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === "assets"
                ? "bg-[#6366F1] text-white"
                : "bg-[#242424] text-gray-300 hover:text-white"
            }`}
          >
            Assets
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-[#6366F1] mb-4"></i>
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : (
          <div>
            {activeTab === "checklist" && (
              <div className="space-y-8">
                {checklistCategories.map((category) => (
                  <div
                    key={category.name}
                    className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6"
                  >
                    <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
                      {category.name}
                    </h2>
                    <div className="space-y-4">
                      {category.items.map((item) => {
                        const checklistItem = planningData.checklist.find(
                          (i) => i.item_name === item
                        );
                        return (
                          <div
                            key={item}
                            className="flex items-center justify-between p-4 bg-[#242424] rounded-lg"
                          >
                            <span className="text-white">{item}</span>
                            <select
                              value={checklistItem?.status || "pending"}
                              onChange={(e) =>
                                updateChecklistItem(
                                  checklistItem?.id,
                                  e.target.value,
                                  item,
                                  category.name
                                )
                              }
                              className="bg-[#333333] text-white rounded-lg px-3 py-1"
                            >
                              <option value="pending">Pending</option>
                              <option value="in_progress">In Progress</option>
                              <option value="completed">Completed</option>
                              <option value="not_applicable">
                                Not Applicable
                              </option>
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "executors" && (
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#6366F1]">
                    Executor Information
                  </h2>
                  <button
                    onClick={() => setIsAddingExecutor(true)}
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Executor
                  </button>
                </div>

                <div className="grid gap-6">
                  {planningData.executors.map((executor) => (
                    <div
                      key={executor.id}
                      className="bg-[#242424] p-6 rounded-lg"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {executor.name}
                          </h3>
                          <p className="text-gray-400">
                            {executor.relationship}
                          </p>
                        </div>
                        {executor.is_primary && (
                          <span className="bg-[#6366F1]/20 text-[#6366F1] px-3 py-1 rounded-full text-sm">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="space-y-2 text-gray-300">
                        <p>
                          <i className="fas fa-envelope mr-2 text-[#6366F1]"></i>
                          {executor.email}
                        </p>
                        <p>
                          <i className="fas fa-phone mr-2 text-[#6366F1]"></i>
                          {executor.phone}
                        </p>
                        <p>
                          <i className="fas fa-location-dot mr-2 text-[#6366F1]"></i>
                          {executor.address}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "assets" && (
              <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-[#6366F1]">
                    Estate Assets
                  </h2>
                  <button
                    onClick={() => setIsAddingAsset(true)}
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Add Asset
                  </button>
                </div>

                <div className="grid gap-6">
                  {planningData.assets.map((asset) => (
                    <div key={asset.id} className="bg-[#242424] p-6 rounded-lg">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-2">
                            {asset.asset_name}
                          </h3>
                          <p className="text-gray-400">{asset.asset_type}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[#6366F1] font-bold">
                            ${asset.estimated_value.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2 text-gray-300">
                        <p>{asset.description}</p>
                        <p>
                          <i className="fas fa-location-dot mr-2 text-[#6366F1]"></i>
                          {asset.location}
                        </p>
                        <p>
                          <i className="fas fa-user mr-2 text-[#6366F1]"></i>
                          Beneficiary: {asset.beneficiary}
                        </p>
                        {asset.document_url && (
                          <a
                            href={asset.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#6366F1] hover:text-[#4F46E5] transition-colors"
                          >
                            <i className="fas fa-file-alt mr-2"></i>
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {isAddingExecutor && (
        <ExecutorForm
          onSubmit={handleSaveExecutor}
          onCancel={() => setIsAddingExecutor(false)}
        />
      )}

      {isAddingAsset && (
        <AssetForm
          onSubmit={handleSaveAsset}
          onCancel={() => setIsAddingAsset(false)}
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

const ExecutorForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    relationship: "",
    email: "",
    phone: "",
    address: "",
    is_primary: false,
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-white">Add Executor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Relationship
            </label>
            <input
              type="text"
              value={formData.relationship}
              onChange={(e) =>
                setFormData({ ...formData, relationship: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              rows="3"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) =>
                setFormData({ ...formData, is_primary: e.target.checked })
              }
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-300">
              Primary Executor
            </label>
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
            >
              Save Executor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AssetForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    asset_type: "",
    asset_name: "",
    description: "",
    estimated_value: "",
    location: "",
    beneficiary: "",
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      estimated_value: parseFloat(formData.estimated_value) || 0,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-white">Add Asset</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Type
            </label>
            <select
              value={formData.asset_type}
              onChange={(e) =>
                setFormData({ ...formData, asset_type: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              required
            >
              <option value="">Select Type</option>
              <option value="real_estate">Real Estate</option>
              <option value="vehicle">Vehicle</option>
              <option value="financial">Financial Account</option>
              <option value="personal">Personal Property</option>
              <option value="business">Business Interest</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Asset Name
            </label>
            <input
              type="text"
              value={formData.asset_name}
              onChange={(e) =>
                setFormData({ ...formData, asset_name: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              rows="3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Estimated Value ($)
            </label>
            <input
              type="number"
              value={formData.estimated_value}
              onChange={(e) =>
                setFormData({ ...formData, estimated_value: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Beneficiary
            </label>
            <input
              type="text"
              value={formData.beneficiary}
              onChange={(e) =>
                setFormData({ ...formData, beneficiary: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            />
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
            >
              Save Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MainComponent;
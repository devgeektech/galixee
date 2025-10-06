"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [educationData, setEducationData] = useState({
    elementary: [],
    junior_high: [],
    high_school: [],
    college: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState("elementary");
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const educationLevels = {
    elementary: { title: "Elementary School", icon: "fa-child" },
    junior_high: { title: "Junior High School", icon: "fa-graduation-cap" },
    high_school: { title: "High School", icon: "fa-school" },
    college: { title: "College/University", icon: "fa-university" },
  };

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    if (user) {
      fetchEducationData();
    }
  }, [user, userLoading]);

  const fetchEducationData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch education data");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      // Group the flat array by school_type
      const grouped = {
        elementary: [],
        junior_high: [],
        high_school: [],
        college: [],
      };

      if (result.data && Array.isArray(result.data)) {
        result.data.forEach((record) => {
          if (grouped[record.school_type]) {
            grouped[record.school_type].push(record);
          }
        });
      }

      setEducationData(grouped);
      setError(null);
    } catch (err) {
      console.error("Error fetching education data:", err);
      setError("Failed to load education data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEntry = async (entryData) => {
    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: editingEntry ? "PUT" : "POST",
          id: editingEntry?.id,
          school_type: activeSection,
          school_name: entryData.school_name,
          city: entryData.location?.split(",")[0]?.trim() || "",
          state: entryData.location?.split(",")[1]?.trim() || "",
          years_attended: `${entryData.start_year}${
            entryData.end_year ? `-${entryData.end_year}` : "-Present"
          }`,
          comments: entryData.comments,
          year_graduated: entryData.end_year,
          degree_type: entryData.degree,
          degree_discipline: "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save education entry");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      await fetchEducationData();
      setIsAddingEntry(false);
      setEditingEntry(null);
      setError(null);
    } catch (err) {
      console.error("Error saving education entry:", err);
      setError("Failed to save education entry: " + err.message);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (
      !window.confirm("Are you sure you want to delete this education entry?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          id: entryId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete education entry");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      await fetchEducationData();
      setError(null);
    } catch (err) {
      console.error("Error deleting education entry:", err);
      setError("Failed to delete education entry: " + err.message);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white font-roboto flex items-center justify-center">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-[#6366F1] mb-4"></i>
          <p className="text-gray-400">Loading education data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
        <a href="/" className="text-2xl font-bold text-white flex items-center">
          <i className="fas fa-galaxy mr-2"></i>
          Galixee
        </a>
        <div className="flex items-center space-x-6">
          <span className="text-[#4FD1C5] text-sm">
            TEST MODE - No Subscription Required
          </span>
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
            Education History (Test)
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your educational background and academic journey
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            <i className="fas fa-exclamation-triangle mr-2"></i>
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">
                Education Levels
              </h2>
              <div className="space-y-2">
                {Object.entries(educationLevels).map(([level, config]) => (
                  <button
                    key={level}
                    onClick={() => setActiveSection(level)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      activeSection === level
                        ? "bg-[#6366F1] text-white"
                        : "bg-[#242424] text-gray-300 hover:bg-[#2A2A2A]"
                    }`}
                  >
                    <i className={`fas ${config.icon} mr-3`}></i>
                    {config.title}
                    <span className="float-right text-sm">
                      {educationData[level]?.length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#6366F1]">
                  {educationLevels[activeSection].title}
                </h2>
                <button
                  onClick={() => setIsAddingEntry(true)}
                  className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Entry
                </button>
              </div>

              {educationData[activeSection]?.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i
                    className={`fas ${educationLevels[activeSection].icon} text-4xl mb-4`}
                  ></i>
                  <p>
                    No {educationLevels[activeSection].title.toLowerCase()}{" "}
                    entries yet
                  </p>
                  <p className="text-sm">Click "Add Entry" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {educationData[activeSection]?.map((entry) => (
                    <div key={entry.id} className="bg-[#242424] rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-lg">
                            {entry.school_name}
                          </h3>
                          <p className="text-gray-400">{entry.location}</p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                            <span>
                              <i className="fas fa-calendar mr-1"></i>
                              {entry.start_year} - {entry.end_year || "Present"}
                            </span>
                            {entry.degree && (
                              <span>
                                <i className="fas fa-graduation-cap mr-1"></i>
                                {entry.degree}
                              </span>
                            )}
                          </div>
                          {entry.comments && (
                            <p className="text-gray-300 mt-2 text-sm">
                              {entry.comments}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingEntry(entry)}
                            className="text-[#6366F1] hover:text-[#4F46E5] p-2"
                            title="Edit Entry"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            onClick={() => handleDeleteEntry(entry.id)}
                            className="text-red-400 hover:text-red-300 p-2"
                            title="Delete Entry"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {(isAddingEntry || editingEntry) && (
        <EducationEntryModal
          entry={editingEntry}
          level={activeSection}
          onSave={handleSaveEntry}
          onClose={() => {
            setIsAddingEntry(false);
            setEditingEntry(null);
          }}
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

function EducationEntryModal({ entry, level, onSave, onClose }) {
  const [formData, setFormData] = useState({
    school_name: entry?.school_name || "",
    location: entry?.location || "",
    start_year: entry?.start_year || "",
    end_year: entry?.end_year || "",
    degree: entry?.degree || "",
    comments: entry?.comments || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">
            {entry ? "Edit" : "Add"} Education Entry
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              School Name *
            </label>
            <input
              type="text"
              value={formData.school_name}
              onChange={(e) =>
                setFormData({ ...formData, school_name: e.target.value })
              }
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              required
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
              placeholder="City, State"
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Year *
              </label>
              <select
                value={formData.start_year}
                onChange={(e) =>
                  setFormData({ ...formData, start_year: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="">Select year</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Year
              </label>
              <select
                value={formData.end_year}
                onChange={(e) =>
                  setFormData({ ...formData, end_year: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              >
                <option value="">
                  Select year (or leave blank if current)
                </option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(level === "high_school" || level === "college") && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Degree/Diploma
              </label>
              <input
                type="text"
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
                placeholder={
                  level === "college"
                    ? "e.g., Bachelor of Science"
                    : "e.g., High School Diploma"
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Comments
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) =>
                setFormData({ ...formData, comments: e.target.value })
              }
              placeholder="Additional notes, achievements, etc."
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
            >
              {entry ? "Update" : "Add"} Entry
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MainComponent;
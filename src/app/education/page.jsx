"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [isAddingSchool, setIsAddingSchool] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      // Encode the current URL to redirect back here after sign in
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
    }
  }, [user, userLoading]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/education", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      setSchools(result.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching schools:", err);
      setError(`Could not load education history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !userLoading) {
      fetchSchools();
    }
  }, [user, userLoading]);

  const handleAddSchool = (type) => {
    setSelectedType(type);
    setIsAddingSchool(true);
  };

  const handleSubmit = async (formData) => {
    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "POST",
          ...formData,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      // Update schools state immediately with new school
      setSchools((prevSchools) => [...prevSchools, result.data]);
      setIsAddingSchool(false);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error adding school:", err);
      setError(err.message || "Could not add school");
    }
  };

  const SchoolForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      school_type: selectedType,
      school_name: "",
      years_attended: "",
      city: "",
      state: "",
      comments: "",
      year_graduated: "",
      degree_type: "",
      degree_discipline: "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-white">Add School</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                School Name
              </label>
              <input
                type="text"
                name="school_name"
                value={formData.school_name}
                onChange={(e) =>
                  setFormData({ ...formData, school_name: e.target.value })
                }
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Years Attended
              </label>
              <input
                type="text"
                name="years_attended"
                value={formData.years_attended}
                onChange={(e) =>
                  setFormData({ ...formData, years_attended: e.target.value })
                }
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                placeholder="e.g., 2015-2019"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
            </div>
            {selectedType === "college" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Degree Type
                  </label>
                  <select
                    name="degree_type"
                    value={formData.degree_type}
                    onChange={(e) =>
                      setFormData({ ...formData, degree_type: e.target.value })
                    }
                    className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select degree type</option>
                    <option value="Associate">Associate</option>
                    <option value="Bachelor">Bachelor</option>
                    <option value="Master">Master</option>
                    <option value="PhD">PhD</option>
                    <option value="MD">MD</option>
                    <option value="JD">JD</option>
                    <option value="Other_Doctorate">Other Doctorate</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Degree Discipline
                  </label>
                  <input
                    type="text"
                    name="degree_discipline"
                    value={formData.degree_discipline}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        degree_discipline: e.target.value,
                      })
                    }
                    className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    placeholder="e.g., Computer Science"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comments
              </label>
              <textarea
                name="comments"
                value={formData.comments}
                onChange={(e) =>
                  setFormData({ ...formData, comments: e.target.value })
                }
                className="w-full bg-[#121212] border border-[#333333] rounded-lg px-4 py-2 text-white"
                rows="3"
                placeholder="Any additional notes..."
              />
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
                Add School
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const SchoolCard = ({ school }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-2">
        {school.school_name}
      </h3>
      <p className="text-gray-400 mb-4">{school.years_attended}</p>
      <div className="space-y-2 text-gray-300">
        <p>
          {school.city}, {school.state}
        </p>
        {school.school_type === "college" && school.degree_type && (
          <p>
            {school.degree_type}{" "}
            {school.degree_discipline && `in ${school.degree_discipline}`}
          </p>
        )}
        {school.comments && (
          <p className="text-gray-400 mt-4">{school.comments}</p>
        )}
      </div>
    </div>
  );

  const renderSection = (type, title, icon) => {
    const filteredSchools = schools.filter(
      (school) => school.school_type === type
    );

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <i className={`fas ${icon} text-[#6366F1]`}></i>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
          </div>
          <button
            onClick={() => handleAddSchool(type)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>Add School</span>
          </button>
        </div>
        {filteredSchools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSchools.map((school, index) => (
              <SchoolCard key={school.id || index} school={school} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No {title.toLowerCase()} entries yet
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto">
      {userLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center py-12">Loading...</div>
        </div>
      ) : !user ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center py-12">Redirecting to login...</div>
        </div>
      ) : (
        <>
          <nav className="fixed top-0 left-0 right-0 bg-[#121212]/90 backdrop-blur-sm z-50 flex justify-between items-center p-6 border-b border-[#333333]">
            <a
              href="/"
              className="text-2xl font-bold text-white flex items-center"
            >
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
              Education History
            </h1>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : error ? (
              <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                {error}
              </div>
            ) : (
              <>
                {renderSection("elementary", "Elementary School", "fa-school")}
                {renderSection(
                  "junior_high",
                  "Junior High School",
                  "fa-school"
                )}
                {renderSection(
                  "high_school",
                  "High School",
                  "fa-graduation-cap"
                )}
                {renderSection("college", "College", "fa-university")}
              </>
            )}

            {isAddingSchool && (
              <SchoolForm
                onSubmit={handleSubmit}
                onCancel={() => setIsAddingSchool(false)}
              />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default MainComponent;
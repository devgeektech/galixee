"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [educationRecords, setEducationRecords] = useState([]);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
    }
  }, [user, userLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return "Present";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Present";

    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const fetchEducationRecords = async () => {
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

      setEducationRecords(result.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching education records:", err);
      setError(`Could not load education history: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !userLoading) {
      fetchEducationRecords();
    }
  }, [user, userLoading]);

  const handleSubmit = async (formData) => {
    try {
      const processedData = {
        ...formData,
        start_date: formData.start_date
          ? formData.start_date + "T00:00:00"
          : null,
        end_date: formData.end_date ? formData.end_date + "T00:00:00" : null,
      };

      const response = await fetch("/api/education", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: editingRecord ? "PUT" : "POST",
          id: editingRecord?.id,
          ...processedData,
        }),
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      if (editingRecord) {
        setEducationRecords((prevRecords) =>
          prevRecords.map((record) =>
            record.id === editingRecord.id ? result.data : record
          )
        );
      } else {
        setEducationRecords((prevRecords) => [...prevRecords, result.data]);
      }

      setIsAddingRecord(false);
      setEditingRecord(null);
      setError(null);
    } catch (err) {
      console.error("Error saving education record:", err);
      setError(err.message || "Could not save education record");
    }
  };

  const handleDelete = async (recordId) => {
    if (!confirm("Are you sure you want to delete this education record?")) {
      return;
    }

    try {
      const response = await fetch("/api/education", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "DELETE",
          id: recordId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete education record");
      }

      setEducationRecords((prevRecords) =>
        prevRecords.filter((record) => record.id !== recordId)
      );
    } catch (err) {
      console.error("Error deleting education record:", err);
      setError("Could not delete education record");
    }
  };

  const EducationForm = ({ onSubmit, onCancel, initialData }) => {
    const [formData, setFormData] = useState({
      institution: initialData?.institution || "",
      degree: initialData?.degree || "",
      field_of_study: initialData?.field_of_study || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      start_date: initialData?.start_date || "",
      end_date: initialData?.end_date || "",
      gpa: initialData?.gpa || "",
      description: initialData?.description || "",
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-white">
            {initialData ? "Edit Education" : "Add Education"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Institution
              </label>
              <input
                type="text"
                name="institution"
                value={formData.institution}
                onChange={(e) =>
                  setFormData({ ...formData, institution: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Degree
              </label>
              <input
                type="text"
                name="degree"
                value={formData.degree}
                onChange={(e) =>
                  setFormData({ ...formData, degree: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Field of Study
              </label>
              <input
                type="text"
                name="field_of_study"
                value={formData.field_of_study}
                onChange={(e) =>
                  setFormData({ ...formData, field_of_study: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
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
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
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
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GPA
              </label>
              <input
                type="text"
                name="gpa"
                value={formData.gpa}
                onChange={(e) =>
                  setFormData({ ...formData, gpa: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
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
                {initialData ? "Save Changes" : "Add Education"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const EducationCard = ({ record }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">
            {record.institution}
          </h3>
          <p className="text-gray-400">{record.degree}</p>
          {record.field_of_study && (
            <p className="text-gray-400">{record.field_of_study}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingRecord(record)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div className="space-y-2 text-gray-300">
        <p>
          {record.city}, {record.state}
        </p>
        <p className="text-gray-400">
          {formatDate(record.start_date)} - {formatDate(record.end_date)}
        </p>
        {record.gpa && <p className="text-gray-400">GPA: {record.gpa}</p>}
        {record.description && (
          <p className="text-gray-400 mt-4">{record.description}</p>
        )}
      </div>
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Education History
          </h1>
          <button
            onClick={() => setIsAddingRecord(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            <i className="fas fa-plus"></i>
            <span>Add Education</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        ) : educationRecords.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No education history added yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {educationRecords.map((record) => (
              <EducationCard key={record.id} record={record} />
            ))}
          </div>
        )}

        {(isAddingRecord || editingRecord) && (
          <EducationForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsAddingRecord(false);
              setEditingRecord(null);
            }}
            initialData={editingRecord}
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
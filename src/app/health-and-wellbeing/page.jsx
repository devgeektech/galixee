"use client";
import React from "react";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState(null);
  const [formData, setFormData] = useState({
    blood_type: "",
    height_feet: "",
    height_inches: "",
    weight: "",
    allergies: "",
    medications: "",
    chronic_conditions: "",
    surgeries: "",
    family_history: "",
    exercise_frequency: "",
    smoking_status: "",
    alcohol_consumption: "",
    diet_restrictions: "",
    mental_health_conditions: "",
    vision_aids: false,
    hearing_aids: false,
    mobility_aids: false,
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "",
    primary_physician: "",
    physician_phone: "",
    insurance_provider: "",
    insurance_policy_number: "",
    last_physical_date: "",
    last_dental_date: "",
    last_eye_exam_date: "",
    vaccinations: "",
    family_heart_disease: false,
    family_diabetes: false,
    family_cancer: false,
    family_mental_health: false,
    family_other_conditions: "",
    emergency_contact_1_name: "",
    emergency_contact_1_relationship: "",
    emergency_contact_1_phone: "",
    emergency_contact_2_name: "",
    emergency_contact_2_relationship: "",
    emergency_contact_2_phone: "",
    preferred_hospital: "",
  });

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    console.log("Session expired, redirecting to login");
    window.location.href = `/account/signin?callbackUrl=${encodeURIComponent(
      window.location.pathname
    )}`;
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/health-questionnaire", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          method: "POST",
          ...formData,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to save health information");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      setSuccessMessage("Health information saved successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Error saving health information:", err);
      setError(
        err.message || "Failed to save health information. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // Load existing data when component mounts
  React.useEffect(() => {
    let isMounted = true;

    const loadExistingData = async () => {
      if (userLoading) return;
      if (!user) {
        handleSessionExpired();
        return;
      }

      try {
        const response = await fetch("/api/health-questionnaire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method: "GET" }),
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            handleSessionExpired();
            return;
          }
          throw new Error(
            errorData.error || "Failed to load health information"
          );
        }

        const result = await response.json();

        if (result.data && isMounted) {
          const newFormData = {
            blood_type: result.data.blood_type || "",
            height_feet: result.data.height_feet?.toString() || "",
            height_inches: result.data.height_inches?.toString() || "",
            weight: result.data.weight?.toString() || "",
            allergies: Array.isArray(result.data.allergies)
              ? result.data.allergies.join(", ")
              : "",
            medications: Array.isArray(result.data.medications)
              ? result.data.medications.join(", ")
              : "",
            chronic_conditions: Array.isArray(result.data.chronic_conditions)
              ? result.data.chronic_conditions.join(", ")
              : "",
            surgeries: Array.isArray(result.data.surgeries)
              ? result.data.surgeries.join(", ")
              : "",
            family_history: result.data.family_history || "",
            exercise_frequency: result.data.exercise_frequency || "",
            smoking_status: result.data.smoking_status || "",
            alcohol_consumption: result.data.alcohol_consumption || "",
            diet_restrictions: Array.isArray(result.data.diet_restrictions)
              ? result.data.diet_restrictions.join(", ")
              : "",
            mental_health_conditions: Array.isArray(
              result.data.mental_health_conditions
            )
              ? result.data.mental_health_conditions.join(", ")
              : "",
            vision_aids: result.data.vision_aids === true,
            hearing_aids: result.data.hearing_aids === true,
            mobility_aids: result.data.mobility_aids === true,
            emergency_contact_name: result.data.emergency_contact_name || "",
            emergency_contact_phone: result.data.emergency_contact_phone || "",
            emergency_contact_relationship:
              result.data.emergency_contact_relationship || "",
            primary_physician: result.data.primary_physician || "",
            physician_phone: result.data.physician_phone || "",
            insurance_provider: result.data.insurance_provider || "",
            insurance_policy_number: result.data.insurance_policy_number || "",
            last_physical_date: result.data.last_physical_date || "",
            last_dental_date: result.data.last_dental_date || "",
            last_eye_exam_date: result.data.last_eye_exam_date || "",
            vaccinations: Array.isArray(result.data.vaccinations)
              ? result.data.vaccinations.join(", ")
              : "",
            family_heart_disease: result.data.family_heart_disease === true,
            family_diabetes: result.data.family_diabetes === true,
            family_cancer: result.data.family_cancer === true,
            family_mental_health: result.data.family_mental_health === true,
            family_other_conditions: result.data.family_other_conditions || "",
            emergency_contact_1_name:
              result.data.emergency_contact_1_name || "",
            emergency_contact_1_relationship:
              result.data.emergency_contact_1_relationship || "",
            emergency_contact_1_phone:
              result.data.emergency_contact_1_phone || "",
            emergency_contact_2_name:
              result.data.emergency_contact_2_name || "",
            emergency_contact_2_relationship:
              result.data.emergency_contact_2_relationship || "",
            emergency_contact_2_phone:
              result.data.emergency_contact_2_phone || "",
            preferred_hospital: result.data.preferred_hospital || "",
          };
          setFormData(newFormData);
        }
      } catch (err) {
        console.error("Error loading health information:", err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadExistingData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Loading...</div>
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

      <main className="pt-24 px-6 pb-16 max-w-3xl mx-auto">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 md:p-8">
          <h1 className="text-3xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            Health & Wellbeing Questionnaire
          </h1>

          {successMessage && (
            <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-check-circle mr-2"></i>
                {successMessage}
              </div>
              <button
                onClick={() => setSuccessMessage(null)}
                className="text-green-400 hover:text-green-300 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {typeof error === "string" ? error : error.message}
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-[#6366F1]">
                Personal Health Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">
                    Height
                  </label>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <input
                        type="number"
                        name="height_feet"
                        value={formData.height_feet}
                        onChange={handleInputChange}
                        min="0"
                        max="9"
                        placeholder="Feet"
                        className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="number"
                        name="height_inches"
                        value={formData.height_inches}
                        onChange={handleInputChange}
                        min="0"
                        max="11"
                        placeholder="Inches"
                        className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weight (lbs)
                  </label>
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Blood Type
                  </label>
                  <select
                    name="blood_type"
                    value={formData.blood_type}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  >
                    <option value="">Select Blood Type</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Allergies
                </label>
                <textarea
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleInputChange}
                  placeholder="List any allergies..."
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                />
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Medications
                </label>
                <textarea
                  name="medications"
                  value={formData.medications}
                  onChange={handleInputChange}
                  placeholder="List medications..."
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-[#6366F1]">
                Medical History
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chronic Conditions
                  </label>
                  <textarea
                    name="chronic_conditions"
                    value={formData.chronic_conditions}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Surgeries
                  </label>
                  <textarea
                    name="surgeries"
                    value={formData.surgeries}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Vaccinations
                  </label>
                  <textarea
                    name="vaccinations"
                    value={formData.vaccinations}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-[#6366F1]">
                Family History
              </h2>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="family_heart_disease"
                    checked={formData.family_heart_disease}
                    onChange={handleInputChange}
                    className="rounded border-[#333333] bg-[#242424]"
                  />
                  <label className="text-gray-300">Heart Disease</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="family_diabetes"
                    checked={formData.family_diabetes}
                    onChange={handleInputChange}
                    className="rounded border-[#333333] bg-[#242424]"
                  />
                  <label className="text-gray-300">Diabetes</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="family_cancer"
                    checked={formData.family_cancer}
                    onChange={handleInputChange}
                    className="rounded border-[#333333] bg-[#242424]"
                  />
                  <label className="text-gray-300">Cancer</label>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="family_mental_health"
                    checked={formData.family_mental_health}
                    onChange={handleInputChange}
                    className="rounded border-[#333333] bg-[#242424]"
                  />
                  <label className="text-gray-300">
                    Mental Health Conditions
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Other Conditions
                  </label>
                  <textarea
                    name="family_other_conditions"
                    value={formData.family_other_conditions}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-[#6366F1]">
                Emergency Contacts
              </h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Emergency Contact Relationship
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_relationship"
                      value={formData.emergency_contact_relationship}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_1_name"
                      value={formData.emergency_contact_1_name}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_1_relationship"
                      value={formData.emergency_contact_1_relationship}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_1_phone"
                      value={formData.emergency_contact_1_phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Secondary Contact Name
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_2_name"
                      value={formData.emergency_contact_2_name}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      name="emergency_contact_2_relationship"
                      value={formData.emergency_contact_2_relationship}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_2_phone"
                      value={formData.emergency_contact_2_phone}
                      onChange={handleInputChange}
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-[#6366F1]">
                Healthcare Providers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Primary Physician
                  </label>
                  <input
                    type="text"
                    name="primary_physician"
                    value={formData.primary_physician}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Physician Phone
                  </label>
                  <input
                    type="tel"
                    name="physician_phone"
                    value={formData.physician_phone}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Preferred Hospital
                  </label>
                  <input
                    type="text"
                    name="preferred_hospital"
                    value={formData.preferred_hospital}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    name="insurance_provider"
                    value={formData.insurance_provider}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Insurance Policy Number
                  </label>
                  <input
                    type="text"
                    name="insurance_policy_number"
                    value={formData.insurance_policy_number}
                    onChange={handleInputChange}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end space-x-4 mt-8">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Health Information"}
              </button>
            </div>
          </form>
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
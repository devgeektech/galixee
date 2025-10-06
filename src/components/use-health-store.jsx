"use client";
import React from "react";



export default function Index() {
  return (import { createWithEqualityFn } from "zustand/traditional";

const initialState = {
  formData: {
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
  },
  loading: false,
  saving: false,
  error: null,
};

const useHealthStore = createWithEqualityFn(
  (set, get) => ({
    ...initialState,

    setFormField: (field, value) =>
      set((state) => ({
        formData: {
          ...state.formData,
          [field]: value,
        },
      })),

    resetForm: () =>
      set((state) => ({
        ...state,
        formData: initialState.formData,
      })),

    loadHealthData: async () => {
      try {
        set({ loading: true, error: null });

        const response = await fetch("/api/get-health-questionnaire", {
          method: "POST",
          headers: {
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 401) {
            throw new Error("User not found. Please sign in again.");
          }
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment before trying again.",
            );
          }
          throw new Error(
            errorData.error || "Failed to load health information",
          );
        }

        const result = await response.json();

        if (result.data) {
          set({
            formData: {
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
              diet_restrictions: Array.isArray(result.data.diet_restrictions)
                ? result.data.diet_restrictions.join(", ")
                : "",
              mental_health_conditions: Array.isArray(
                result.data.mental_health_conditions,
              )
                ? result.data.mental_health_conditions.join(", ")
                : "",
              vaccinations: Array.isArray(result.data.vaccinations)
                ? result.data.vaccinations.join(", ")
                : "",
              family_history: result.data.family_history || "",
              exercise_frequency: result.data.exercise_frequency || "",
              smoking_status: result.data.smoking_status || "",
              alcohol_consumption: result.data.alcohol_consumption || "",
              vision_aids: result.data.vision_aids === true,
              hearing_aids: result.data.hearing_aids === true,
              mobility_aids: result.data.mobility_aids === true,
              emergency_contact_name: result.data.emergency_contact_name || "",
              emergency_contact_phone:
                result.data.emergency_contact_phone || "",
              emergency_contact_relationship:
                result.data.emergency_contact_relationship || "",
              primary_physician: result.data.primary_physician || "",
              physician_phone: result.data.physician_phone || "",
              insurance_provider: result.data.insurance_provider || "",
              insurance_policy_number:
                result.data.insurance_policy_number || "",
              last_physical_date: result.data.last_physical_date || "",
              last_dental_date: result.data.last_dental_date || "",
              last_eye_exam_date: result.data.last_eye_exam_date || "",
              family_heart_disease: result.data.family_heart_disease === true,
              family_diabetes: result.data.family_diabetes === true,
              family_cancer: result.data.family_cancer === true,
              family_mental_health: result.data.family_mental_health === true,
              family_other_conditions:
                result.data.family_other_conditions || "",
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
            },
            loading: false,
          });
        }
      } catch (err) {
        set({ error: err.message, loading: false });
        console.error("Error loading health data:", err);
        throw err;
      }
    },

    saveHealthData: async () => {
      try {
        set({ saving: true, error: null });
        const state = get();
        const processedData = {
          ...state.formData,
          allergies: state.formData.allergies
            ? state.formData.allergies
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          medications: state.formData.medications
            ? state.formData.medications
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          chronic_conditions: state.formData.chronic_conditions
            ? state.formData.chronic_conditions
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          surgeries: state.formData.surgeries
            ? state.formData.surgeries
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          diet_restrictions: state.formData.diet_restrictions
            ? state.formData.diet_restrictions
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          mental_health_conditions: state.formData.mental_health_conditions
            ? state.formData.mental_health_conditions
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          vaccinations: state.formData.vaccinations
            ? state.formData.vaccinations
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean)
            : [],
          height_feet: state.formData.height_feet
            ? parseInt(state.formData.height_feet, 10)
            : null,
          height_inches: state.formData.height_inches
            ? parseInt(state.formData.height_inches, 10)
            : null,
          weight: state.formData.weight
            ? parseInt(state.formData.weight, 10)
            : null,
        };

        const response = await fetch("/api/save-health-questionnaire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          body: JSON.stringify(processedData),
          credentials: "include",
        });

        if (!response.ok) {
          const result = await response.json();
          if (response.status === 401) {
            throw new Error("User not found. Please sign in again.");
          }
          if (response.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment before trying again.",
            );
          }
          throw new Error(result.error || "Failed to save health information");
        }

        set({ saving: false });
      } catch (err) {
        set({ error: err.message, saving: false });
        console.error("Error saving health data:", err);
        throw err;
      }
    },
  }),
  Object.is,
);

// Example components showing usage
function MainComponent() {
  return <div></div>;
}

function StoryComponent() {
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Health Store Demo</h2>
      <div className="space-y-4">
        <HealthStoreExample />
        <HealthStoreLoadingExample />
        <HealthStoreSavingExample />
        <HealthStoreErrorExample />
      </div>
    </div>
  );
}

function HealthStoreExample() {
  const formData = useHealthStore((state) => state.formData);
  const setFormField = useHealthStore((state) => state.setFormField);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Basic Form Interaction</h3>
      <input
        type="text"
        value={formData.blood_type}
        onChange={(e) => setFormField("blood_type", e.target.value)}
        placeholder="Blood Type"
        className="border p-2 rounded"
      />
    </div>
  );
}

function HealthStoreLoadingExample() {
  const loading = useHealthStore((state) => state.loading);
  const loadHealthData = useHealthStore((state) => state.loadHealthData);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Loading State</h3>
      <button
        onClick={loadHealthData}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Load Data"}
      </button>
    </div>
  );
}

function HealthStoreSavingExample() {
  const saving = useHealthStore((state) => state.saving);
  const saveHealthData = useHealthStore((state) => state.saveHealthData);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Saving State</h3>
      <button
        onClick={saveHealthData}
        className="bg-green-500 text-white px-4 py-2 rounded"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save Data"}
      </button>
    </div>
  );
}

function HealthStoreErrorExample() {
  const error = useHealthStore((state) => state.error);

  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Error State</h3>
      {error && <div className="text-red-500">Error: {error}</div>}
    </div>
  );
});
}
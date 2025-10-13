"use client";
import React, { useState, useEffect, useRef } from "react";
import useUser from "@/components/use-user";
import { useUpload } from "@/utilities/runtime-helpers";
function MainComponent() {
  const { data: user, loading: userLoading } = useUser({
    revalidateOnFocus: false,
    revalidateOnStorage: false,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [formData, setFormData] = useState({
    image: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    maiden_name: "",
    race: "",
    sex: "",
    birthdate: "",
    height_feet: "",
    height_inches: "",
    weight: "",
    current_city: "",
    current_state: "",
    current_country: "United States",
    birthplace_city: "",
    birthplace_state: "",
    birthplace_country: "United States",
    religious_affiliation: "",
    favorite_sports_team: "",
    favorite_color: "",
    first_vehicle: "",
    favorite_hobbies: "",
    favorite_music_genre: "",
    favorite_music_band: "",
    favorite_travel_destination: "",
  });

  // Add loading state for initial data fetch
  const [loading, setLoading] = useState(true);

  // Profile page specific ads
  const profileAds = [
    {
      id: 4,
      title: "Health & Wellbeing",
      description: "Track your wellness journey",
      imageUrl: "/images/placeholders/user1.jpg",
      mobileImageUrl: "/images/placeholders/user1.jpg",
      clickUrl: "/health-and-wellbeing",
      backgroundColor: "#10B981",
    },
    {
      id: 5,
      title: "Education History",
      description: "Document your learning achievements",
      imageUrl: "/images/placeholders/user2.jpg",
      mobileImageUrl: "/images/placeholders/user2.jpg",
      clickUrl: "/education-history",
      backgroundColor: "#8B5CF6",
    },
    {
      id: 6,
      title: "Employment History",
      description: "Build your professional legacy",
      imageUrl: "/images/placeholders/user3.jpg",
      mobileImageUrl: "/images/placeholders/user3.jpg",
      clickUrl: "/employment-history",
      backgroundColor: "#F59E0B",
    },
  ];

  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const intervalRef = useRef(null);

  const handleAdClick = (ad) => {
    console.log("Profile page ad clicked:", ad);
    if (ad.clickUrl) {
      if (ad.clickUrl.startsWith("http")) {
        window.open(ad.clickUrl, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = ad.clickUrl;
      }
    }
  };

  // Auto-rotate ads every 30 seconds
  useEffect(() => {
    if (profileAds.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentAdIndex((prevIndex) => (prevIndex + 1) % profileAds.length);
      }, 30000); // Changed to 30 seconds

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [profileAds.length]);

  // Fetch profile data on component mount and when lastUpdate changes
  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ method: "GET" }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch profile data");
        }
        const { data } = await response.json();

        if (data) {
          // Convert height back to feet and inches
          const totalInches = data.height || 0;
          const feet = Math.floor(totalInches / 12);
          const inches = totalInches % 12;

          setFormData({
            image: data.image || "",
            first_name: data.first_name || "",
            middle_name: data.middle_name || "",
            last_name: data.last_name || "",
            maiden_name: data.maiden_name || "",
            race: data.race || "",
            sex: data.sex || "",
            birthdate: data.birthdate ? data.birthdate.split("T")[0] : "",
            height_feet: feet.toString(),
            height_inches: inches.toString(),
            weight: data.weight?.toString() || "",
            current_city: data.current_city || "",
            current_state: data.current_state || "",
            current_country: data.current_country || "United States",
            birthplace_city: data.birthplace_city || "",
            birthplace_state: data.birthplace_state || "",
            birthplace_country: data.birthplace_country || "United States",
            religious_affiliation: data.religious_affiliation || "",
            favorite_sports_team: data.favorite_sports_team || "",
            favorite_color: data.favorite_color || "",
            first_vehicle: data.first_vehicle || "",
            favorite_hobbies: data.favorite_hobbies || "",
            favorite_music_genre: data.favorite_music_genre || "",
            favorite_music_band: data.favorite_music_band || "",
            favorite_travel_destination: data.favorite_travel_destination || "",
          });
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Could not load profile data");
      } finally {
        setLoading(false);
      }
    }

    if (user?.id) {
      fetchProfile();
    }
  }, [user?.id, lastUpdate]);

  const usStates = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const countries = [
    "United States",
    "Canada",
    "Mexico",
    "United Kingdom",
    "France",
    "Germany",
    "Italy",
    "Spain",
    "China",
    "Japan",
    "South Korea",
    "India",
    "Australia",
    "Brazil",
    "Argentina",
    "South Africa",
    "Nigeria",
    "Egypt",
    "Saudi Arabia",
    "Russia",
    "Other",
  ];

  const races = [
    "American Indian or Alaska Native",
    "Asian",
    "Black or African American",
    "Hispanic or Latino",
    "Native Hawaiian or Other Pacific Islander",
    "White",
    "Two or More Races",
    "Other",
    "Prefer not to say",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, JPG, or PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB");
      return;
    }

    try {
      setError(null);
      const { url, error: uploadError } = await upload({ file });
      if (uploadError) {
        throw new Error(uploadError);
      }

      setFormData((prev) => ({
        ...prev,
        image: url,
      }));

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: "POST", image: url }),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile picture");
      }

      const { error } = await response.json();
      if (error) {
        throw new Error(error);
      }

      // Update lastUpdate to trigger a re-fetch
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err.message || "Could not upload profile picture");
    }
  };

  // Add a function to handle showing and hiding the success message
  const showSuccessMessage = () => {
    setSaveSuccess(true);
    // Hide the success message after 3 seconds
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      // Calculate height in inches, ensuring we handle empty values
      const heightInches =
        formData.height_feet && formData.height_inches
          ? parseInt(formData.height_feet) * 12 +
            parseInt(formData.height_inches)
          : null;

      // Clean up numeric fields to ensure they're either numbers or null
      const cleanedData = {
        method: "POST",
        ...formData,
        height: heightInches,
        weight: formData.weight ? parseInt(formData.weight) : null,
      };

      // Remove the split height fields before sending
      delete cleanedData.height_feet;
      delete cleanedData.height_inches;

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanedData),
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Too many requests. Please try again in a moment.");
        }
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile data");
      }

      const { error } = await response.json();
      if (error) {
        throw new Error(error);
      }

      setIsEditing(false);
      showSuccessMessage();
      // Update lastUpdate to trigger a re-fetch
      setLastUpdate(Date.now());
    } catch (err) {
      console.error("Error saving profile:", err);
      setError(err.message || "Could not save profile data");
    } finally {
      setSaving(false);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white font-roboto pb-24">
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
        {/* Success message */}
        {saveSuccess && (
          <div className="fixed top-20 right-6 bg-green-500/90 text-white px-6 py-3 rounded-lg shadow-lg backdrop-blur-sm z-50 flex items-center">
            <i className="fas fa-check-circle mr-2"></i>
            Profile saved successfully
          </div>
        )}

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 md:p-8">
          <div className="flex flex-col items-center mb-8 pb-8 border-b border-[#333333]">
            <div className="relative w-32 h-32 mb-4">
              {formData.image ? (
                <img
                  src={formData.image}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover border-4 border-[#333333]"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-[#242424] border-4 border-[#333333] flex items-center justify-center">
                  <i className="fas fa-user text-4xl text-gray-400"></i>
                </div>
              )}
              {isEditing && (
                <div className="flex flex-col gap-2 mt-4">
                  <label
                    htmlFor="profile-image"
                    className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                  >
                    <i className="fas fa-camera mr-2"></i>
                    Choose Photo
                    <input
                      type="file"
                      id="profile-image"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/jpg,image/png"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              )}
            </div>
            {uploading && (
              <div className="text-sm text-gray-400">Uploading image...</div>
            )}
            {error && <div className="mt-2 text-sm text-red-400">{error}</div>}
          </div>

          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Profile Information</h1>
            <div className="flex gap-4">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg transition-colors"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  saving
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {saving ? (
                  <span className="flex items-center">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Saving...
                  </span>
                ) : (
                  "Save Profile"
                )}
              </button>
            </div>
          </div>

          <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Maiden Name
                </label>
                <input
                  type="text"
                  name="maiden_name"
                  value={formData.maiden_name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Race
                </label>
                <select
                  name="race"
                  value={formData.race}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                >
                  <option value="">Select Race/Ethnicity</option>
                  {races.map((race) => (
                    <option key={race} value={race}>
                      {race}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sex
                </label>
                <select
                  name="sex"
                  value={formData.sex}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                >
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birthdate
                </label>
                <input
                  type="date"
                  name="birthdate"
                  value={formData.birthdate}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

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
                      disabled={!isEditing}
                      min="0"
                      max="9"
                      placeholder="Feet"
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400 mt-1 block">
                      Feet
                    </span>
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      name="height_inches"
                      value={formData.height_inches}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      min="0"
                      max="11"
                      placeholder="Inches"
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                    />
                    <span className="text-xs text-gray-400 mt-1 block">
                      Inches
                    </span>
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
                  disabled={!isEditing}
                  min="0"
                  placeholder="Weight in pounds"
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Location
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="current_city"
                    value={formData.current_city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="City"
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                  <select
                    name="current_state"
                    value={formData.current_state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  >
                    <option value="">Select State/Province</option>
                    <optgroup label="United States">
                      {usStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      <option value="International">International</option>
                    </optgroup>
                  </select>
                  <select
                    name="current_country"
                    value={formData.current_country || "United States"}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Birthplace
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="birthplace_city"
                    value={formData.birthplace_city}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    placeholder="City"
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  />
                  <select
                    name="birthplace_state"
                    value={formData.birthplace_state}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  >
                    <option value="">Select State/Province</option>
                    <optgroup label="United States">
                      {usStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Other">
                      <option value="International">International</option>
                    </optgroup>
                  </select>
                  <select
                    name="birthplace_country"
                    value={formData.birthplace_country || "United States"}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Religious Affiliation
                </label>
                <input
                  type="text"
                  name="religious_affiliation"
                  value={formData.religious_affiliation}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Sports Team
                </label>
                <input
                  type="text"
                  name="favorite_sports_team"
                  value={formData.favorite_sports_team}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Color
                </label>
                <input
                  type="text"
                  name="favorite_color"
                  value={formData.favorite_color}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Vehicle
                </label>
                <input
                  type="text"
                  name="first_vehicle"
                  value={formData.first_vehicle}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Hobbies
                </label>
                <textarea
                  name="favorite_hobbies"
                  value={formData.favorite_hobbies}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Music Preferences
                </label>
                <textarea
                  name="favorite_music_genre"
                  value={formData.favorite_music_genre}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Music Band
                </label>
                <textarea
                  name="favorite_music_band"
                  value={formData.favorite_music_band}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Favorite Travel Destination
                </label>
                <textarea
                  name="favorite_travel_destination"
                  value={formData.favorite_travel_destination}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white disabled:opacity-50 min-h-[100px]"
                />
              </div>
            </div>
          </form>
        </div>
      </main>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>

      {/* Advertisement Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t border-[#333333] shadow-lg">
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${currentAdIndex * 100}%)` }}
          >
            {profileAds.map((ad, index) => (
              <div
                key={ad.id}
                className="w-full flex-shrink-0 cursor-pointer"
                onClick={() => handleAdClick(ad)}
              >
                <div
                  className="flex items-center justify-center p-2 md:p-4 min-h-[60px] md:min-h-[100px]"
                  style={{ backgroundColor: ad.backgroundColor }}
                >
                  <div className="flex items-center space-x-4 max-w-6xl mx-auto w-full">
                    <div className="hidden md:block">
                      <img
                        src={ad.imageUrl}
                        alt={ad.title}
                        className="h-[90px] w-[728px] object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>

                    <div className="md:hidden flex-1">
                      <img
                        src={ad.mobileImageUrl || ad.imageUrl}
                        alt={ad.title}
                        className="h-[50px] w-full max-w-[320px] object-cover rounded-lg mx-auto"
                        loading="lazy"
                      />
                    </div>

                    <div className="hidden md:flex flex-col text-white">
                      <h3 className="font-bold text-lg">{ad.title}</h3>
                      <p className="text-gray-300 text-sm">{ad.description}</p>
                      <div className="mt-2">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">
                          Explore →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation dots */}
          {profileAds.length > 1 && (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {profileAds.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentAdIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentAdIndex ? "bg-white" : "bg-white/50"
                  }`}
                  aria-label={`Go to ad ${index + 1}`}
                />
              ))}
            </div>
          )}

          {/* Manual navigation arrows */}
          {profileAds.length > 1 && (
            <>
              <button
                onClick={() =>
                  setCurrentAdIndex((prev) =>
                    prev === 0 ? profileAds.length - 1 : prev - 1
                  )
                }
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Previous ad"
              >
                <i className="fas fa-chevron-left text-sm"></i>
              </button>

              <button
                onClick={() =>
                  setCurrentAdIndex((prev) => (prev + 1) % profileAds.length)
                }
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                aria-label="Next ad"
              >
                <i className="fas fa-chevron-right text-sm"></i>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default MainComponent;
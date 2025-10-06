"use client";
import React from "react";

import { useUpload } from "../utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [creations, setCreations] = useState([]);
  const [collections, setCollections] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedCreation, setSelectedCreation] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [upload, { loading: uploadLoading }] = useUpload();
  const [dragActive, setDragActive] = useState(false);
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [showTypeSelection, setShowTypeSelection] = useState(false);
  const [selectedFileType, setSelectedFileType] = useState(null);
  const [isLoadingCreations, setIsLoadingCreations] = useState(false);
  const [isLoadingCollections, setIsLoadingCollections] = useState(false);
  const [showProtectionTypeModal, setShowProtectionTypeModal] = useState(false);
  const [selectedProtectionType, setSelectedProtectionType] = useState(null);
  const [ipChecklist, setIPChecklist] = useState(null);
  const [ipError, setIPError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    creation_type: "",
    is_public: false,
  });
  const [updateSuccess, setUpdateSuccess] = useState(null);

  const creationTypes = [
    { id: "document", label: "Documents", icon: "fa-file-alt" },
    { id: "song", label: "Songs", icon: "fa-music" },
    { id: "video", label: "Videos", icon: "fa-video" },
    { id: "picture", label: "Pictures", icon: "fa-image" },
    { id: "drawing", label: "Drawings", icon: "fa-pencil-alt" },
    { id: "painting", label: "Paintings", icon: "fa-palette" },
    { id: "invention", label: "Inventions", icon: "fa-lightbulb" },
  ];

  const allCreationTypes = [
    { id: "all", label: "All Creations", icon: "fa-shapes" },
    ...creationTypes,
  ];

  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedFetchCreations = useMemo(
    () =>
      debounce(async () => {
        if (isLoadingCreations) return;
        setIsLoadingCreations(true);
        try {
          const response = await fetch("/api/creations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              method: "get",
              filters:
                selectedType !== "all" ? { type: selectedType } : undefined,
            }),
          });

          if (!response.ok) {
            throw new Error("Failed to fetch creations");
          }

          const data = await response.json();
          setCreations(data.creations || []);
        } catch (err) {
          console.error(err);
          setError("Could not load creations");
        } finally {
          setIsLoadingCreations(false);
        }
      }, 300),
    [selectedType, isLoadingCreations]
  );

  const debouncedFetchCollections = useMemo(
    () =>
      debounce(async () => {
        if (isLoadingCollections) return;
        setIsLoadingCollections(true);
        try {
          const response = await fetch("/api/collections", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ method: "get" }),
          });
          if (!response.ok) throw new Error("Failed to fetch collections");
          const data = await response.json();
          setCollections(data.collections || []);
        } catch (err) {
          setError("Could not load collections");
        } finally {
          setIsLoadingCollections(false);
        }
      }, 300),
    [isLoadingCollections]
  );

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    if (user && !userLoading) {
      debouncedFetchCreations();
      debouncedFetchCollections();
    }
  }, [user, userLoading]);

  useEffect(() => {
    if (user && !userLoading) {
      debouncedFetchCreations();
    }
  }, [selectedType]);

  const fetchCreations = async () => {
    try {
      const response = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "get",
          filters: selectedType !== "all" ? { type: selectedType } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch creations");
      }

      const data = await response.json();
      console.log("Fetched creations:", data.creations);
      setCreations(data.creations || []);
    } catch (err) {
      console.error("Fetch creations error:", err);
      setError("Could not load creations");
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "get" }),
      });
      if (!response.ok) throw new Error("Failed to fetch collections");
      const data = await response.json();
      setCollections(data.collections || []);
    } catch (err) {
      setError("Could not load collections");
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragActive(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    console.log("Files selected:", files.length);
    setSelectedFiles(files);
    setShowTypeSelection(true);
  };

  const handleUpload = async () => {
    if (!selectedFiles || !selectedFileType) {
      console.log("Missing required upload data:", {
        selectedFiles,
        selectedFileType,
      });
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadedCreations = [];
      const filesArray = Array.from(selectedFiles);

      for (const file of filesArray) {
        console.log("Starting upload for file:", file.name);

        // First upload the file to get the URL
        const { url, error: uploadError } = await upload({ file });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(uploadError);
        }

        console.log("File uploaded successfully to:", url);

        // Then create the creation record with the URL
        const response = await fetch("/api/creations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            method: "create",
            title: file.name,
            description: "",
            creationType: selectedFileType,
            fileUrl: url,
            thumbnailUrl: url,
            isPublic: false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Creation save error:", errorData);
          throw new Error(errorData.error || "Failed to save creation");
        }

        const data = await response.json();
        console.log("Creation saved successfully:", data);

        if (data.error) {
          throw new Error(data.error);
        }

        if (!data.creation) {
          throw new Error("No creation data returned from server");
        }

        uploadedCreations.push(data.creation);
      }

      // Update the UI with new creations
      setCreations((prev) => [...uploadedCreations, ...prev]);

      // Reset upload state
      setSelectedFiles(null);
      setShowTypeSelection(false);
      setSelectedFileType(null);

      // Fetch latest creations to ensure UI is up to date
      await fetchCreations();

      console.log("Upload process completed successfully");
    } catch (err) {
      console.error("Upload process failed:", err);
      setError("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setSelectedFiles(null);
    setShowTypeSelection(false);
    setSelectedFileType(null);
  };

  const getCreationType = (mimeType) => {
    const type = mimeType.split("/")[0];
    const subtype = mimeType.split("/")[1];

    switch (type) {
      case "image":
        // Handle SVG specifically
        if (subtype === "svg+xml") return "drawing";
        // Handle other image types
        return "picture";
      case "video":
        return "video";
      case "audio":
        return "song";
      case "application":
        // Handle various document types
        if (
          [
            "pdf",
            "msword",
            "vnd.openxmlformats-officedocument.wordprocessingml.document",
            "vnd.ms-excel",
            "vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ].includes(subtype)
        ) {
          return "document";
        }
        return "document";
      default:
        return "document";
    }
  };

  const filteredCreations = (creations || [])
    .filter((creation) => creation)
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

  const handleCreateCollection = async () => {
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "create",
          name: newCollectionName,
          description: newCollectionDescription,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create collection");
      }

      await fetchCollections();
      setIsAddingCollection(false);
      setNewCollectionName("");
      setNewCollectionDescription("");
    } catch (err) {
      setError("Failed to create collection: " + err.message);
    }
  };

  const handleAddToCollection = async (creationId, collectionId) => {
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "add_item",
          creationId,
          collectionId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add to collection");
      }

      await fetchCollections();
    } catch (err) {
      setError("Failed to add to collection: " + err.message);
    }
  };

  const handleUpdateCreationType = async (creationId, newType) => {
    try {
      setError(null);

      const response = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "update",
          id: creationId,
          creationType: newType,
          title: selectedCreation.title,
          description: selectedCreation.description,
          fileUrl: selectedCreation.file_url,
          isPublic: selectedCreation.is_public,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update creation type");
      }

      const result = await response.json();

      // Update the creation in the local state
      setCreations((prev) =>
        prev.map((creation) =>
          creation.id === creationId
            ? { ...creation, creation_type: newType }
            : creation
        )
      );

      // Update the selected creation
      setSelectedCreation((prev) => ({
        ...prev,
        creation_type: newType,
      }));

      // Refresh the filtered list to ensure proper categorization
      await fetchCreations();

      setUpdateSuccess("Creation type updated successfully!");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update creation type: " + err.message);
    }
  };

  const handleDeleteCreation = async (creationId) => {
    try {
      const response = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "delete",
          id: creationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete creation");
      }

      setCreations((prev) => prev.filter((c) => c.id !== creationId));
      setSelectedCreation(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete creation: " + err.message);
    }
  };

  const renderCreationContent = (creation) => {
    if (!creation) return null;

    const creationType = creationTypes.find(
      (t) => t.id === creation.creation_type
    );

    if (
      creation.creation_type === "picture" ||
      creation.creation_type === "painting" ||
      creation.creation_type === "drawing"
    ) {
      return (
        <img
          src={creation.file_url || creation.fileUrl}
          alt={creation.title}
          className="w-full rounded-lg"
        />
      );
    } else {
      return (
        <div className="w-full flex flex-col items-center justify-center bg-[#242424] rounded-lg p-8">
          <i
            className={`fas ${
              creationType?.icon || "fa-file"
            } text-4xl text-[#6366F1] mb-4`}
          ></i>
          <a
            href={creation.file_url || creation.fileUrl}
            download={creation.title}
            onClick={(e) => e.stopPropagation()}
            className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
          >
            Download File
          </a>
        </div>
      );
    }
  };

  const getRecommendedProtectionType = (creationType) => {
    switch (creationType) {
      case "invention":
        return {
          type: "patent",
          reason:
            "Patents protect new inventions, innovations, and technological improvements. This is ideal for protecting the functional aspects and unique features of your invention.",
        };
      case "song":
        return {
          type: "copyright",
          reason:
            "Copyright protection is automatic for musical works and recordings, protecting both the composition and the sound recording. This prevents others from copying, distributing, or performing your work without permission.",
        };
      case "picture":
      case "drawing":
      case "painting":
        return {
          type: "copyright",
          reason:
            "Copyright automatically protects original artistic works, including visual arts. This prevents others from reproducing, distributing, or creating derivative works without your permission.",
        };
      case "video":
        return {
          type: "copyright",
          reason:
            "Videos and films are automatically protected by copyright, covering both the visual content and any original audio. This prevents unauthorized copying, distribution, or public performance.",
        };
      case "document":
        return {
          type: "copyright",
          reason:
            "Written works are protected by copyright as soon as they're created, preventing others from copying or distributing your work without permission.",
        };
      default:
        return {
          type: "copyright",
          reason:
            "Copyright protection is recommended as it automatically protects original creative works upon creation.",
        };
    }
  };

  const handleMakeThisMine = async () => {
    if (!selectedCreation || !selectedProtectionType) {
      console.log("Make This Mine - Missing required data:", {
        selectedCreation,
        selectedProtectionType,
      });
      return;
    }

    try {
      setIPError(null);

      const requestData = {
        method: "create",
        creationId: selectedCreation.id,
        protectionType: selectedProtectionType.toLowerCase(),
      };

      console.log("Making IP Protection request with data:", requestData);

      const response = await fetch("/api/ip-protection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      // Log raw response for debugging
      console.log("Raw response:", response);

      let data;
      try {
        data = await response.json();
        console.log("Parsed response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Invalid response from server");
      }

      // Check for error responses
      if (!response.ok) {
        if (response.status === 403) {
          // Redirect to login if unauthorized
          const currentPath = encodeURIComponent(window.location.pathname);
          window.location.href = `/account/signin?callbackUrl=${currentPath}`;
          return;
        }
        throw new Error(data?.error || `Server error: ${response.status}`);
      }

      // Check if data exists
      if (!data) {
        throw new Error("Empty response from server");
      }

      // Check for error in data
      if (data.error) {
        throw new Error(data.error);
      }

      // Validate checklist data
      if (!data.checklist) {
        console.error("Invalid checklist data:", data);
        throw new Error("Server returned invalid checklist data");
      }

      if (!data.checklist.steps) {
        console.error("Checklist missing steps:", data.checklist);
        throw new Error("Checklist is missing required steps data");
      }

      // Only proceed if we have valid checklist data
      console.log(
        "Make This Mine - Success, setting checklist:",
        data.checklist
      );
      setIPChecklist(data.checklist);
      setShowProtectionTypeModal(false);
      setShowChecklistModal(true);
    } catch (err) {
      console.error("Make This Mine Error:", err);
      setIPError(err.message || "Failed to create protection checklist");
    }
  };

  const getUSPTOLink = (protectionType) => {
    switch (protectionType) {
      case "patent":
        return "https://www.uspto.gov/patents/apply";
      case "trademark":
        return "https://www.uspto.gov/trademarks/apply";
      case "copyright":
        return "https://www.copyright.gov/registration/";
      default:
        return "https://www.uspto.gov/";
    }
  };

  const handleStepCompletion = async (e, index, date) => {
    e.preventDefault();

    if (!selectedCreation || !selectedProtectionType || !ipChecklist) return;

    try {
      const formattedDate = date
        ? new Date(date).toISOString()
        : new Date().toISOString();

      const stepNumber = index + 1;
      const isCurrentlyCompleted = Boolean(
        ipChecklist.completion_dates?.[stepNumber]
      );

      const requestData = {
        method: "update_step",
        creationId: selectedCreation.id,
        protectionType: selectedProtectionType,
        stepIndex: stepNumber,
        completed: !isCurrentlyCompleted,
        completionDate: formattedDate,
      };

      console.log("Making step completion request with data:", requestData);

      const response = await fetch("/api/ip-protection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          // Redirect to login if unauthorized
          const currentPath = encodeURIComponent(window.location.pathname);
          window.location.href = `/account/signin?callbackUrl=${currentPath}`;
          return;
        }
        throw new Error(data?.error || "Failed to update step completion");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      // Update the checklist state with the new data
      setIPChecklist(data.checklist);
    } catch (err) {
      console.error("Step completion error:", err);
      setIPError(err.message || "Failed to update step");
    }
  };

  const handleProtectionClick = () => {
    const recommendation = getRecommendedProtectionType(
      selectedCreation?.creation_type
    );
    setSelectedProtectionType(recommendation.type);
    setShowProtectionTypeModal(true);
  };

  const handleCloseProtectionType = () => {
    setSelectedProtectionType(null);
    setShowProtectionTypeModal(false);
  };

  const handleCloseChecklist = () => {
    setShowChecklistModal(false);
    setIPChecklist(null);
    setCompletionDates({});
  };

  const startEditing = (creation) => {
    setEditForm({
      title: creation.title || "",
      description: creation.description || "",
      creation_type: creation.creation_type,
      is_public: creation.is_public || false,
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm({
      title: "",
      description: "",
      creation_type: "",
      is_public: false,
    });
  };

  const handleEditCreation = async (formData) => {
    try {
      setError(null);

      const response = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "update",
          id: selectedCreation.id,
          title: formData.title,
          description: formData.description,
          creationType: formData.creation_type,
          fileUrl: selectedCreation.file_url,
          isPublic: formData.is_public,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update creation");
      }

      const result = await response.json();

      // Create the updated creation object
      const updatedCreation = {
        ...selectedCreation,
        title: formData.title,
        description: formData.description,
        creation_type: formData.creation_type,
        is_public: formData.is_public,
      };

      // Update the creation in the local state
      setCreations((prev) =>
        prev.map((creation) =>
          creation.id === selectedCreation.id ? updatedCreation : creation
        )
      );

      // Update the selected creation to reflect the changes
      setSelectedCreation(updatedCreation);

      // If the creation type changed and we're filtering by a specific type,
      // we need to handle the view appropriately
      const typeChanged =
        selectedCreation.creation_type !== formData.creation_type;

      if (typeChanged) {
        // If we're currently filtering by a specific type and the item no longer matches,
        // either switch to "all" view or refresh the current filter
        if (selectedType !== "all" && selectedType !== formData.creation_type) {
          // Option 1: Switch to "all" view to keep showing the updated item
          setSelectedType("all");
        }

        // Refresh the creations list to ensure proper categorization
        await fetchCreations();
      }

      setIsEditing(false);
      setUpdateSuccess("Creation updated successfully!");
      setTimeout(() => setUpdateSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update creation: " + err.message);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            My Creations
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 text-gray-300 hover:text-white transition-colors"
            >
              <i
                className={`fas fa-${viewMode === "grid" ? "list" : "grid"}`}
              ></i>
            </button>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4">
              <h2 className="text-xl font-bold mb-4">Filter by Type</h2>
              <div className="space-y-2">
                {allCreationTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                      selectedType === type.id
                        ? "bg-[#6366F1] text-white"
                        : "hover:bg-[#242424] text-gray-300"
                    }`}
                  >
                    <i className={`fas ${type.icon}`}></i>
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Collections</h2>
                <button
                  onClick={() => setIsAddingCollection(true)}
                  className="text-[#6366F1] hover:text-[#4F46E5] transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="space-y-2">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => setSelectedCollection(collection)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedCollection?.id === collection.id
                        ? "bg-[#6366F1] text-white"
                        : "hover:bg-[#242424] text-gray-300"
                    }`}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setDragActive(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDrop(e);
              }}
              className={`border-2 border-dashed rounded-xl p-8 mb-8 text-center transition-colors ${
                dragActive
                  ? "border-[#6366F1] bg-[#6366F1]/10"
                  : "border-[#333333] hover:border-[#6366F1]"
              }`}
            >
              <input
                type="file"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-[#6366F1]"></i>
                <p className="text-lg mb-2">
                  {isUploading
                    ? "Uploading..."
                    : "Drag and drop your files here"}
                </p>
                <p className="text-gray-400">
                  {isUploading ? "Please wait..." : "or click to select files"}
                </p>
              </label>
            </div>

            {error && (
              <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {filteredCreations.map((creation) => {
                if (!creation) return null;

                // Get the creation type info
                const creationType = creationTypes.find(
                  (t) => t.id === (creation.creation_type || "document")
                );

                return (
                  <div
                    key={creation.id}
                    onClick={() => setSelectedCreation(creation)}
                    className={`bg-[#1A1A1A] border border-[#333333] rounded-xl overflow-hidden cursor-pointer transition-transform hover:scale-[1.02] ${
                      viewMode === "list" ? "flex items-center p-4" : ""
                    }`}
                  >
                    <div
                      className={
                        viewMode === "grid"
                          ? "aspect-square relative"
                          : "w-16 h-16 relative mr-4"
                      }
                    >
                      {creation.creation_type === "picture" ||
                      creation.creation_type === "painting" ||
                      creation.creation_type === "drawing" ? (
                        <img
                          src={creation.file_url || creation.fileUrl}
                          alt={creation.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#242424]">
                          <i
                            className={`fas ${
                              creationType?.icon || "fa-file"
                            } text-2xl text-[#6366F1]`}
                          ></i>
                        </div>
                      )}
                    </div>
                    <div className={viewMode === "grid" ? "p-4" : ""}>
                      <h3 className="font-medium text-white mb-1">
                        {creation.title || "Untitled"}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {creation.created_at
                          ? new Date(creation.created_at).toLocaleDateString()
                          : "No date"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {selectedCreation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {isEditing ? "Edit Creation" : selectedCreation.title}
                </h2>
                <button
                  onClick={() => {
                    setSelectedCreation(null);
                    setIsEditing(false);
                    setUpdateSuccess(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              {updateSuccess && (
                <div className="mb-4 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
                  {updateSuccess}
                </div>
              )}

              {isEditing ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditCreation(editForm);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
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
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                      placeholder="Add a description for your creation..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Creation Type
                    </label>
                    <select
                      value={editForm.creation_type}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          creation_type: e.target.value,
                        }))
                      }
                      className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    >
                      {creationTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-400 mt-1">
                      Changing the type will move this creation to the new
                      category
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={editForm.is_public}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            is_public: e.target.checked,
                          }))
                        }
                        className="rounded bg-[#242424] border-[#333333] text-[#6366F1] focus:ring-[#6366F1]"
                      />
                      <span className="text-gray-300">
                        Make this creation public
                      </span>
                    </label>
                  </div>

                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="mb-6">
                    {renderCreationContent(selectedCreation)}
                  </div>

                  {selectedCreation.description && (
                    <div className="mb-4 p-4 bg-[#242424] rounded-lg">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Description
                      </h4>
                      <p className="text-gray-300">
                        {selectedCreation.description}
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                    <div className="bg-[#242424] p-3 rounded-lg">
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-2 text-white capitalize">
                        {creationTypes.find(
                          (t) => t.id === selectedCreation.creation_type
                        )?.label || selectedCreation.creation_type}
                      </span>
                    </div>
                    <div className="bg-[#242424] p-3 rounded-lg">
                      <span className="text-gray-400">Visibility:</span>
                      <span
                        className={`ml-2 ${
                          selectedCreation.is_public
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {selectedCreation.is_public ? "Public" : "Private"}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => startEditing(selectedCreation)}
                        className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors whitespace-nowrap"
                      >
                        <i className="fas fa-edit mr-2"></i>
                        Edit Details
                      </button>
                      <button
                        onClick={handleProtectionClick}
                        className="px-4 py-2 bg-[#4FD1C5] hover:bg-[#38B2AC] rounded-lg text-gray-900 transition-colors whitespace-nowrap"
                      >
                        <i className="fas fa-shield-alt mr-2"></i>
                        Protect My Work
                      </button>
                    </div>
                    <button
                      onClick={() => {
                        if (
                          window.confirm(
                            "Are you sure you want to delete this creation? This action cannot be undone."
                          )
                        ) {
                          handleDeleteCreation(selectedCreation.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <i className="fas fa-trash mr-2"></i>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {showProtectionTypeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">Protect Your Work</h2>
                <button
                  onClick={handleCloseProtectionType}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-[#242424] rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-[#6366F1]">
                    Recommended Protection
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {
                      getRecommendedProtectionType(
                        selectedCreation?.creation_type
                      ).reason
                    }
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <i className="fas fa-info-circle"></i>
                    <span>
                      You can still choose a different type of protection if it
                      better suits your needs.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <a
                    href="/copyright-guide"
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedProtectionType === "copyright"
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-[#333333] hover:border-[#6366F1]"
                    }`}
                  >
                    <i className="fas fa-copyright text-2xl mb-2 text-[#6366F1]"></i>
                    <h3 className="font-semibold mb-1">Copyright</h3>
                    <p className="text-sm text-gray-400">
                      Protect creative works
                    </p>
                  </a>

                  <a
                    href="/patent-guide"
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedProtectionType === "patent"
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-[#333333] hover:border-[#6366F1]"
                    }`}
                  >
                    <i className="fas fa-lightbulb text-2xl mb-2 text-[#6366F1]"></i>
                    <h3 className="font-semibold mb-1">Patent</h3>
                    <p className="text-sm text-gray-400">Protect inventions</p>
                  </a>

                  <a
                    href="/trademark-guide"
                    className={`p-4 rounded-lg border transition-colors ${
                      selectedProtectionType === "trademark"
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-[#333333] hover:border-[#6366F1]"
                    }`}
                  >
                    <i className="fas fa-trademark text-2xl mb-2 text-[#6366F1]"></i>
                    <h3 className="font-semibold mb-1">Trademark</h3>
                    <p className="text-sm text-gray-400">
                      Protect brand identity
                    </p>
                  </a>
                </div>
              </div>

              {ipError && (
                <div className="mb-4 p-4 bg-red-900/20 border border-red-500/50 rounded-lg text-red-400">
                  {ipError}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default MainComponent;
"use client";
import {React, useState, useEffect,useRef} from "react";
import useUser from '../../components/use-user'

import { useUpload } from "@/utilities/runtime-helpers";

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [documents, setDocuments] = useState([]);
  const [trustedAgents, setTrustedAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [password, setPassword] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [upload, { loading: uploading }] = useUpload();
  const [uploadData, setUploadData] = useState({
    file: null,
    password: "",
    title: "",
    description: "",
    documentType: "",
    fileKind: "",
  });
  const formRef = useRef(null);

  // Add new state for delete confirmation
  const [deletingDoc, setDeletingDoc] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");

  // Common document types
  const documentTypes = [
    { label: "Select document type", value: "" },
    { label: "Personal ID", value: "personal_id" },
    { label: "Medical Record", value: "medical_record" },
    { label: "Financial Document", value: "financial" },
    { label: "Legal Document", value: "legal" },
    { label: "Insurance Policy", value: "insurance" },
    { label: "Tax Document", value: "tax" },
    { label: "Property Document", value: "property" },
    { label: "Education Record", value: "education" },
    { label: "Certificate", value: "certificate" },
    { label: "Contract", value: "contract" },
    { label: "Will or Trust", value: "will_trust" },
    { label: "Other", value: "other" },
  ];

  // Add file kinds array
  const fileKinds = [
    { label: "Select file type", value: "" },
    { label: "PDF Document", value: "pdf" },
    { label: "Image", value: "image" },
    { label: "Word Document", value: "word" },
    { label: "Excel Spreadsheet", value: "excel" },
    { label: "Text File", value: "text" },
    { label: "Video", value: "video" },
    { label: "Scan", value: "scan" },
    { label: "Contract", value: "contract" },
    { label: "Receipt", value: "receipt" },
    { label: "Other", value: "other" },
  ];

  // Add new state for rate limiting
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitResetTime, setRateLimitResetTime] = useState(null);

  const handleRateLimitError = (response) => {
    // Get the reset time from headers if available
    const resetTime = response.headers.get("X-RateLimit-Reset");
    if (resetTime) {
      setRateLimitResetTime(new Date(resetTime * 1000));
    }
    setIsRateLimited(true);

    // Auto-reset rate limit state after a minute
    setTimeout(() => {
      setIsRateLimited(false);
      setRateLimitResetTime(null);
    }, 60000);
  };

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }

    fetchDocuments();
    fetchTrustedAgents();
  }, [user, userLoading]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listDocuments" }),
      });

      if (response.status === 429) {
        handleRateLimitError(response);
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      }

      if (!response.ok) throw new Error("Failed to fetch documents");

      const result = await response.json();
      setDocuments(result.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrustedAgents = async () => {
    try {
      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listTrustedAgents" }),
      });
      if (!response.ok) throw new Error("Failed to fetch trusted agents");
      const result = await response.json();
      setTrustedAgents(result.agents || []);
    } catch (err) {
      setError("Could not load trusted agents");
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      if (!uploadData.file) {
        throw new Error("Please select a file to upload");
      }
      if (!uploadData.documentType) {
        throw new Error("Please select a document type");
      }
      if (!uploadData.fileKind) {
        throw new Error("Please select a file type");
      }

      // Get the actual file extension from the file name
      const fileExtension = uploadData.file.name.split(".").pop().toLowerCase();

      // Map file kinds to MIME types
      const mimeTypes = {
        pdf: "application/pdf",
        image: uploadData.file.type, // Keep original image type (jpg, png, etc)
        word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        excel:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        text: "text/plain",
        scan: "application/pdf",
        contract: "application/pdf",
        receipt: "application/pdf",
        other: uploadData.file.type || "application/octet-stream",
      };

      const { url, error: uploadError } = await upload({
        file: uploadData.file,
        contentType: mimeTypes[uploadData.fileKind] || uploadData.file.type,
      });

      if (uploadError) throw new Error(uploadError);

      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "uploadDocument",
          document: {
            title: uploadData.title,
            description: uploadData.description,
            file_url: url,
            file_type: mimeTypes[uploadData.fileKind] || uploadData.file.type,
            file_size: uploadData.file.size,
            original_name: uploadData.file.name,
            document_type: uploadData.documentType,
            file_kind: uploadData.fileKind,
          },
          password: uploadData.password,
        }),
      });

      if (response.status === 429) {
        handleRateLimitError(response);
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      }

      if (!response.ok) throw new Error("Failed to save document");

      // Reset form and form element
      setUploadData({
        file: null,
        password: "",
        title: "",
        description: "",
        documentType: "",
        fileKind: "",
      });

      // Reset the form to clear the file input
      formRef.current?.reset();

      fetchDocuments();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddAgent = async (agentData) => {
    try {
      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addTrustedAgent",
          agentData: {
            name: agentData.name,
            email: agentData.email,
            relationship: agentData.relationship,
          },
          password: agentData.password || Math.random().toString(36).slice(-8), // Generate a random password if none provided
        }),
      });

      if (!response.ok) throw new Error("Failed to add trusted agent");

      fetchTrustedAgents();
      setIsAddingAgent(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAccessDocument = async (docId) => {
    try {
      if (isRateLimited) {
        throw new Error(
          "Please wait a moment before trying to access documents again."
        );
      }

      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accessDocument",
          docId,
          password: password,
        }),
      });

      if (response.status === 429) {
        handleRateLimitError(response);
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      }

      // Always parse JSON first - the API returns JSON even for errors
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error("Network error occurred");
      }

      // Check for API error in the response
      if (result.error) {
        throw new Error(result.error);
      }

      // Open document in a new window with proper content type
      if (result.fileUrl) {
        const doc = documents.find((d) => d.id === docId);
        if (doc && doc.file_type) {
          // For PDFs and images, we can open directly in a new tab
          if (
            doc.file_type.startsWith("application/pdf") ||
            doc.file_type.startsWith("image/")
          ) {
            window.open(result.fileUrl, "_blank");
          } else {
            // For other file types, trigger a download
            const link = document.createElement("a");
            link.href = result.fileUrl;
            link.download = doc.original_name || "document";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          }
        } else {
          window.open(result.fileUrl, "_blank");
        }
      } else {
        throw new Error("Could not access document");
      }

      setSelectedDoc(null);
      setPassword("");
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error("Access document error:", err);
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      if (isRateLimited) {
        throw new Error(
          "Please wait a moment before trying to delete documents again."
        );
      }

      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteDocument",
          docId,
          password: deletePassword,
        }),
      });

      if (response.status === 429) {
        handleRateLimitError(response);
        throw new Error(
          "Too many requests. Please wait a moment before trying again."
        );
      }

      // Always parse JSON first - the API returns JSON even for errors
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error("Network error occurred");
      }

      // Check for API error in the response
      if (result.error) {
        throw new Error(result.error);
      }

      // Check for success response
      if (result.success) {
        // Refresh the documents list
        fetchDocuments();
        setDeletingDoc(null);
        setDeletePassword("");
        setError(null);
      } else {
        throw new Error("Failed to delete document");
      }
    } catch (err) {
      setError(err.message);
      console.error("Delete document error:", err);
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (
      !window.confirm("Are you sure you want to remove this trusted agent?")
    ) {
      return;
    }

    try {
      const response = await fetch("/api/digital-vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE_AGENT",
          agentId,
        }),
      });

      if (!response.ok) throw new Error("Failed to remove trusted agent");

      fetchTrustedAgents();
      setError(null);
    } catch (err) {
      setError(err.message);
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
          Digital Vault
        </h1>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
            {isRateLimited && rateLimitResetTime && (
              <div className="mt-2 text-sm">
                Please try again after {rateLimitResetTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
              Upload File
            </h2>
            <form ref={formRef} onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File Name
                </label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Document Type
                  </label>
                  <select
                    value={uploadData.documentType}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        documentType: e.target.value,
                      })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  >
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    File Type
                  </label>
                  <select
                    value={uploadData.fileKind}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        fileKind: e.target.value,
                      })
                    }
                    className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                    required
                  >
                    {fileKinds.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) =>
                    setUploadData({
                      ...uploadData,
                      description: e.target.value,
                    })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Assigned Password
                </label>
                <input
                  type="password"
                  value={uploadData.password}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, password: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  File
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setUploadData({ ...uploadData, file: e.target.files[0] })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Begin Upload"}
              </button>
            </form>
          </div>

          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-[#6366F1]">
                Trusted Agents
              </h2>
              <button
                onClick={() => setIsAddingAgent(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-4 py-2 rounded-lg text-white transition-colors"
              >
                Add Agent
              </button>
            </div>
            {trustedAgents.map((agent) => (
              <div key={agent.id} className="bg-[#242424] rounded-lg p-4 mb-4">
                <div className="flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-medium">
                        {agent.agent_name}
                      </p>
                      <p className="text-gray-400 text-sm">
                        {agent.agent_email}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        <span className="text-[#6366F1]">Relationship:</span>{" "}
                        {agent.relationship || "Not specified"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        <span className="text-[#6366F1]">Added:</span>{" "}
                        {new Date(agent.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      className="text-red-400 hover:text-red-300 p-2"
                      onClick={() => handleDeleteAgent(agent.id)}
                      title="Remove Agent"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-[#1A1A1A] border border-[#333333] rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-6 text-[#6366F1]">
            Stored Documents
          </h2>
          {loading ? (
            <div className="text-center py-12">Loading...</div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              No documents stored yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-[#242424] rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-medium">{doc.title}</h3>
                      <p className="text-gray-400 text-sm">{doc.description}</p>
                      <p className="text-gray-400 text-sm">
                        File: {doc.original_name || "Unknown"}
                      </p>
                      <p className="text-gray-400 text-sm">
                        Type:{" "}
                        {documentTypes.find(
                          (t) => t.value === doc.document_type
                        )?.label || doc.document_type}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="text-[#6366F1] hover:text-[#4F46E5] p-2"
                        title="Access Document"
                      >
                        <i className="fas fa-lock"></i>
                      </button>
                      <button
                        onClick={() => setDeletingDoc(doc)}
                        className="text-red-400 hover:text-red-300 p-2"
                        title="Delete Document"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {selectedDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Access Document</h3>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter document password"
              className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white mb-4"
            />
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setPassword("");
                }}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAccessDocument(selectedDoc.id)}
                className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
              >
                Access
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-red-500/50 rounded-xl p-6 w-full max-w-md">
            <div className="text-center mb-4">
              <i className="fas fa-exclamation-triangle text-red-400 text-3xl mb-2"></i>
              <h3 className="text-xl font-bold text-white">Delete Document</h3>
              <p className="text-gray-400 mt-2">
                Are you sure you want to permanently delete "{deletingDoc.title}
                "?
              </p>
              <p className="text-red-400 text-sm mt-2 font-medium">
                This action cannot be undone.
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Enter document password to confirm deletion:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Document password"
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                autoFocus
              />
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setDeletingDoc(null);
                  setDeletePassword("");
                }}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deletingDoc.id)}
                disabled={!deletePassword}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Delete Document
              </button>
            </div>
          </div>
        </div>
      )}

      {isAddingAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add Trusted Agent</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleAddAgent({
                  name: formData.get("name"),
                  email: formData.get("email"),
                  relationship: formData.get("relationship"),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Relationship
                </label>
                <input
                  name="relationship"
                  type="text"
                  required
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setIsAddingAgent(false)}
                  className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
                >
                  Add Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
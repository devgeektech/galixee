"use client";
import React, { useState, useEffect, useRef } from "react";
import useUser from '@/components/use-user'

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [familyMembers, setFamilyMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [treeView, setTreeView] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
    fetchFamilyMembers();
  }, [user, userLoading]);

  const fetchFamilyMembers = async () => {
    try {
      const response = await fetch("/api/family-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) throw new Error("Failed to fetch family members");

      const data = await response.json();
      // Ensure members is always an array and filter out any undefined/null values
      const members = Array.isArray(data.members)
        ? data.members.filter(
            (member) => member && typeof member === "object" && member.id
          )
        : [];
      setFamilyMembers(members);
      setError(null);
    } catch (err) {
      console.error("Error fetching family members:", err);
      setError("Could not load family tree");
      setFamilyMembers([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setError(null); // Clear any previous errors

      const response = await fetch("/api/family-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: editingMember ? "UPDATE" : "CREATE",
          id: editingMember?.id,
          name: formData.name,
          relationship: formData.relationship,
          birthDate: formData.birthDate,
          email: formData.email,
          isGalixeeUser: formData.isGalixeeUser,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save family member");
      }

      const result = await response.json();
      console.log("API response:", result); // Debug logging

      if (editingMember && result.member) {
        setFamilyMembers(
          (prevMembers) =>
            prevMembers
              .map((member) =>
                member && member.id === editingMember.id
                  ? result.member
                  : member
              )
              .filter(
                (member) => member && typeof member === "object" && member.id
              ) // Filter out any undefined/null values
        );
      } else if (result.member) {
        setFamilyMembers((prev) => [...prev, result.member]);
      } else {
        console.error("No member returned from API:", result);
        throw new Error("No member data returned from server");
      }

      setSuccess(
        `Successfully ${editingMember ? "updated" : "added"} family member`
      );
      setIsAddingMember(false);
      setEditingMember(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || "Could not save family member");
    }
  };

  const handleDelete = async (memberId) => {
    if (!confirm("Are you sure you want to remove this family member?")) return;

    try {
      const response = await fetch("/api/family-tree", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          id: memberId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete family member");

      setFamilyMembers((prev) =>
        prev.filter((member) => member && member.id !== memberId)
      );
      setSuccess("Family member removed successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Could not delete family member");
    }
  };

  const handleCreateTree = async () => {
    setTreeLoading(true);
    try {
      // Just refresh the family members and switch to tree view
      // The CosmicTreeView has its own positioning logic
      await fetchFamilyMembers();
      setTreeView(true);
      setError(null); // Clear any existing errors
    } catch (err) {
      console.error(err);
      setError("Could not create family tree: " + err.message);
    } finally {
      setTreeLoading(false);
    }
  };

  const FamilyMemberForm = ({ onSubmit, onCancel, initialData }) => {
    // Helper function to format date for HTML date input
    const formatDateForInput = (dateValue) => {
      if (!dateValue) return "";

      try {
        // Handle both date strings and Date objects
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return "";

        // Format as YYYY-MM-DD for HTML date input
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Error formatting date:", error);
        return "";
      }
    };

    const [formData, setFormData] = useState({
      name: initialData?.name || "",
      relationship:
        initialData?.relation_type || initialData?.relationship || "",
      birthDate: formatDateForInput(
        initialData?.date_of_birth || initialData?.birthDate
      ),
      email: initialData?.email || "",
      isGalixeeUser: initialData?.linked_galixee_user_id
        ? true
        : initialData?.isGalixeeUser || false,
    });

    const relationships = [
      "Wife",
      "Husband",
      "Mother",
      "Father",
      "Sister",
      "Brother",
      "Son",
      "Daughter",
      "Maternal Grandfather",
      "Maternal Great Grandfather",
      "Maternal Great Great Grandfather",
      "Maternal Grandmother",
      "Maternal Great Grandmother",
      "Maternal Great Great Grandmother",
      "Paternal Grandfather",
      "Paternal Great Grandfather",
      "Paternal Great Great Grandfather",
      "Paternal Grandmother",
      "Paternal Great Grandmother",
      "Paternal Great Great Grandmother",
      "ex-Wife",
      "ex-Husband",
      "Stepdaughter",
      "Stepson",
      "Aunt",
      "Uncle",
      "1st Cousin",
      "2nd Cousin",
      "3rd Cousin",
      "Great Aunt",
      "Great Uncle",
      "Mother-in-Law",
      "Father-in-Law",
      "Brother-in-Law",
      "Sister-in-Law",
    ];

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-md">
          <h3 className="text-xl font-bold mb-4 text-white">
            {initialData ? "Edit Family Member" : "Add Family Member"}
          </h3>
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
              <select
                value={formData.relationship}
                onChange={(e) =>
                  setFormData({ ...formData, relationship: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                required
              >
                <option value="">Select relationship...</option>
                {relationships.map((rel) => (
                  <option key={rel} value={rel}>
                    {rel}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Birth Date
              </label>
              <input
                type="date"
                value={formData.birthDate}
                onChange={(e) =>
                  setFormData({ ...formData, birthDate: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isGalixeeUser"
                checked={formData.isGalixeeUser}
                onChange={(e) =>
                  setFormData({ ...formData, isGalixeeUser: e.target.checked })
                }
                className="bg-[#242424] border border-[#333333] rounded"
              />
              <label
                htmlFor="isGalixeeUser"
                className="text-sm font-medium text-gray-300"
              >
                Is a Galixee user
              </label>
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
                {initialData ? "Save Changes" : "Add Member"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const FamilyTreeNode = ({ member }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-4 min-w-[200px]">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-lg font-bold text-white">{member.name}</h3>
          <p className="text-gray-400 text-sm">{member.relation_type}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setEditingMember(member)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => handleDelete(member.id)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      {(member.date_of_birth || member.birthDate) && (
        <p className="text-gray-400 text-sm">
          Born:{" "}
          {new Date(
            member.date_of_birth || member.birthDate
          ).toLocaleDateString()}
        </p>
      )}
      {(member.linked_galixee_user_id || member.isGalixeeUser) && (
        <div className="mt-2 flex items-center text-[#6366F1] text-sm">
          <i className="fas fa-link mr-1"></i>
          <span>Galixee User</span>
        </div>
      )}
    </div>
  );

  const CosmicTreeView = ({ members }) => {
    const [scale, setScale] = useState(0.8);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [hoveredMember, setHoveredMember] = useState(null);
    const containerRef = useRef(null);
    const { data: currentUser } = useUser();

    // Generate stars for background
    const [backgroundStars] = useState(() => {
      const stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({
          id: i,
          x: Math.random() * 2000,
          y: Math.random() * 1200,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.8 + 0.2,
          twinkleDelay: Math.random() * 4,
        });
      }
      return stars;
    });

    // Helper function to get relationship category
    const getRelationshipCategory = (relationship) => {
      const parentRelations = ["Mother", "Father"];
      const siblingRelations = ["Sister", "Brother"];
      const spouseRelations = ["Wife", "Husband"];
      const childRelations = ["Son", "Daughter", "Stepdaughter", "Stepson"];
      const grandparentRelations = [
        "Maternal Grandfather",
        "Maternal Grandmother",
        "Paternal Grandfather",
        "Paternal Grandmother",
      ];

      if (parentRelations.includes(relationship)) return "parent";
      if (siblingRelations.includes(relationship)) return "sibling";
      if (spouseRelations.includes(relationship)) return "spouse";
      if (childRelations.includes(relationship)) return "child";
      if (grandparentRelations.includes(relationship)) return "grandparent";
      return "other";
    };

    // Organize members by their relationship to the user
    const organizeMembers = () => {
      const organized = {
        center: { x: 0, y: 0 }, // User position
        parents: [],
        grandparents: [],
        siblings: [],
        spouses: [],
        children: [],
        others: [],
      };

      members.forEach((member) => {
        const category = getRelationshipCategory(member.relation_type);
        switch (category) {
          case "parent":
            organized.parents.push(member);
            break;
          case "grandparent":
            organized.grandparents.push(member);
            break;
          case "sibling":
            organized.siblings.push(member);
            break;
          case "spouse":
            organized.spouses.push(member);
            break;
          case "child":
            organized.children.push(member);
            break;
          default:
            organized.others.push(member);
        }
      });

      return organized;
    };

    // Get cosmic element for each relationship
    const getCosmicElement = (relationship, isUser = false) => {
      if (isUser)
        return { type: "sun", icon: "☉", color: "#FFD700", glow: "#FFFF80" };

      const relationships = {
        Mother: {
          type: "planet",
          icon: "♀",
          color: "#FF69B4",
          glow: "#FFB6C1",
        },
        Father: {
          type: "planet",
          icon: "♂",
          color: "#4169E1",
          glow: "#87CEEB",
        },
        Wife: {
          type: "binary-star",
          icon: "♀",
          color: "#FF1493",
          glow: "#FF69B4",
        },
        Husband: {
          type: "binary-star",
          icon: "♂",
          color: "#1E90FF",
          glow: "#87CEEB",
        },
        Son: { type: "star", icon: "★", color: "#00CED1", glow: "#AFEEEE" },
        Daughter: {
          type: "star",
          icon: "★",
          color: "#DA70D6",
          glow: "#DDA0DD",
        },
        Sister: { type: "star", icon: "✦", color: "#FF6347", glow: "#FFA07A" },
        Brother: { type: "star", icon: "✦", color: "#32CD32", glow: "#90EE90" },
        "Maternal Grandfather": {
          type: "giant-star",
          icon: "⊙",
          color: "#B8860B",
          glow: "#F0E68C",
        },
        "Paternal Grandfather": {
          type: "giant-star",
          icon: "⊙",
          color: "#8B4513",
          glow: "#DEB887",
        },
        "Maternal Grandmother": {
          type: "giant-star",
          icon: "○",
          color: "#9370DB",
          glow: "#DDA0DD",
        },
        "Paternal Grandmother": {
          type: "giant-star",
          icon: "○",
          color: "#CD853F",
          glow: "#F5DEB3",
        },
      };

      return (
        relationships[relationship] || {
          type: "star",
          icon: "✧",
          color: "#FFFFFF",
          glow: "#F0F8FF",
        }
      );
    };

    // Calculate positions for cosmic layout
    const calculateCosmicPositions = () => {
      const organized = organizeMembers();
      const spacing = { x: 300, y: 250 }; // Increased spacing to prevent overlap
      const positions = new Map();

      // Center (User as Sun)
      positions.set("user", { x: 0, y: 0 });

      // Helper function to determine if relationship is maternal or paternal
      const isMaternalRelationship = (relationship) => {
        return relationship.includes("Maternal") || relationship === "Mother";
      };

      const isPaternalRelationship = (relationship) => {
        return relationship.includes("Paternal") || relationship === "Father";
      };

      // Separate parents into maternal and paternal
      const maternalParents = organized.parents.filter((p) =>
        isMaternalRelationship(p.relation_type)
      );
      const paternalParents = organized.parents.filter((p) =>
        isPaternalRelationship(p.relation_type)
      );

      // Position maternal parents on the left side above user
      maternalParents.forEach((parent, i) => {
        const x = -spacing.x * 0.8 - i * spacing.x * 0.3; // Left side, spread out if multiple
        positions.set(parent.id, { x, y: -spacing.y });
      });

      // Position paternal parents on the right side above user
      paternalParents.forEach((parent, i) => {
        const x = spacing.x * 0.8 + i * spacing.x * 0.3; // Right side, spread out if multiple
        positions.set(parent.id, { x, y: -spacing.y });
      });

      // Separate grandparents into maternal and paternal
      const maternalGrandparents = organized.grandparents.filter((g) =>
        isMaternalRelationship(g.relation_type)
      );
      const paternalGrandparents = organized.grandparents.filter((g) =>
        isPaternalRelationship(g.relation_type)
      );

      // Position maternal grandparents on the left side above maternal parents
      maternalGrandparents.forEach((grandparent, i) => {
        const baseX = -spacing.x * 1.2; // Further left than maternal parents
        const offsetX =
          (i - (maternalGrandparents.length - 1) / 2) * spacing.x * 0.6;
        positions.set(grandparent.id, {
          x: baseX + offsetX,
          y: -spacing.y * 2,
        });
      });

      // Position paternal grandparents on the right side above paternal parents
      paternalGrandparents.forEach((grandparent, i) => {
        const baseX = spacing.x * 1.2; // Further right than paternal parents
        const offsetX =
          (i - (paternalGrandparents.length - 1) / 2) * spacing.x * 0.6;
        positions.set(grandparent.id, {
          x: baseX + offsetX,
          y: -spacing.y * 2,
        });
      });

      // Position spouses closer to the user
      organized.spouses.forEach((spouse, i) => {
        const isEven = i % 2 === 0;
        const sideMultiplier = isEven ? 1 : -1; // Right side for even indices, left for odd
        const offset = Math.floor(i / 2) + 1; // How far from center
        positions.set(spouse.id, {
          x: sideMultiplier * spacing.x * 0.6 * offset, // Reduced from 1.0 to 0.6 for closer positioning
          y: 0,
        });
      });

      // Position children directly below user
      organized.children.forEach((child, i) => {
        const centerOffset = (organized.children.length - 1) / 2;
        const x = (i - centerOffset) * spacing.x * 0.8; // Consistent with parents spacing
        positions.set(child.id, { x, y: spacing.y });
      });

      // Position siblings to the left and right, slightly offset vertically
      organized.siblings.forEach((sibling, i) => {
        const isEven = i % 2 === 0;
        const sideMultiplier = isEven ? -1 : 1; // Left side for even indices, right for odd
        const offset = Math.floor(i / 2) + 1;
        const verticalOffset = ((i % 4) - 1.5) * spacing.y * 0.3; // Slight vertical spread
        positions.set(sibling.id, {
          x: sideMultiplier * spacing.x * 1.5 * offset,
          y: verticalOffset,
        });
      });

      // Position others in outer constellation with better spacing
      organized.others.forEach((other, i) => {
        const angle = (2 * Math.PI * i) / organized.others.length;
        const radius = spacing.x * 2.5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        positions.set(other.id, { x, y });
      });

      return positions;
    };

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleChange = delta > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * scaleChange, 0.1), 2);
      setScale(newScale);
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        // Left click only
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const renderConstellationLines = () => {
      const positions = calculateCosmicPositions();
      const userPos = positions.get("user");

      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <linearGradient
              id="constellationGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop
                offset="0%"
                style={{ stopColor: "#4FD1C5", stopOpacity: 0.6 }}
              />
              <stop
                offset="50%"
                style={{ stopColor: "#6366F1", stopOpacity: 0.4 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#FF6B6B", stopOpacity: 0.6 }}
              />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {members.map((member) => {
            const pos = positions.get(member.id);
            if (!pos) return null;

            return (
              <line
                key={`constellation-${member.id}`}
                x1={userPos.x}
                y1={userPos.y}
                x2={pos.x}
                y2={pos.y}
                stroke="url(#constellationGradient)"
                strokeWidth="2"
                filter="url(#glow)"
                className="opacity-70"
              />
            );
          })}
        </svg>
      );
    };

    const CosmicNode = ({ member, position, isUser = false }) => {
      const cosmic = getCosmicElement(member?.relation_type, isUser);
      const isHovered = hoveredMember === (member?.id || "user");

      return (
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: `translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`,
          }}
          onMouseEnter={() => setHoveredMember(member?.id || "user")}
          onMouseLeave={() => setHoveredMember(null)}
          onClick={() =>
            setSelectedMember(
              member || {
                name: currentUser?.name || "You",
                relation_type: "Center",
                isUser: true,
              }
            )
          }
        >
          <div
            className="relative flex items-center justify-center text-4xl font-bold transition-all duration-300"
            style={{
              color: cosmic.color,
              textShadow: `0 0 20px ${cosmic.glow}`,
              filter: `drop-shadow(0 0 10px ${cosmic.glow})`,
            }}
          >
            {cosmic.icon}

            {/* Pulsing glow effect */}
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                backgroundColor: cosmic.glow,
                opacity: isHovered ? 0.3 : 0.1,
                filter: "blur(10px)",
                transform: "scale(1.5)",
              }}
            />

            {/* Orbital rings for planets */}
            {cosmic.type === "planet" && (
              <div
                className="absolute border border-opacity-30 rounded-full animate-spin"
                style={{
                  borderColor: cosmic.color,
                  width: "80px",
                  height: "80px",
                  animationDuration: "10s",
                  animationDirection:
                    Math.random() > 0.5 ? "normal" : "reverse",
                }}
              />
            )}

            {/* Name and relationship labels */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 text-center">
              <div
                className="bg-black bg-opacity-60 px-2 py-1 rounded text-white text-sm whitespace-nowrap mb-1"
                style={{ fontSize: "12px" }}
              >
                {member?.name || currentUser?.name || "You"}
              </div>
              {!isUser && member?.relation_type && (
                <div
                  className="bg-black bg-opacity-60 px-2 py-1 rounded text-gray-300 text-xs whitespace-nowrap"
                  style={{ fontSize: "10px" }}
                >
                  {member.relation_type}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };

    if (!members.length) return null;

    const positions = calculateCosmicPositions();

    return (
      <div className="relative w-full h-[700px] border border-[#333333] rounded-xl overflow-hidden bg-gradient-to-b from-[#0B0B1A] via-[#1A0B2E] to-[#2D1B69]">
        {/* Background stars */}
        {backgroundStars.map((star) => (
          <div
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: `${star.x}px`,
              top: `${star.y}px`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              animationDelay: `${star.twinkleDelay}s`,
              animationDuration: "4s",
            }}
          />
        ))}

        {/* Nebula effects */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-[100px] opacity-20 animate-pulse" />
        <div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full filter blur-[80px] opacity-15 animate-pulse"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-3/4 left-3/4 w-48 h-48 bg-pink-500 rounded-full filter blur-[60px] opacity-10 animate-pulse"
          style={{ animationDelay: "1s" }}
        />

        {/* Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-black bg-opacity-60 p-2 rounded-lg backdrop-blur-sm">
          <button
            onClick={() => setScale((scale) => Math.min(scale * 1.2, 2))}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444] text-white"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button
            onClick={() => setScale((scale) => Math.max(scale * 0.8, 0.1))}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444] text-white"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            onClick={() => {
              setScale(0.8);
              setPosition({ x: 0, y: 0 });
            }}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444] text-white"
          >
            <i className="fas fa-home"></i>
          </button>
        </div>

        {/* Interactive area */}
        <div
          ref={containerRef}
          className="w-full h-full cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="relative transform origin-center transition-transform duration-200"
            style={{
              transform: `translate(${
                position.x + (containerRef.current?.clientWidth || 0) / 2
              }px, ${
                position.y + (containerRef.current?.clientHeight || 0) / 2
              }px) scale(${scale})`,
            }}
          >
            {renderConstellationLines()}

            {/* User Node (Center Sun) */}
            <CosmicNode position={positions.get("user")} isUser={true} />

            {/* Family Member Nodes */}
            {members.map((member) => {
              const pos = positions.get(member.id);
              if (!pos) return null;

              return (
                <CosmicNode key={member.id} member={member} position={pos} />
              );
            })}
          </div>
        </div>

        {/* Member Detail Modal */}
        {selectedMember && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border border-[#4FD1C5] rounded-xl p-6 max-w-md w-full mx-4 relative">
              <button
                onClick={() => setSelectedMember(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="text-center mb-4">
                <div
                  className="text-6xl mb-2"
                  style={{
                    color: getCosmicElement(
                      selectedMember.relation_type,
                      selectedMember.isUser
                    ).color,
                    filter: `drop-shadow(0 0 10px ${
                      getCosmicElement(
                        selectedMember.relation_type,
                        selectedMember.isUser
                      ).glow
                    })`,
                  }}
                >
                  {
                    getCosmicElement(
                      selectedMember.relation_type,
                      selectedMember.isUser
                    ).icon
                  }
                </div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {selectedMember.name}
                </h3>
                <p className="text-[#4FD1C5] text-lg">
                  {selectedMember.relation_type}
                </p>
              </div>

              <div className="space-y-3 text-gray-300">
                {selectedMember.date_of_birth && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-birthday-cake text-[#4FD1C5]"></i>
                    <span>
                      Born:{" "}
                      {new Date(
                        selectedMember.date_of_birth
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {selectedMember.current_city && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-map-marker-alt text-[#4FD1C5]"></i>
                    <span>
                      {selectedMember.current_city},{" "}
                      {selectedMember.current_state}
                    </span>
                  </div>
                )}
                {selectedMember.linked_galixee_user_id && (
                  <div className="flex items-center space-x-2">
                    <i className="fas fa-link text-[#6366F1]"></i>
                    <span>Connected Galixee User</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-gray-600">
                  <p className="text-sm text-gray-400 italic">
                    "
                    {
                      getCosmicElement(
                        selectedMember.relation_type,
                        selectedMember.isUser
                      ).type
                    }
                    " in your cosmic family constellation
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TreeView = ({ members }) => {
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);
    const { data: currentUser } = useUser();

    // Helper function to get relationship category
    const getRelationshipCategory = (relationship) => {
      const parentRelations = ["Mother", "Father"];
      const siblingRelations = ["Sister", "Brother"];
      const spouseRelations = ["Wife", "Husband"];
      const childRelations = ["Son", "Daughter", "Stepdaughter", "Stepson"];
      const grandparentRelations = [
        "Maternal Grandfather",
        "Maternal Grandmother",
        "Paternal Grandfather",
        "Paternal Grandmother",
      ];

      if (parentRelations.includes(relationship)) return "parent";
      if (siblingRelations.includes(relationship)) return "sibling";
      if (spouseRelations.includes(relationship)) return "spouse";
      if (childRelations.includes(relationship)) return "child";
      if (grandparentRelations.includes(relationship)) return "grandparent";
      return "other";
    };

    // Organize members by their relationship to the user
    const organizeMembers = () => {
      const organized = {
        center: { x: 0, y: 0 }, // User position
        parents: [],
        grandparents: [],
        siblings: [],
        spouses: [],
        children: [],
        others: [],
      };

      members.forEach((member) => {
        const category = getRelationshipCategory(member.relation_type);
        switch (category) {
          case "parent":
            organized.parents.push(member);
            break;
          case "grandparent":
            organized.grandparents.push(member);
            break;
          case "sibling":
            organized.siblings.push(member);
            break;
          case "spouse":
            organized.spouses.push(member);
            break;
          case "child":
            organized.children.push(member);
            break;
          default:
            organized.others.push(member);
        }
      });

      return organized;
    };

    // Calculate positions for all members
    const calculatePositions = () => {
      const organized = organizeMembers();
      const spacing = { x: 200, y: 150 }; // Spacing between nodes
      const positions = new Map();

      // Center (User)
      positions.set("user", { x: 0, y: 0 });

      // Position parents above
      organized.parents.forEach((parent, i) => {
        const x = -spacing.x / 2 + i * spacing.x;
        positions.set(parent.id, { x, y: -spacing.y });
      });

      // Position grandparents above parents
      organized.grandparents.forEach((grandparent, i) => {
        const x = -spacing.x * 1.5 + i * spacing.x;
        positions.set(grandparent.id, { x, y: -spacing.y * 2 });
      });

      // Position siblings to the left
      organized.siblings.forEach((sibling, i) => {
        positions.set(sibling.id, {
          x: -spacing.x * 1.5,
          y: -spacing.y / 2 + i * spacing.y,
        });
      });

      // Position spouses to the right
      organized.spouses.forEach((spouse, i) => {
        positions.set(spouse.id, { x: spacing.x, y: 0 });
      });

      // Position children below
      organized.children.forEach((child, i) => {
        const x = -spacing.x / 2 + i * spacing.x;
        positions.set(child.id, { x, y: spacing.y });
      });

      // Position others in a circular pattern
      organized.others.forEach((other, i) => {
        const angle = (2 * Math.PI * i) / organized.others.length;
        const radius = spacing.x * 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        positions.set(other.id, { x, y });
      });

      return positions;
    };

    useEffect(() => {
      if (!members.length || !containerRef.current) return;

      const positions = calculatePositions();
      const bounds = {
        minX: Math.min(...Array.from(positions.values()).map((p) => p.x)),
        maxX: Math.max(...Array.from(positions.values()).map((p) => p.x)),
        minY: Math.min(...Array.from(positions.values()).map((p) => p.y)),
        maxY: Math.max(...Array.from(positions.values()).map((p) => p.y)),
      };

      const padding = 100;
      const contentWidth = bounds.maxX - bounds.minX + padding * 2;
      const contentHeight = bounds.maxY - bounds.minY + padding * 2;

      const container = containerRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;

      const scaleX = containerWidth / contentWidth;
      const scaleY = containerHeight / contentHeight;
      const newScale = Math.min(scaleX, scaleY, 1);

      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      setScale(newScale);
      setPosition({ x: centerX, y: centerY });
    }, [members]);

    const handleWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      const scaleChange = delta > 0 ? 0.9 : 1.1;
      const newScale = Math.min(Math.max(scale * scaleChange, 0.1), 2);
      setScale(newScale);
    };

    const handleMouseDown = (e) => {
      if (e.button === 0) {
        // Left click only
        setIsDragging(true);
        setDragStart({
          x: e.clientX - position.x,
          y: e.clientY - position.y,
        });
      }
    };

    const handleMouseMove = (e) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const renderConnectingLines = () => {
      const positions = calculatePositions();
      const userPos = positions.get("user");

      return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6366F1" opacity="0.5" />
            </marker>
          </defs>
          {members.map((member) => {
            const pos = positions.get(member.id);
            if (!pos) return null;

            return (
              <g key={`line-${member.id}`}>
                <line
                  x1={userPos.x}
                  y1={userPos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="#333333"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <line
                  x1={userPos.x}
                  y1={userPos.y}
                  x2={pos.x}
                  y2={pos.y}
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  className="opacity-50"
                />
              </g>
            );
          })}
        </svg>
      );
    };

    if (!members.length) return null;

    const positions = calculatePositions();

    return (
      <div className="relative w-full h-[600px] border border-[#333333] rounded-xl overflow-hidden bg-[#1A1A1A]">
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-[#242424] p-2 rounded-lg">
          <button
            onClick={() => setScale((scale) => Math.min(scale * 1.2, 2))}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444]"
          >
            <i className="fas fa-plus"></i>
          </button>
          <button
            onClick={() => setScale((scale) => Math.max(scale * 0.8, 0.1))}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444]"
          >
            <i className="fas fa-minus"></i>
          </button>
          <button
            onClick={() => {
              setScale(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="w-8 h-8 flex items-center justify-center bg-[#333333] rounded hover:bg-[#444444]"
          >
            <i className="fas fa-home"></i>
          </button>
        </div>

        <div
          ref={containerRef}
          className="w-full h-full cursor-grab"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <div
            className="relative transform origin-center transition-transform duration-200"
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            }}
          >
            {renderConnectingLines()}

            {/* User Node (Center) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: `${positions.get("user").x}px`,
                top: `${positions.get("user").y}px`,
              }}
            >
              <div className="bg-[#6366F1] border-2 border-white rounded-lg p-4 shadow-lg">
                <h4 className="text-lg font-bold text-white">
                  {currentUser?.name || "You"}
                </h4>
                <p className="text-sm text-white opacity-75">Center</p>
              </div>
            </div>

            {/* Family Member Nodes */}
            {members.map((member) => {
              const pos = positions.get(member.id);
              if (!pos) return null;

              return (
                <div
                  key={member.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                  }}
                >
                  <div className="bg-[#242424] border border-[#333333] rounded-lg p-4 shadow-lg hover:border-[#6366F1] transition-colors">
                    <h4 className="text-lg font-bold text-white">
                      {member.name}
                    </h4>
                    <p className="text-sm text-gray-400">
                      {member.relation_type}
                    </p>
                    {member.date_of_birth && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(member.date_of_birth).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
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
            Family Cosmos
          </h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsAddingMember(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
            >
              <i className="fas fa-plus"></i>
              <span>Add Family Member</span>
            </button>
            <button
              onClick={handleCreateTree}
              disabled={treeLoading || familyMembers.length === 0}
              className="flex items-center space-x-2 px-4 py-2 border-2 border-[#6366F1] hover:bg-[#6366F1] rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {treeLoading ? (
                <span>Creating Tree...</span>
              ) : (
                <>
                  <i className="fas fa-tree mr-2"></i>
                  {treeView ? "Update Tree" : "Display My Family Galixee"}
                </>
              )}
            </button>
            {treeView && (
              <button
                onClick={() => setTreeView(false)}
                className="flex items-center space-x-2 px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:border-[#6366F1] hover:text-white transition-colors"
              >
                <i className="fas fa-list mr-2"></i>
                List View
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 rounded-lg text-green-400">
            {success}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : familyMembers.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No family members added yet
          </div>
        ) : treeView ? (
          <CosmicTreeView members={familyMembers} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {familyMembers.map((member) => (
              <FamilyTreeNode key={member.id} member={member} />
            ))}
          </div>
        )}

        {(isAddingMember || editingMember) && (
          <FamilyMemberForm
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsAddingMember(false);
              setEditingMember(null);
            }}
            initialData={editingMember}
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
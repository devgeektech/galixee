"use client";
import { React, useState, useEffect, useRef } from "react";
import useUser from '../../components/use-user'

function MainComponent() {
  const { data: user, loading: userLoading } = useUser();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  const [newQuote, setNewQuote] = useState({
    quote_text: "",
    author: "",
    category: "",
    source: "",
    notes: "",
  });

  const categories = [
    "Inspirational",
    "Motivational",
    "Life",
    "Success",
    "Love",
    "Wisdom",
    "Funny",
    "Business",
    "Leadership",
    "Philosophy",
    "Science",
    "Art",
    "Other",
  ];

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) {
      const currentPath = encodeURIComponent(window.location.pathname);
      window.location.href = `/account/signin?callbackUrl=${currentPath}`;
      return;
    }
    if (userLoading || !user) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchQuotes();
  }, [user, userLoading]);

  const fetchQuotes = async () => {
    try {
      const response = await fetch("/api/quotes-handler", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // body: JSON.stringify({ method: "GET" }),
      });

      if (!response.ok) throw new Error("Failed to fetch quotes");

      const result = await response.json();
      setQuotes(result.quotes || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching quotes:", err);
      setError("Could not load quotes");
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuote = async (data) => {
    // e?.preventDefault();
    try {
      const response = await fetch("/api/quotes-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "POST",
          ...data,
        }),
      });

      if (!response.ok) throw new Error("Failed to add quote");

      const result = await response.json();
      setQuotes([result.quote, ...quotes]);
      setNewQuote({
        quote_text: "",
        author: "",
        category: "",
        source: "",
        notes: "",
      });
      setIsAddingQuote(false);
      setError(null);
    } catch (err) {
      console.error("Error adding quote:", err);
      setError("Could not add quote");
    }
  };

  const handleUpdateQuote = async (quoteId, updatedData) => {
    try {
      const response = await fetch("/api/quotes-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "PUT",
          id: quoteId,
          ...updatedData,
        }),
      });

      if (!response.ok) throw new Error("Failed to update quote");

      const result = await response.json();
      setQuotes(quotes.map((q) => (q.id === quoteId ? result.quote : q)));
      setEditingQuote(null);
      setError(null);
    } catch (err) {
      console.error("Error updating quote:", err);
      setError("Could not update quote");
    }
  };

  const handleDeleteQuote = async (quoteId) => {
    if (!window.confirm("Are you sure you want to delete this quote?")) {
      return;
    }

    try {
      const response = await fetch("/api/quotes-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "DELETE",
          id: quoteId,
        }),
      });

      if (!response.ok) throw new Error("Failed to delete quote");

      setQuotes(quotes?.filter((q) => q.id !== quoteId));
      setError(null);
    } catch (err) {
      console.error("Error deleting quote:", err);
      setError("Could not delete quote");
    }
  };

  const handleToggleFavorite = async (quoteId, currentFavorite) => {
    try {
      const response = await fetch("/api/quotes-handler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "PUT",
          id: quoteId,
          is_favorite: !currentFavorite,
        }),
      });

      if (!response.ok) throw new Error("Failed to update favorite");

      const result = await response.json();
      setQuotes(quotes.map((q) => (q.id === quoteId ? result.quote : q)));
      setError(null);
    } catch (err) {
      console.error("Error updating favorite:", err);
      setError("Could not update favorite");
    }
  };

  const filteredQuotes = quotes?.filter((quote) => {
    const matchesSearch =
      quote?.quote_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote?.author?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      !selectedCategory || quote.category === selectedCategory;
    const matchesFavorites = !showFavoritesOnly || quote.is_favorite;

    return matchesSearch && matchesCategory && matchesFavorites;
  });

  const QuoteForm = ({ quote = null, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState(
      quote || {
        quote_text: "",
        author: "",
        category: "",
        source: "",
        notes: "",
      }
    );

    const handleSubmit = (e) => {
      e.preventDefault();
      console.log('hhhhhhhhhhh')
      onSubmit(formData);
    };

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
        onClick={onCancel}
      >
        <div
          className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-xl font-bold mb-4 text-white">
            {quote ? "Edit Quote" : "Add New Quote"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Quote Text *
              </label>
              <textarea
                value={formData.quote_text}
                onChange={(e) =>
                  setFormData({ ...formData, quote_text: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white min-h-[100px]"
                required
                placeholder="Enter the quote..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Author *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) =>
                    setFormData({ ...formData, author: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                  required
                  placeholder="Quote author"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) =>
                  setFormData({ ...formData, source: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                placeholder="Book, speech, movie, etc."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
                rows="3"
                placeholder="Personal notes about this quote..."
              />
            </div>
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-[#333333] rounded-lg text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#6366F1] hover:bg-[#4F46E5] rounded-lg text-white transition-colors"
              >
                {quote ? "Update Quote" : "Add Quote"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const QuoteCard = ({ quote }) => (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 hover:border-[#6366F1] transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <blockquote className="text-white text-lg mb-3 italic">
            "{quote.quote_text}"
          </blockquote>
          <p className="text-[#6366F1] font-medium">— {quote.author}</p>
          {quote.source && (
            <p className="text-gray-400 text-sm mt-1">Source: {quote.source}</p>
          )}
          {quote.category && (
            <span className="inline-block bg-[#242424] text-[#4FD1C5] px-2 py-1 rounded text-xs mt-2">
              {quote.category}
            </span>
          )}
          {quote.notes && (
            <p className="text-gray-400 text-sm mt-3 bg-[#242424] p-3 rounded">
              <i className="fas fa-sticky-note mr-2"></i>
              {quote.notes}
            </p>
          )}
        </div>
        <div className="flex flex-col space-y-2 ml-4">
          <button
            onClick={() => handleToggleFavorite(quote.id, quote.is_favorite)}
            className={`p-2 rounded transition-colors ${
              quote.is_favorite
                ? "text-yellow-400 hover:text-yellow-300"
                : "text-gray-400 hover:text-yellow-400"
            }`}
            title={
              quote.is_favorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            <i
              className={`fas ${quote.is_favorite ? "fa-star" : "fa-star"}`}
            ></i>
          </button>
          <button
            onClick={() => setEditingQuote(quote)}
            className="text-gray-400 hover:text-[#6366F1] p-2 rounded transition-colors"
            title="Edit quote"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            onClick={() => handleDeleteQuote(quote.id)}
            className="text-gray-400 hover:text-red-400 p-2 rounded transition-colors"
            title="Delete quote"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div className="text-gray-400 text-xs">
        Added: {new Date(quote.created_at).toLocaleDateString()}
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
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <h1 className="text-4xl font-bold mb-4 md:mb-0 bg-clip-text text-transparent bg-gradient-to-r from-[#6366F1] to-[#4FD1C5]">
            My Quotes
          </h1>
          <button
            onClick={() => setIsAddingQuote(true)}
            className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center"
          >
            <i className="fas fa-plus mr-2"></i>
            Add Quote
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <div className="bg-[#1A1A1A] border border-[#333333] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search Quotes
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 pl-10 text-white"
                  placeholder="Search quotes or authors..."
                />
                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-[#242424] border border-[#333333] rounded-lg px-4 py-2 text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                  className="rounded bg-[#242424] border-[#333333] text-[#6366F1]"
                />
                <span className="text-gray-300">Favorites Only</span>
              </label>
            </div>
            <div className="flex items-end">
              <div className="text-gray-400 text-sm">
                {filteredQuotes.length} of {quotes.length} quotes
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-[#6366F1] text-2xl mb-4"></i>
            <p>Loading quotes...</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-quote-left text-[#6366F1] text-4xl mb-4"></i>
            <h3 className="text-xl font-bold text-white mb-2">
              {quotes.length === 0
                ? "No quotes yet"
                : "No quotes match your filters"}
            </h3>
            <p className="text-gray-400 mb-6">
              {quotes.length === 0
                ? "Start building your collection of inspiring quotes"
                : "Try adjusting your search or filters"}
            </p>
            {quotes.length === 0 && (
              <button
                onClick={() => setIsAddingQuote(true)}
                className="bg-[#6366F1] hover:bg-[#4F46E5] px-6 py-3 rounded-lg text-white transition-colors"
              >
                Add Your First Quote
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredQuotes.map((quote) => (
              <QuoteCard key={quote.id} quote={quote} />
            ))}
          </div>
        )}
      </main>

      {isAddingQuote && (
        <QuoteForm
          onSubmit={(data)=>handleAddQuote(data)}
          onCancel={() => setIsAddingQuote(false)}
        />
      )}

      {editingQuote && (
        <QuoteForm
          quote={editingQuote}
          onSubmit={(formData) => handleUpdateQuote(editingQuote.id, formData)}
          onCancel={() => setEditingQuote(null)}
        />
      )}

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none opacity-5 z-0">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#FF6B6B] rounded-full filter blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#4FD1C5] rounded-full filter blur-[100px]"></div>
      </div>
    </div>
  );
}

export default MainComponent;
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

export default function SearchBar({
  placeholder = "Search directory…",
  className = "",
  inputClassName = "",
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const abortRef = useRef(null);

  const looksLikeEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowResults(val.trim().length > 0);
  };

  const handleSelect = (item) => {
    if (item?.user) {
      navigate(`/dashboard/profiles/${item.user}`);
    } else {
      navigate(`/dashboard/directory?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery("");
    setShowResults(false);
    setResults([]);
  };

  // Debounced search (with axios + AbortController)
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    const t = setTimeout(async () => {
      try {
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        const isEmail = looksLikeEmail(q);

        setLoading(true);
        setError("");

        const res = await axiosInstance.get("/profile/directory", {
          params: {
            page: 1,
            limit: 10,
            [isEmail ? "email" : "name"]: q,
          },
          signal: abortRef.current.signal, // axios v1+ supports AbortController
          withCredentials: true, // redundant if set in instance, but harmless
        });

        const items = Array.isArray(res?.data?.data) ? res.data.data : [];
        setResults(items);
      } catch (err) {
        // Ignore aborts; surface other errors
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setError(err?.response?.data?.message || err?.message || "Something went wrong.");
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 bg-white/80 px-4 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition ${inputClassName}`}
        onFocus={() => setShowResults(query.trim().length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
      />

      {showResults && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md z-50 max-h-80 overflow-auto">
          {loading && (
            <div className="px-4 py-2 text-sm text-gray-600">Searching…</div>
          )}

          {!loading && error && (
            <div className="px-4 py-2 text-sm text-red-600">{error}</div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-600">No results found</div>
          )}

          {!loading &&
            !error &&
            results.map((item) => (
              <div
                key={item._id}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-orange-50"
              >
                <img
                  src={
                    item.profilePicUrl
                      ? item.profilePicUrl
                      : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                          item.name || "U"
                        )}`
                  }
                  alt={item.name || "User"}
                  className="h-8 w-8 rounded-full object-cover border border-gray-200"
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {item.name || "Unnamed"}
                  </div>
                  <div className="text-xs text-gray-600 truncate">
                    {item.email || "—"}
                  </div>
                </div>
                {item.education?.degreeTitle ? (
                  <div className="ml-auto text-[11px] text-gray-500">
                    {item.education.degreeTitle}
                  </div>
                ) : null}
              </div>
            ))}

          {!loading && results.length > 0 && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                navigate(`/dashboard/directory?q=${encodeURIComponent(query.trim())}`)
              }
              className="px-4 py-2 text-sm text-orange-700 hover:bg-orange-100 border-t border-gray-100 cursor-pointer"
            >
              Open full directory
            </div>
          )}
        </div>
      )}
    </div>
  );
}

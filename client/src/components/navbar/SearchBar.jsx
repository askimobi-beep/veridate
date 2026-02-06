import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

const tokenStartsWithQuery = (value, query) => {
  if (!value) return false;
  const lower = value.toLowerCase();
  if (lower.startsWith(query)) return true;
  return lower
    .split(/[\s@._-]+/)
    .some((token) => token.length && token.startsWith(query));
};

const matchesQuery = (item, rawQuery, isEmailQuery = false) => {
  if (!rawQuery) return false;
  const query = rawQuery.toLowerCase();

  const name = item?.name || "";
  const email = item?.email || "";
  const degreeList = Array.isArray(item?.education)
    ? item.education.map((edu) => edu?.degreeTitle || "")
    : typeof item?.education === "object" && item?.education
    ? [item.education.degreeTitle || ""]
    : [];
  const jobTitles = Array.isArray(item?.experience)
    ? item.experience.map((exp) => exp?.jobTitle || "")
    : [];

  return (
    tokenStartsWithQuery(name, query) ||
    degreeList.some((degree) => tokenStartsWithQuery(degree, query)) ||
    jobTitles.some((title) => tokenStartsWithQuery(title, query)) ||
    (isEmailQuery && tokenStartsWithQuery(email, query))
  );
};

export default function SearchBar({
  placeholder = "Search Candidate by Name, Email, Degree Title and Job Title",
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
        const filtered = items.filter((item) => matchesQuery(item, q, isEmail));
        setResults(filtered);
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
        className={`w-full border rounded-xl border-gray-300 bg-white/80 px-4 py-2 text-sm outline-none focus:border-[color:var(--brand-orange)] focus:ring-2 focus:ring-[color:var(--brand-orange)] transition ${inputClassName}`}
        onFocus={() => setShowResults(query.trim().length > 0)}
        onBlur={() => setTimeout(() => setShowResults(false), 150)}
      />

      {showResults && (
        <div className="absolute  mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-md z-50 max-h-80 overflow-auto">
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
                className="flex items-center gap-3 px-4 py-2 cursor-pointer hover:brand-orange-soft"
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
{/* 
          {!loading && results.length > 0 && (
            <div
              onMouseDown={(e) => e.preventDefault()}
              onClick={() =>
                navigate(`/dashboard/directory?q=${encodeURIComponent(query.trim())}`)
              }
              className="px-4 py-2 text-sm text-[color:var(--brand-orange)] hover:brand-orange-soft border-t border-gray-100 cursor-pointer"
            >
              Open full directory
            </div>
          )} */}
        </div>
      )}
    </div>
  );
}

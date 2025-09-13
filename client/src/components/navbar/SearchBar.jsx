import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SearchBar({
  placeholder = "Search directory…",
  className = "",
  inputClassName = "",
}) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setShowResults(val.trim().length > 0);
  };

  const handleSelect = () => {
    navigate("/dashboard/directory");
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className={`relative w-full ${className}`}>
      <input
        type="search"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full border border-gray-300 bg-white/80 px-4 py-2 text-sm outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition ${inputClassName}`}
      />

      {showResults && (
        <div className="absolute mt-1 w-full bg-white border border-gray-200 rounded-md shadow-md z-50">
          <div
            onClick={handleSelect}
            className="px-4 py-2 cursor-pointer hover:bg-orange-100"
          >
            Directory
          </div>
        </div>
      )}
    </div>
  );
}

// Navbar.jsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import logo from "@/assets/logo/logo.png";
import UserMenu from "@/components/navbar/UserMenu";
import SearchBar from "./SearchBar";

export default function Navbar() {
  const { user, logout, authLoading } = useAuth();
  const role = String(user?.role || "").toLowerCase().trim();
  const canSearch = !user || role === "user";

  const navigate = useNavigate();
  const { pathname } = useLocation(); // keeping in case you style active states later

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login", { replace: true, state: null });
    } catch (err) {
      console.error("Logout failed", err);
    }
  }, [logout, navigate]);

  const goDirectory = (q) => {
    if (role && role !== "user") return;
    if (q && q.length > 0) {
      navigate(`/dashboard/directory?q=${encodeURIComponent(q)}`);
    } else {
      navigate("/dashboard/directory");
    }
  };

  return (
    <header className="w-full bg-transparent backdrop-blur">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6">
        {/* 3-col: search | logo | user */}
        <div className="h-16 grid grid-cols-3 items-center gap-3">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="Veridate Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Center: Directory Search */}
          <div className="flex items-center justify-center">
            {canSearch ? <SearchBar onSearch={goDirectory} /> : null}
          </div>

          {/* Right: User menu / Login */}
          <div className="flex items-center justify-end gap-3">
            {!authLoading && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              !authLoading && (
                <Link to="/login">
                  <Button className="rounded-full bg-orange-600 hover:bg-orange-700 text-white px-4">
                    Login
                  </Button>
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

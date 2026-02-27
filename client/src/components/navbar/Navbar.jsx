import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Search } from "lucide-react";
import logo from "@/assets/logo/logo.png";
import UserMenu from "@/components/navbar/UserMenu";
import NotificationBell from "@/components/navbar/NotificationBell";

export default function Navbar() {
  const { user, logout, authLoading } = useAuth();
  const role = String(user?.role || "").toLowerCase().trim();
  const canAccessDirectory = !user || role === "user";

  const navigate = useNavigate();
  const { pathname } = useLocation();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/login", { replace: true, state: null });
    } catch (err) {
      console.error("Logout failed", err);
    }
  }, [logout, navigate]);

  const goDirectory = () => {
    if (role && role !== "user") return;
    navigate("/dashboard/directory");
  };

  const goJobs = () => {
    if (role && role !== "user") return;
    navigate("/dashboard/jobs");
  };

  return (
    <header className="w-full bg-transparent backdrop-blur">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6">
        {/* 3-col: logo | search buttons | user */}
        <div className="h-16 grid grid-cols-3 items-center gap-3">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="Veridate Logo" className="h-12 w-auto" />
            </Link>
          </div>

          {/* Center: Search Candidates + Search Jobs */}
          <div className="flex items-center justify-center gap-3">
            {canAccessDirectory ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goDirectory}
                  className="h-9 w-44 justify-center rounded-full border-[color:var(--brand-orange)] text-[color:var(--brand-orange)] hover:brand-orange-soft gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Search Candidates</span>
                  <span className="sm:hidden">Candidates</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={goJobs}
                  className="h-9 w-44 justify-center rounded-full border-[color:var(--brand-orange)] text-[color:var(--brand-orange)] hover:brand-orange-soft gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97]"
                >
                  <Search className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">Search Jobs</span>
                  <span className="sm:hidden">Jobs</span>
                </Button>
              </>
            ) : null}
          </div>

          {/* Right: User menu / Login */}
          <div className="flex items-center justify-end gap-3">
            {!authLoading && user ? (
              <>
                <NotificationBell />
                <UserMenu user={user} onLogout={handleLogout} />
              </>
            ) : (
              !authLoading && (
                <Link to="/login">
                  <Button className="rounded-full bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] text-white px-4">
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

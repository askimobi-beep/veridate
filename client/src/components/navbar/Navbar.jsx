// Navbar.jsx
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import logo from "@/assets/logo/logo.png";
import UserMenu from "@/components/navbar/UserMenu";
import CreditsPill from "@/components/navbar/CreditsPill";

export default function Navbar() {
  const { user, logout, authLoading } = useAuth(); // ⬅️ get loading
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

  const NavItem = ({ to, label }) => {
    const active = pathname === to;
    return (
      <Link to={to}>
        <Button
          variant={active ? "default" : "ghost"}
          className={`rounded-full px-4 ${active ? "bg-orange-600 text-white hover:bg-orange-700" : "text-gray-700 hover:bg-white/70"}`}
        >
          {label}
        </Button>
      </Link>
    );
  };

  return (
    <header className="w-full bg-transparent backdrop-blur">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6">
        <div className="h-16 flex items-center justify-between gap-3">
          <Link to="/" className="inline-flex items-center">
            <img src={logo} alt="Veridate Logo" className="h-12 w-auto" />
          </Link>

          <nav className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1 sm:gap-2">
              <NavItem to="/dashboard/directory" label="Directory" />
              <NavItem to="/" label="Home" />
              <NavItem to="/about" label="About" />
              <NavItem to="/contact" label="Contact" />
            </div>
          </nav>

          <div className="flex items-center gap-3">
            {/* show skeleton while loading to avoid 0/0 flash */}
            {!authLoading && user && (
              <CreditsPill credit={user.verifyCredits || user.credit} />
            )}
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

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { Home, Users, Briefcase, UserSearch, MessageSquare } from "lucide-react";
import logo from "@/assets/logo/logo.png";
import UserMenu from "@/components/navbar/UserMenu";
import NotificationBell from "@/components/navbar/NotificationBell";

const NAV_ITEMS = [
  { key: "home",   label: "Home",   icon: Home,           path: "/dashboard" },
  { key: "peers",  label: "Peers",  icon: Users,          path: "/dashboard/peers" },
  { key: "jobs",   label: "Jobs",   icon: Briefcase,      path: "/dashboard/jobs" },
  { key: "talent", label: "Talent", icon: UserSearch,      path: "/dashboard/directory" },
  { key: "inbox",  label: "Inbox",  icon: MessageSquare,  path: "/dashboard/inbox" },
];

export default function Navbar() {
  const { user, logout, authLoading } = useAuth();
  const role = String(user?.role || "").toLowerCase().trim();

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

  const isActive = (path) => {
    if (path === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(path);
  };

  return (
    <header className="w-full bg-white">
      <div className="w-full mx-auto px-3 sm:px-4 md:px-6">
        {/* 3-col: logo | nav links | user */}
        <div className="h-14 grid grid-cols-[auto_1fr_auto] items-center gap-3">
          {/* Left: Logo */}
          <div className="flex items-center">
            <Link to="/" className="inline-flex items-center">
              <img src={logo} alt="Veridate Logo" className="h-10 w-auto" />
            </Link>
          </div>

          {/* Center: LinkedIn-style nav icons */}
          {user && (
            <nav className="flex items-center justify-center">
              {NAV_ITEMS.map(({ key, label, icon: Icon, path }) => {
                const active = isActive(path);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => navigate(path)}
                    className={`relative flex flex-col items-center justify-center px-5 py-1 transition-colors group ${
                      active ? "text-slate-900" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`} strokeWidth={active ? 2.2 : 1.8} />
                    <span className={`text-[11px] mt-0.5 leading-tight ${active ? "font-semibold" : "font-medium"}`}>{label}</span>
                    {active && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[calc(100%-16px)] bg-slate-900 rounded-full" />
                    )}
                  </button>
                );
              })}
            </nav>
          )}
          {!user && <div />}

          {/* Right: User menu / Login */}
          <div className="flex items-center justify-end gap-2">
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

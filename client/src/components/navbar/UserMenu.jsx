import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  LogOut,
  Settings,
  User,
  ChevronDown,
  GraduationCap,
  Briefcase,
} from "lucide-react";

function getInitial(name) {
  return (name?.trim()?.charAt(0) || "U").toUpperCase();
}

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const role = String(user?.role || "").toLowerCase().trim();
  const displayName =
    String(user?.organizationName || "").trim() ||
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    "User";
  const homePath =
    role === "admin" ? "/admin" : role === "company" || role === "university" ? "/org" : "/dashboard";

  // close on click outside
  useEffect(() => {
    function onDocClick(e) {
      if (!open) return;
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        btnRef.current &&
        !btnRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    function onEsc(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="group flex items-center gap-2 rounded-xl p-1.5 ring-1 ring-black/5 hover:bg-white/70 transition"
      >
        <Avatar className="h-9 w-9 ring-1 ring-black/5">
          <AvatarImage
            src={`${import.meta.env.VITE_API_PIC_URL}/uploads/profile/${
              user?.profilePic
            }`}
            alt={displayName}
            className="object-cover"
          />
          <AvatarFallback>{getInitial(displayName)}</AvatarFallback>
        </Avatar>
        <ChevronDown className="h-4 w-4 text-gray-500 transition-transform" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            role="menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 top-12 w-72 bg-white/90 backdrop-blur-xl shadow-2xl rounded-2xl ring-1 ring-black/5 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gradient-to-br from-white to-gray-50">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-black/5">
                  <AvatarImage
                    src={`${import.meta.env.VITE_API_PIC_URL}/uploads/profile/${
                      user?.profilePic
                    }`}
                    alt={displayName}
                  />
                  <AvatarFallback>{getInitial(displayName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="py-2">
              <button
                onClick={() => go(role === "user" ? "/dashboard/profile" : homePath)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <User className="h-4 w-4" />
                {role === "user" ? "Profile" : "Dashboard"}
              </button>

            </div>

            <div className="h-px bg-gray-100" />

            {/* Footer */}
            <div className="px-3 py-2">
              <Button
                onClick={async () => {
                  setOpen(false);
                  await onLogout?.();
                }}
                className="w-full justify-center rounded-xl bg-red-500 hover:bg-red-600 text-white"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogOut, Settings, User, ChevronDown, GraduationCap, Briefcase } from "lucide-react";

function getInitial(name) {
  return (name?.trim()?.charAt(0) || "U").toUpperCase();
}

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

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
        className="group flex items-center gap-2 rounded-full pl-1 pr-2 py-1.5 ring-1 ring-black/5 hover:bg-white/70 transition"
      >
        <Avatar className="h-9 w-9 ring-1 ring-black/5">
          <AvatarImage src={user?.picture} alt={user?.firstName} />
          <AvatarFallback>{getInitial(user?.firstName)}</AvatarFallback>
        </Avatar>
        <div className="hidden sm:flex flex-col items-start leading-tight">
          <span className="text-sm font-semibold text-gray-900">
            {user?.firstName}
          </span>
          <span className="text-[11px] text-gray-500 max-w-[180px] truncate">
            {user?.email}
          </span>
        </div>
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
                  <AvatarImage src={user?.picture} alt={user?.firstName} />
                  <AvatarFallback>{getInitial(user?.firstName)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {user?.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Credit block */}
            {/* {user?.credit && (
              <div className="px-3 pt-2">
                <Card className="p-3 shadow-none border bg-gray-50/70">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-700">
                      <GraduationCap className="h-4 w-4 text-orange-500" />
                      <span>Education</span>
                      <span className="ml-auto font-semibold">
                        {user.credit.education}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Briefcase className="h-4 w-4 text-blue-500" />
                      <span>Experience</span>
                      <span className="ml-auto font-semibold">
                        {user.credit.experience}
                      </span>
                    </div>
                  </div>
                </Card>
              </div>
            )} */}

            {/* Actions */}
            <div className="py-2">
              <button
                onClick={() => go("/profile")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <User className="h-4 w-4" />
                Profile
              </button>

              <button
                onClick={() => go("/settings")}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                <Settings className="h-4 w-4" />
                Settings
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

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Search, LogOut, Settings, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo/logo.png";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true, state: null });
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-gradient-to-br from-white via-[#f7f9fc] to-[#eef3ff] border-b border-white/60 backdrop-blur">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        <div className="h-16 flex items-center gap-3 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <img src={logo} alt="Veridate Logo" className="h-8 w-auto" />
          </div>

          {/* Search (desktop only) */}
          {/* <div className="flex-1 flex justify-center">
            <div className="w-full max-w-xl hidden sm:flex items-center gap-2 rounded-full bg-white shadow-md ring-1 ring-black/5 px-3 py-1.5">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search task"
                className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-700 placeholder:text-gray-400"
              />
            </div>
          </div> */}

          {/* Right section */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3 relative">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-white/70"
              aria-label="Notifications"
            >
              {/* <Bell className="h-5 w-5 text-gray-700" /> */}
            </Button>

            {user && (
              <>
                <button
                  className="flex items-center gap-3 rounded-full px-2 py-1.5 hover:bg-white/70 transition"
                  onClick={() => setOpen((prev) => !prev)}
                >
                  <Avatar className="h-8 w-8 ring-1 ring-black/5">
                    <AvatarImage src={user.avatarUrl} alt={user.firstName} />
                    <AvatarFallback>
                      {user.firstName?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="hidden sm:flex flex-col items-end leading-tight">
                    <span className="text-sm font-medium text-gray-800">
                      {user.firstName}
                    </span>
                    <span className="text-xs text-gray-500 truncate max-w-[180px]">
                      {user.email}
                    </span>
                  </div>
                </button>

                {/* Framer motion dropdown */}
                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-14 w-56 bg-white shadow-xl rounded-xl ring-1 ring-black/5 py-2 z-50"
                    >
                      <div className="px-4 py-2 border-b text-sm font-semibold text-gray-700">
                        {user.firstName}
                      </div>
                      <div className="flex flex-col">
                        <button className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition text-gray-700 gap-2">
                          <User className="w-4 h-4" />
                          Profile
                        </button>
                        <button className="flex items-center px-4 py-2 text-sm hover:bg-gray-100 transition text-gray-700 gap-2">
                          <Settings className="w-4 h-4" />
                          Settings
                        </button>
                        <hr className="my-1" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm hover:bg-red-50 text-red-600 gap-2 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>
        </div>

        {/* Mobile search bar */}
        {/* <div className="pb-3 sm:hidden">
          <div className="flex items-center gap-2 rounded-full bg-white shadow-md ring-1 ring-black/5 px-3 py-1.5">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search task"
              className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-gray-700 placeholder:text-gray-400"
            />
          </div>
        </div> */}
      </div>
    </header>
  );
}

import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { motion } from "framer-motion";

// helper for initials
const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export default function ProfileHeader({ user, previewUrl }) {


  const URL = "https://api.veridate.store/uploads"

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mb-8 flex items-center gap-4 rounded-2xl border border-white/20 bg-white/50 backdrop-blur-md p-4 shadow-xl"
    >
      {/* Avatar with gradient ring */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="relative rounded-full p-[2px]  shadow-md"
      >
        <Avatar className="size-14 border-2 border-white shadow-md">
          <AvatarImage src={`${URL}/profile/${user?.profilePic}`} alt={user?.name || "User"} />
          <AvatarFallback className="text-lg font-bold">
            {initials(user?.name)}
          </AvatarFallback>
        </Avatar>
      </motion.div>

      {/* Name + tagline */}
      <div className="flex flex-col">
        <motion.h1
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold text-gray-900 tracking-tight text-left"
        >
          {user?.name || "Professional Profile"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-sm text-gray-600"
        >
          Fill in your details and upload required documents.
        </motion.p>
      </div>

      {/* Floating glow orb (pure flex) */}
      <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-tr from-purple-400 to-pink-300 blur-2xl opacity-40" />
    </motion.div>
  );
}

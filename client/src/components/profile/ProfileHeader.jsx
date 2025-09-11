"use client";

import React, { useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import ProfilePhotoPicker from "../form/ProfilePhotoPicker";
import axiosInstance from "@/utils/axiosInstance";

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((s) => (s && s[0]) || "")
    .join("")
    .toUpperCase();

const isAbsolute = (v) => typeof v === "string" && /^(https?:)?\/\//i.test(v);

export default function ProfileHeader({
  user,
  onPhotoChange,
  onPhotoSave,
  uploading = false,
  profilePicRef,
}) {
  // const BASE_UPLOAD_URL = "https://api.veridate.store/uploads";
  const BASE_UPLOAD_URL = "http://localhost:8000/uploads";

  // make a preview that works for: empty | filename | absolute URL | File
  const blobUrlRef = useRef(null);
  const defaultPreview = useMemo(() => {
    // cleanup previous blob url
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }

    const v = user?.profilePic;
    if (!v) return "";

    // server stored string
    if (typeof v === "string") {
      return isAbsolute(v) ? v : `${BASE_UPLOAD_URL}/profile/${v}`;
    }

    // freshly picked File
    if (v instanceof File) {
      const u = URL.createObjectURL(v);
      blobUrlRef.current = u;
      return u;
    }

    return "";
  }, [user?.profilePic]);

  // revoke when component unmounts
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mb-8 flex items-center gap-4 rounded-2xl border border-black/20 bg-gray-100 backdrop-blur-md p-4 shadow-xl"
    >
      <ProfilePhotoPicker
        ref={profilePicRef}
        label={null}
        showInnerBorder={false}
        defaultPreviewUrl={defaultPreview}
        fallbackText={initials(user?.name)}
        onChange={onPhotoChange}
        avatarClassName="size-25"
        onSave={onPhotoSave}
        modalZ={9999}
        accept="image/*"
        disabled={uploading}
      />
      {uploading ? (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
          uploading…
        </span>
      ) : null}

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

      <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-tr from-orange-400 to-orange-300 blur-2xl opacity-40" />
    </motion.div>
  );
}

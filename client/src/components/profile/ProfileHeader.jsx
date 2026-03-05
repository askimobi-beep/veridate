"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import ProfilePhotoPicker from "../form/ProfilePhotoPicker";
import { Share2, Copy, Check, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const initials = (name = "") =>
  name
    .split(" ")
    .slice(0, 2)
    .map((s) => (s && s[0]) || "")
    .join("")
    .toUpperCase();

const isAbsolute = (v) => typeof v === "string" && /^(https?:)?\/\//i.test(v);

function profileRatingData(data) {
  if (!data) return { average: 0, totalVerifications: 0, allVerifications: [] };
  const sections = [
    ...(Array.isArray(data.education) ? data.education.map((r) => ({ ...r, _section: "education" })) : []),
    ...(Array.isArray(data.experience) ? data.experience.map((r) => ({ ...r, _section: "experience" })) : []),
    ...(Array.isArray(data.projects) ? data.projects.map((r) => ({ ...r, _section: "project" })) : []),
  ];
  const allVerifications = [];
  let ratingSum = 0;
  let ratingCount = 0;
  for (const row of sections) {
    if (!Array.isArray(row.verifications)) continue;
    for (const v of row.verifications) {
      const r = Number(v?.rating ?? 0);
      if (r > 0) { ratingSum += r; ratingCount++; }
      allVerifications.push({
        ...v,
        _section: row._section,
        _title:
          row._section === "education"
            ? [row.degreeTitle, row.institute].filter(Boolean).join(" at ")
            : row._section === "experience"
            ? [row.jobTitle, row.company].filter(Boolean).join(" at ")
            : [row.projectTitle, row.company].filter(Boolean).join(" at "),
      });
    }
  }
  return {
    average: ratingCount ? ratingSum / ratingCount : 0,
    totalVerifications: ratingCount,
    allVerifications: allVerifications.sort((a, b) => {
      const at = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bt = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bt - at;
    }),
  };
}

function timeAgoShort(value) {
  if (!value) return "";
  const diff = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  const units = [["y", 31536000], ["mo", 2592000], ["w", 604800], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [label, secs] of units) {
    const count = Math.floor(diff / secs);
    if (count >= 1) return `${count}${label} ago`;
  }
  return "just now";
}

function HeaderStars({ value = 0 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className="h-4 w-4 text-[color:var(--brand-orange)]"
          fill={s <= Math.round(value) ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

export default function ProfileHeader({
  user,
  onPhotoChange,
  onPhotoSave,
  uploading = false,
  profilePicRef,
  onShare,
  copied,
  shareUrl,
  extraActions = null,
}) {
  const BASE_UPLOAD_URL = `${import.meta.env.VITE_API_PIC_URL}/uploads`;
  const hasPendingPhoto = Boolean(user?.profilePicPending);
  const hasApprovedPhoto = Boolean(user?.profilePic) && !hasPendingPhoto;
  const photoRingClass = hasPendingPhoto
    ? "ring-2 ring-[color:var(--brand-orange)]"
    : hasApprovedPhoto
    ? "ring-2 ring-[color:var(--brand-orange)]"
    : "";
  const photoTooltip = hasPendingPhoto
    ? "Photo pending approval"
    : hasApprovedPhoto
    ? "Photo approved"
    : "";

  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [ratingSort, setRatingSort] = useState("newest");

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

  const { average, totalVerifications, allVerifications } = profileRatingData(user);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative mb-8 w-full flex items-center gap-4 rounded-2xl border border-black/20 bg-gray-100 backdrop-blur-md p-4 shadow-xl"
      >
        {/* LEFT: avatar + text */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <ProfilePhotoPicker
            ref={profilePicRef}
            label={null}
            showInnerBorder={false}
            defaultPreviewUrl={defaultPreview}
            fallbackText={initials(user?.name)}
            onChange={onPhotoChange}
            avatarClassName="size-25"
            buttonClassName={photoRingClass}
            buttonTitle={photoTooltip}
            onSave={onPhotoSave}
            modalZ={9999}
            accept="image/*"
            disabled={uploading}
          />

          <div className="flex flex-col overflow-hidden">
            <motion.h1
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="text-2xl font-bold text-gray-900 tracking-tight truncate text-start"
            >
              {user?.name || "Professional Profile"}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-2 mt-0.5"
            >
              <button
                type="button"
                onClick={() => setRatingsOpen(true)}
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <HeaderStars value={average} />
                <span className="text-sm text-gray-600">
                  ({totalVerifications} Veridation{totalVerifications !== 1 ? "s" : ""})
                </span>
              </button>
            </motion.div>
          </div>
        </div>

        {/* RIGHT: share controls (goes to the far-right) */}
        <div className="ml-auto flex items-center gap-2">
          {extraActions}
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-2 rounded-xl border border-[color:var(--brand-orange)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--brand-orange)] hover:bg-slate-100 active:scale-[0.98] shadow-sm transition"
            aria-label="Share profile link"
          >
            {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Share"}
          </button>

          {!navigator.share && (
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
              }}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
              aria-label="Copy profile link"
              title="Copy link"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* glow */}
        <div className="pointer-events-none absolute -top-6 -right-6 h-16 w-16 rounded-full bg-gradient-to-tr from-[color:var(--brand-orange)] to-[color:var(--brand-orange)] blur-2xl opacity-40" />

        {uploading ? (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">
            uploading…
          </span>
        ) : null}
      </motion.div>

      {/* Ratings popup */}
      <Dialog open={ratingsOpen} onOpenChange={setRatingsOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Profile Ratings</DialogTitle>
          </DialogHeader>
          {(() => {
            const sorted = [...allVerifications].sort((a, b) => {
              if (ratingSort === "highest") return (b.rating || 0) - (a.rating || 0);
              if (ratingSort === "lowest") return (a.rating || 0) - (b.rating || 0);
              return (new Date(b.createdAt || 0).getTime()) - (new Date(a.createdAt || 0).getTime());
            });
            return (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <HeaderStars value={average} />
                      <span className="text-sm font-semibold text-slate-800">
                        {average ? average.toFixed(1) : "0.0"} / 5
                      </span>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {totalVerifications} veridation{totalVerifications !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {["newest", "highest", "lowest"].map((id) => (
                      <Button
                        key={id}
                        size="sm"
                        variant={ratingSort === id ? "default" : "outline"}
                        className={`rounded-full border ${
                          ratingSort === id
                            ? "bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                            : "bg-white text-slate-700"
                        }`}
                        onClick={() => setRatingSort(id)}
                      >
                        {id.charAt(0).toUpperCase() + id.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Review cards */}
                <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                  {sorted.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-400">No ratings yet.</p>
                  ) : (
                    sorted.map((entry, idx) => {
                      const rating = Number(entry?.rating || 0);
                      const comment = (entry?.comment || "").trim();
                      const userObj = entry?.user;
                      const reviewerName =
                        (userObj && typeof userObj === "object"
                          ? [userObj.firstName, userObj.lastName].filter(Boolean).join(" ").trim() || userObj.name || "Verified User"
                          : "Verified User");
                      const avatarUrl = userObj?.profilePic
                        ? `${BASE_UPLOAD_URL}/profile/${userObj.profilePic}`
                        : null;
                      const when = timeAgoShort(entry?.createdAt);
                      return (
                        <div key={`${entry?._id || idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <p className="text-xs font-semibold text-slate-500 mb-2">{entry._title}</p>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              {avatarUrl && <AvatarImage src={avatarUrl} alt={reviewerName} className="object-cover" />}
                              <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] text-xs font-semibold">
                                {initials(reviewerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">{reviewerName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <HeaderStars value={rating} />
                                {when && <span className="text-xs text-slate-400">{when}</span>}
                              </div>
                              {comment && (
                                <p className="mt-2 text-sm italic text-slate-600">"{comment}"</p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
}

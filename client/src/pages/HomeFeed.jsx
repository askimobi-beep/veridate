import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchFeed, createFeedPost, updateFeedPost, toggleLikePost, addComment, deleteFeedPost } from "@/services/feedService";
import { fetchMyCompanies } from "@/services/companyService";
import { fetchPeopleYouMayKnow } from "@/services/profileService";
import { getProfileMe } from "@/lib/profileApi";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BriefcaseBusiness as Briefcase,
  Award,
  FolderKanban,
  GraduationCap,
  Users,
  Camera,
  ImagePlus,
  Trash2,
  Loader2,
  X,
  UserRound,
  FileText,
  ClipboardList,
  Building2,
  PlusSquare,
  ChevronRight,
  ChevronDown,
  Plus,
  Minus,
  Eye,
  List,
  FilePlus,
  Mic,
  Video,
  Sparkles,
  MoreHorizontal,
  Pencil,
  ThumbsUp,
  MessageCircle,
  Send,
  Link as LinkIcon,
  Upload,
  Star,
} from "lucide-react";

/* ─── constants ─── */
const CONTENT_TYPES = [
  { value: "job_update",    label: "Job Update",    icon: Briefcase,    color: "bg-blue-100 text-blue-700" },
  { value: "certification", label: "Certification", icon: Award,        color: "bg-green-100 text-green-700" },
  { value: "project",       label: "Project",       icon: FolderKanban, color: "bg-purple-100 text-purple-700" },
  { value: "degree",        label: "Degree",        icon: GraduationCap,color: "bg-orange-100 text-orange-700" },
  { value: "conference",    label: "Conference",    icon: Users,        color: "bg-pink-100 text-pink-700" },
];

const typeMap = Object.fromEntries(CONTENT_TYPES.map((t) => [t.value, t]));

const LEFT_LINKS = [
  { key: "pi",         label: "Personal Details", icon: UserRound,    section: "pi" },
  { key: "education",  label: "Education",        icon: FileText,     section: "education" },
  { key: "experience", label: "Experience",       icon: Briefcase,    section: "experience" },
  { key: "projects",   label: "Projects",         icon: ClipboardList,section: "projects" },
  { key: "audio",      label: "Audio Profile",    icon: Mic,          section: "audio" },
  { key: "video",      label: "Video Profile",    icon: Video,        section: "video" },
];

/* ─── helpers ─── */
function getInitial(name) {
  return (name?.trim()?.charAt(0) || "U").toUpperCase();
}

function timeAgo(dateStr) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ═══════════════════════════════════════
   LEFT SIDEBAR
═══════════════════════════════════════ */
/* ── rating helpers ── */
function recordAvgRating(row) {
  const ratings = Array.isArray(row?.verifications)
    ? row.verifications.map((v) => Number(v?.rating ?? 0)).filter((r) => Number.isFinite(r) && r > 0)
    : [];
  return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
}

function profileRatingData(profile) {
  if (!profile) return { average: 0, totalVerifications: 0, allVerifications: [] };
  const sections = [
    ...(Array.isArray(profile.education) ? profile.education.map((r) => ({ ...r, _section: "education" })) : []),
    ...(Array.isArray(profile.experience) ? profile.experience.map((r) => ({ ...r, _section: "experience" })) : []),
    ...(Array.isArray(profile.projects) ? profile.projects.map((r) => ({ ...r, _section: "project" })) : []),
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

function SidebarStars({ value = 0, className = "" }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 text-[color:var(--brand-orange)]`}
          fill={s <= Math.round(value) ? "currentColor" : "none"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
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

function LeftSidebar({ user, apiPicUrl, onNavigate, companies, myProfile }) {
  const [expandedCompanyId, setExpandedCompanyId] = useState(null);
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [ratingSort, setRatingSort] = useState("newest");
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email || "User";

  const isMultiple = companies && companies.length > 1;

  const toggleCompany = (id) =>
    setExpandedCompanyId((prev) => (prev === id ? null : id));

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <Card className="rounded-2xl border border-white/60 bg-white/60 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md overflow-hidden">
        {/* Banner */}
        <div className="h-14 bg-gradient-to-r from-[color:var(--brand-orange)]/20 to-orange-100/60" />
        <div className="px-4 pb-4 -mt-7">
          <Avatar className="h-14 w-14 ring-2 ring-white shadow-md">
            <AvatarImage
              src={`${apiPicUrl}/uploads/profile/${user?.profilePic}`}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="text-lg font-semibold bg-orange-100 text-[color:var(--brand-orange)]">
              {getInitial(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="mt-2 text-left">
            <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
            {(() => {
              const { average, totalVerifications } = profileRatingData(myProfile);
              return (
                <button
                  type="button"
                  onClick={() => totalVerifications > 0 && setRatingsOpen(true)}
                  className={`mt-0.5 inline-flex items-center gap-1 ${totalVerifications > 0 ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                >
                  <SidebarStars value={average} />
                  <span className="text-xs text-slate-500">({totalVerifications})</span>
                </button>
              );
            })()}
          </div>
          <button
            onClick={() => onNavigate("/dashboard/profile")}
            className="mt-3 w-full rounded-lg border border-[color:var(--brand-orange)] py-1.5 text-xs font-semibold text-[color:var(--brand-orange)] transition hover:bg-orange-50"
          >
            View Profile
          </button>
        </div>
      </Card>

      {/* Ratings Popup */}
      <Dialog open={ratingsOpen} onOpenChange={setRatingsOpen}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Profile Ratings</DialogTitle>
          </DialogHeader>
          {(() => {
            const { average, totalVerifications, allVerifications } = profileRatingData(myProfile);
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
                      <SidebarStars value={average} />
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
                        ? `${apiPicUrl}/uploads/profile/${userObj.profilePic}`
                        : null;
                      const when = timeAgoShort(entry?.createdAt);
                      return (
                        <div key={`${entry?._id || idx}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          {/* Title */}
                          <p className="text-xs font-semibold text-slate-500 mb-2">{entry._title}</p>
                          <div className="flex items-start gap-3">
                            <Avatar className="h-10 w-10">
                              {avatarUrl && <AvatarImage src={avatarUrl} alt={reviewerName} className="object-cover" />}
                              <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] text-xs font-semibold">
                                {getInitial(reviewerName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-800">{reviewerName}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <SidebarStars value={rating} />
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

      {/* Company Page — separate card, styled like /profile sidebar */}
      <div className="space-y-3">
        {companies && companies.length > 0 ? (
          companies.map((co) => {
            const isExpanded = isMultiple ? expandedCompanyId === co._id : true;
            const name = co.name || co.companyName || "Company";
            return (
              <div
                key={co._id}
                className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md"
              >
                <div className="space-y-1">
                  {isMultiple ? (
                    <button
                      type="button"
                      onClick={() => toggleCompany(co._id)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-base font-semibold transition text-slate-700 hover:bg-white/70"
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{name}</span>
                      {isExpanded
                        ? <Minus className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />
                        : <Plus className="h-3.5 w-3.5 flex-shrink-0 opacity-50" />}
                    </button>
                  ) : (
                    <div className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-base font-semibold text-slate-700">
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 truncate">{name}</span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => onNavigate(`/dashboard/profile?section=company&companyId=${co._id}&companyTab=overview`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition text-slate-500 hover:bg-white/70 hover:text-slate-700"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View Page</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate(`/dashboard/profile?section=company&companyId=${co._id}&companyTab=jobs`)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition text-slate-500 hover:bg-white/70 hover:text-slate-700"
                      >
                        <List className="h-4 w-4" />
                        <span>View Job Posts</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : null}

        {/* Create a Company Page — always visible */}
        <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
          <button
            type="button"
            onClick={() => onNavigate("/dashboard/profile?section=company&create=true")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition text-slate-500 hover:bg-white/70 hover:text-slate-700"
          >
            <PlusSquare className="h-4 w-4" />
            <span>Create a Company Page</span>
          </button>
          {(!companies || companies.length === 0) && (
            <>
              <button
                type="button"
                disabled
                title="Create a Company Page first"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold opacity-40 cursor-not-allowed text-slate-400"
              >
                <List className="h-4 w-4" />
                <span>View Job Posts</span>
              </button>
              <button
                type="button"
                disabled
                title="Create a Company Page first"
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold opacity-40 cursor-not-allowed text-slate-400"
              >
                <FilePlus className="h-4 w-4" />
                <span>Post a Job</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   RIGHT SIDEBAR
═══════════════════════════════════════ */
function RightSidebar({ onNavigate, suggestions = [], apiPicUrl = "" }) {
  return (
    <div className="space-y-3">
      {/* Suggested Jobs */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700 tracking-wide">Suggested Jobs</p>
          <button
            onClick={() => onNavigate("/dashboard/jobs")}
            className="text-[10px] font-medium text-[color:var(--brand-orange)] hover:underline"
          >
            See all
          </button>
        </div>
        <div className="space-y-3">
          {[
            { title: "Frontend Developer", company: "Tech Corp", location: "Remote" },
            { title: "Product Manager",   company: "StartupXYZ", location: "Lahore" },
          ].map((job, i) => (
            <button
              key={i}
              onClick={() => onNavigate("/dashboard/jobs")}
              className="w-full text-left group"
            >
              <div className="flex items-start gap-2">
                <div className="h-7 w-7 shrink-0 rounded-md bg-orange-50 flex items-center justify-center">
                  <Briefcase className="h-3.5 w-3.5 text-[color:var(--brand-orange)]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-[color:var(--brand-orange)] transition">{job.title}</p>
                  <p className="text-[10px] text-slate-400 truncate">{job.company} · {job.location}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>

      {/* Suggested Companies */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700 tracking-wide">Companies</p>
          <button
            onClick={() => onNavigate("/dashboard/directory")}
            className="text-[10px] font-medium text-[color:var(--brand-orange)] hover:underline"
          >
            Explore
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: "Mobisoft",     industry: "Software" },
            { name: "TechVentures", industry: "Fintech" },
          ].map((co, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-7 w-7 shrink-0 rounded-md bg-slate-100 flex items-center justify-center">
                <Building2 className="h-3.5 w-3.5 text-slate-400" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-slate-700 truncate">{co.name}</p>
                <p className="text-[10px] text-slate-400">{co.industry}</p>
              </div>
              <button className="shrink-0 rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)] transition">
                Follow
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* People You May Know */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700 tracking-wide">People You May Know</p>
        </div>
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
            <Users className="h-8 w-8 text-slate-200" />
            <p className="text-xs text-slate-400">No suggestions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const picSrc = s.profilePic
                ? `${apiPicUrl}/uploads/profile/${s.profilePic}`
                : null;
              const reasonText =
                s.reason?.type === "company"
                  ? `Worked at ${s.reason.name}`
                  : `Studied at ${s.reason.name}`;
              return (
                <button
                  key={s.userId}
                  onClick={() => onNavigate(`/dashboard/profiles/${s.userId}`)}
                  className="w-full text-left group"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 shrink-0 ring-1 ring-black/5">
                      {picSrc && (
                        <AvatarImage src={picSrc} alt={s.name} className="object-cover" />
                      )}
                      <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] text-[10px] font-semibold">
                        {getInitial(s.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-700 truncate group-hover:text-[color:var(--brand-orange)] transition">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{reasonText}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   POST COMPOSER
═══════════════════════════════════════ */
function PostComposer({ user, apiPicUrl, onPostCreated }) {
  const [open, setOpen]               = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [postText, setPostText]       = useState("");
  const [mediaFile, setMediaFile]     = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [linkUrl, setLinkUrl]         = useState("");
  const [submitting, setSubmitting]   = useState(false);
  const [mediaModal, setMediaModal]   = useState(null);   // "photo" | "video" | null
  const [linkModal, setLinkModal]     = useState(false);
  const [linkInput, setLinkInput]     = useState("");
  const textareaRef                   = useRef(null);
  const fileInputRef                  = useRef(null);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || "User";

  /* auto-focus textarea when composer opens */
  useEffect(() => {
    if (open && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open]);

  /* ESC to close, Ctrl+Enter to submit */
  useEffect(() => {
    const handler = (e) => {
      if (!open) return;
      if (e.key === "Escape") {
        if (mediaModal) { setMediaModal(null); return; }
        if (linkModal) { setLinkModal(false); return; }
        handleCancel();
      }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { handleSubmit(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedType, postText, mediaFile, mediaModal, linkModal]);

  const handleCancel = () => {
    setOpen(false);
    setSelectedType("");
    setPostText("");
    setMediaFile(null);
    setMediaPreview(null);
    setLinkUrl("");
    setMediaModal(null);
    setLinkModal(false);
    setLinkInput("");
  };

  const handleMediaSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaModal(null);
    setOpen(true);
  };

  const handleLinkAdd = () => {
    if (!linkInput.trim()) return;
    let url = linkInput.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    setLinkUrl(url);
    setLinkModal(false);
    setLinkInput("");
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!selectedType || !postText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("contentType", selectedType);
      fd.append("text", linkUrl ? `${postText.trim()}\n\n${linkUrl}` : postText.trim());
      if (mediaFile) fd.append("media", mediaFile);
      const res = await createFeedPost(fd);
      if (res?.data) onPostCreated(res.data);
      handleCancel();
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Media Upload Modal (LinkedIn-style) ── */
  const MediaUploadModal = () => {
    if (!mediaModal) return null;
    const isPhoto = mediaModal === "photo";
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setMediaModal(null)}>
        <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">Editor</h3>
            <button type="button" onClick={() => setMediaModal(null)} className="rounded-full p-1 hover:bg-slate-100 transition">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          {/* Body */}
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="mb-4 h-40 w-52">
              <svg viewBox="0 0 200 150" className="h-full w-full">
                <rect x="50" y="20" width="100" height="70" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2"/>
                <rect x="60" y="30" width="30" height="20" rx="3" fill="#94a3b8"/>
                <rect x="60" y="55" width="80" height="5" rx="2" fill="#cbd5e1"/>
                <rect x="60" y="65" width="60" height="5" rx="2" fill="#e2e8f0"/>
                <circle cx="130" cy="110" r="18" fill="#fed7aa"/>
                <rect x="122" y="95" width="16" height="20" rx="8" fill="#fdba74"/>
                <rect x="115" y="110" width="30" height="25" rx="4" fill="#fb923c"/>
                <rect x="45" y="100" width="20" height="40" rx="3" fill="#e2e8f0"/>
                <rect x="150" y="105" width="15" height="30" rx="3" fill="#94a3b8"/>
              </svg>
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-1">Select files to begin</h4>
            <p className="text-sm text-slate-400 mb-6">
              {isPhoto ? "Share images in your post." : "Share a single video in your post."}
            </p>
            <label className="cursor-pointer rounded-full bg-[color:var(--brand-orange)] px-6 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition">
              <Upload className="inline h-4 w-4 mr-2 -mt-0.5" />
              Upload from computer
              <input
                ref={fileInputRef}
                type="file"
                accept={isPhoto ? "image/*" : "video/*"}
                className="hidden"
                onChange={handleMediaSelect}
              />
            </label>
          </div>
          {/* Footer */}
          <div className="flex justify-end border-t border-slate-200 px-6 py-3">
            <button type="button" disabled className="rounded-full bg-slate-100 px-5 py-2 text-sm font-semibold text-slate-400 cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  /* ── Link Modal ── */
  const LinkModal = () => {
    if (!linkModal) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setLinkModal(false)}>
        <div className="relative w-full max-w-md mx-4 rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="text-lg font-semibold text-slate-800">Add a link</h3>
            <button type="button" onClick={() => setLinkModal(false)} className="rounded-full p-1 hover:bg-slate-100 transition">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          {/* Body */}
          <div className="px-6 py-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 text-left">URL</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleLinkAdd(); } }}
                autoFocus
                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[color:var(--brand-orange)] focus:ring-2 focus:ring-[color:var(--brand-orange)]/20 transition"
              />
            </div>
          </div>
          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-3">
            <button type="button" onClick={() => setLinkModal(false)} className="rounded-full px-5 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 transition">
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLinkAdd}
              disabled={!linkInput.trim()}
              className="rounded-full bg-[color:var(--brand-orange)] px-5 py-2 text-sm font-semibold text-white hover:brightness-110 transition disabled:opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <MediaUploadModal />
      <LinkModal />
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
        {!open ? (
          /* ── Collapsed trigger — LinkedIn style ── */
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="w-full flex items-center gap-3 text-left group"
            >
              <Avatar className="h-10 w-10 shrink-0 ring-1 ring-black/5">
                <AvatarImage
                  src={`${apiPicUrl}/uploads/profile/${user?.profilePic}`}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] font-semibold text-sm">
                  {getInitial(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400 group-hover:border-slate-300 transition">
                What's new? Share an update...
              </div>
            </button>
            <div className="flex items-center justify-around border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => setMediaModal("photo")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <Camera className="h-5 w-5 text-blue-500" />
                Photo
              </button>
              <button
                type="button"
                onClick={() => setMediaModal("video")}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <Video className="h-5 w-5 text-green-600" />
                Video
              </button>
              <button
                type="button"
                onClick={() => setLinkModal(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                <LinkIcon className="h-5 w-5 text-[color:var(--brand-orange)]" />
                Link
              </button>
            </div>
          </div>
        ) : (
          /* ── Expanded composer ── */
          <div className="space-y-4">
            {/* User row */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0 ring-1 ring-black/5">
                <AvatarImage
                  src={`${apiPicUrl}/uploads/profile/${user?.profilePic}`}
                  alt={displayName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] font-semibold text-sm">
                  {getInitial(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                <p className="text-xs text-slate-400">Share a professional update</p>
              </div>
            </div>

            {/* Content type chips */}
            <div>
              <p className="text-xs font-medium text-slate-400 mb-2 text-left">Select type</p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const isSelected = selectedType === ct.value;
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setSelectedType(isSelected ? "" : ct.value)}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border transition ${
                        isSelected
                          ? "border-[color:var(--brand-orange)] bg-orange-50 text-[color:var(--brand-orange)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {ct.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              placeholder={
                selectedType
                  ? `Share your ${typeMap[selectedType]?.label.toLowerCase()} update...`
                  : "What's new? Share an update..."
              }
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="min-h-[100px] resize-none text-sm"
              maxLength={2000}
            />

            {/* Media preview */}
            {mediaPreview && (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden">
                {mediaFile?.type?.startsWith("video") ? (
                  <video src={mediaPreview} controls className="w-full max-h-[240px] object-contain bg-black" />
                ) : (
                  <img src={mediaPreview} alt="Preview" className="w-full max-h-[240px] object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Link preview */}
            {linkUrl && (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                <LinkIcon className="h-4 w-4 text-[color:var(--brand-orange)] shrink-0" />
                <span className="flex-1 text-sm text-slate-600 truncate">{linkUrl}</span>
                <button
                  type="button"
                  onClick={() => setLinkUrl("")}
                  className="text-slate-400 hover:text-red-500 transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Character count */}
            <div className="flex items-center justify-between text-[10px] text-slate-400 -mt-2">
              <span>{postText.length}/2000</span>
              <span className="hidden sm:inline">Ctrl+Enter to post · Esc to cancel</span>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => setMediaModal("photo")} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-blue-500 transition" title="Add photo">
                  <Camera className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => setMediaModal("video")} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-green-600 transition" title="Add video">
                  <Video className="h-5 w-5" />
                </button>
                <button type="button" onClick={() => { setLinkInput(linkUrl); setLinkModal(true); }} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-[color:var(--brand-orange)] transition" title="Add link">
                  <LinkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCancel} className="text-slate-500">
                  Cancel
                </Button>
                <Button
                  size="sm"
                  disabled={!selectedType || !postText.trim() || submitting}
                  onClick={handleSubmit}
                  className="bg-[color:var(--brand-orange)] text-white hover:brightness-110 px-5"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}

/* ═══════════════════════════════════════
   EMPTY STATE
═══════════════════════════════════════ */
function EmptyState({ onCompose }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
        <Sparkles className="h-8 w-8 text-[color:var(--brand-orange)]" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">
        Your network updates will appear here.
      </h3>
      <p className="text-sm text-slate-400 mb-5 max-w-xs">
        Start by sharing a professional update with your network.
      </p>
      <Button
        onClick={onCompose}
        className="rounded-full bg-[color:var(--brand-orange)] text-white hover:brightness-110 gap-2 px-6"
      >
        <PlusSquare className="h-4 w-4" />
        Create First Post
      </Button>
    </div>
  );
}

/* ═══════════════════════════════════════
   FEED POST CARD
═══════════════════════════════════════ */
function PostCard({ post, currentUserId, apiPicUrl, onDelete, onEdit }) {
  const postUser = post.user || {};
  const displayName =
    [postUser.firstName, postUser.lastName].filter(Boolean).join(" ").trim() ||
    postUser.email || "User";
  const ct = typeMap[post.contentType] || { label: post.contentType, color: "bg-slate-100 text-slate-600", icon: Briefcase };
  const TypeIcon = ct.icon;
  const isOwner = currentUserId && String(currentUserId) === String(postUser._id);

  const [menuOpen,   setMenuOpen]   = useState(false);
  const [editing,    setEditing]    = useState(false);
  const [editText,   setEditText]   = useState(post.text || "");
  const [saving,     setSaving]     = useState(false);
  const [likes,      setLikes]      = useState(post.likes || []);
  const [comments,   setComments]   = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText,  setCommentText]  = useState("");
  const [commenting,   setCommenting]   = useState(false);
  const menuRef    = useRef(null);
  const commentRef = useRef(null);

  const liked = currentUserId && likes.some((l) => String(l) === String(currentUserId) || String(l?._id) === String(currentUserId));

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const handleSave = async () => {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await updateFeedPost(post._id, editText.trim());
      if (res?.data) onEdit(res.data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleLike = async () => {
    // Optimistic update
    const alreadyLiked = likes.some(
      (l) => String(l) === String(currentUserId) || String(l?._id) === String(currentUserId)
    );
    setLikes((prev) =>
      alreadyLiked
        ? prev.filter((l) => String(l) !== String(currentUserId) && String(l?._id) !== String(currentUserId))
        : [...prev, currentUserId]
    );
    try {
      const res = await toggleLikePost(post._id);
      if (res?.likes) setLikes(res.likes);
    } catch (err) {
      console.error("Like failed:", err?.response?.data || err.message);
      // Revert on failure
      setLikes((prev) =>
        alreadyLiked
          ? [...prev, currentUserId]
          : prev.filter((l) => String(l) !== String(currentUserId))
      );
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");
    setCommenting(true);
    try {
      const res = await addComment(post._id, text);
      if (res?.comments) setComments(res.comments);
    } catch (err) {
      console.error("Comment failed:", err?.response?.data || err.message);
      setCommentText(text); // restore on failure
    } finally {
      setCommenting(false);
    }
  };

  const profilePicSrc = postUser.profilePic
    ? `${apiPicUrl}/uploads/profile/${postUser.profilePic}`
    : null;

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="flex items-start gap-3">
          <Avatar className="h-11 w-11 shrink-0 ring-1 ring-black/5">
            {profilePicSrc && (
              <AvatarImage src={profilePicSrc} alt={displayName} className="object-cover" />
            )}
            <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] font-semibold text-sm">
              {getInitial(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-800 leading-tight">{displayName}</p>
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
              <span className="text-slate-300">·</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.color}`}>
                <TypeIcon className="h-3 w-3" />
                {ct.label}
              </span>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="relative shrink-0" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-8 z-20 w-44 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                <button
                  type="button"
                  onClick={() => { setEditing(true); setEditText(post.text || ""); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                >
                  <Pencil className="h-4 w-4 text-slate-400" />
                  Edit post
                </button>
                <button
                  type="button"
                  onClick={() => { onDelete(post._id); setMenuOpen(false); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete post
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-4 pb-3 text-left">
        {editing ? (
          <div className="space-y-2">
            <textarea
              className="w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-orange)]/40 min-h-[80px]"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              autoFocus
            />
            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={() => setEditing(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-500 rounded-lg hover:bg-slate-100 transition">
                Cancel
              </button>
              <button type="button" onClick={handleSave} disabled={saving || !editText.trim()}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[color:var(--brand-orange)] rounded-lg hover:opacity-90 transition disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{post.text}</p>
        )}
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="border-t border-slate-100">
          {post.mediaType === "video" ? (
            <video src={`${apiPicUrl}/uploads/feed/${post.mediaUrl}`} controls
              className="w-full max-h-[500px] object-contain bg-black" />
          ) : (
            <img src={`${apiPicUrl}/uploads/feed/${post.mediaUrl}`} alt=""
              className="w-full max-h-[500px] object-cover" />
          )}
        </div>
      )}

      {/* Like / comment counts */}
      {(likes.length > 0 || comments.length > 0) && (
        <div className="flex items-center justify-between px-4 pt-2 pb-1">
          {likes.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--brand-orange)] text-white">
                <ThumbsUp className="h-2.5 w-2.5" />
              </span>
              {likes.length}
            </span>
          )}
          {comments.length > 0 && (
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="ml-auto text-xs text-slate-400 hover:underline"
            >
              {comments.length} comment{comments.length !== 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center border-t border-slate-100 px-2 py-1">
        <button
          type="button"
          onClick={handleLike}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition hover:bg-slate-50 ${
            liked ? "text-[color:var(--brand-orange)]" : "text-slate-500"
          }`}
        >
          <ThumbsUp className={`h-4 w-4 ${liked ? "fill-[color:var(--brand-orange)]" : ""}`} />
          Like
        </button>
        <button
          type="button"
          onClick={() => { setShowComments(true); setTimeout(() => commentRef.current?.focus(), 100); }}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-50"
        >
          <MessageCircle className="h-4 w-4" />
          Comment
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-slate-100 px-4 pt-3 pb-4 space-y-3">
          {comments.map((c, i) => {
            const cUser = c.user || {};
            const cName = [cUser.firstName, cUser.lastName].filter(Boolean).join(" ").trim() || cUser.email || "User";
            const cPic = cUser.profilePic ? `${apiPicUrl}/uploads/profile/${cUser.profilePic}` : null;
            return (
              <div key={c._id || i} className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 shrink-0">
                  {cPic && <AvatarImage src={cPic} alt={cName} className="object-cover" />}
                  <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] text-xs font-semibold">
                    {getInitial(cName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 rounded-2xl bg-slate-50 px-3 py-2 text-left">
                  <p className="text-xs font-semibold text-slate-800">{cName}</p>
                  <p className="text-sm text-slate-700 mt-0.5">{c.text}</p>
                </div>
              </div>
            );
          })}

          {/* Add comment input */}
          <div className="flex items-center gap-2.5">
            <Avatar className="h-8 w-8 shrink-0">
              {currentUserId && postUser.profilePic && (
                <AvatarImage src={`${apiPicUrl}/uploads/profile/${postUser.profilePic}`} className="object-cover" />
              )}
              <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] text-xs font-semibold">
                {getInitial(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-1 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
              <input
                ref={commentRef}
                type="text"
                placeholder="Add a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleComment(); } }}
                className="flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={handleComment}
                disabled={commenting || !commentText.trim()}
                className="text-[color:var(--brand-orange)] disabled:opacity-30 transition hover:opacity-80"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
export default function HomeFeed() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [posts,       setPosts]       = useState([]);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [companies,   setCompanies]   = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [myProfile,   setMyProfile]   = useState(null);

  const composerRef = useRef(null);
  const apiPicUrl   = import.meta.env.VITE_API_PIC_URL || "";

  /* ── load feed ── */
  const loadFeed = useCallback(async (pageNum, append = false) => {
    const setter = append ? setLoadingMore : setLoading;
    setter(true);
    try {
      const res = await fetchFeed(pageNum);
      setPosts((prev) => (append ? [...prev, ...res.data] : res.data));
      setTotal(res.total);
    } catch (err) {
      console.error("Failed to load feed", err);
    } finally {
      setter(false);
    }
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);

  useEffect(() => {
    fetchMyCompanies().then(setCompanies).catch(() => {});
    fetchPeopleYouMayKnow().then(setSuggestions).catch(() => {});
    getProfileMe().then(setMyProfile).catch(() => {});
  }, []);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    loadFeed(next, true);
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
    setTotal((t) => t + 1);
  };

  const handleDelete = async (postId) => {
    try {
      await deleteFeedPost(postId);
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setTotal((t) => Math.max(0, t - 1));
    } catch (err) {
      console.error("Failed to delete post", err);
    }
  };

  const handleEdit = (updatedPost) => {
    setPosts((prev) => prev.map((p) => p._id === updatedPost._id ? updatedPost : p));
  };

  const scrollToComposer = () => {
    composerRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const hasMore = posts.length < total;

  /* ── render ── */
  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-6 pb-12">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr_240px]">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <LeftSidebar user={user} apiPicUrl={apiPicUrl} onNavigate={navigate} companies={companies} myProfile={myProfile} />
          </div>
        </aside>

        {/* ── Center Feed ── */}
        <main className="min-w-0 space-y-4">
          <div ref={composerRef}>
            <PostComposer user={user} apiPicUrl={apiPicUrl} onPostCreated={handlePostCreated} />
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse rounded-2xl bg-white/60" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md">
              <EmptyState onCompose={scrollToComposer} />
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={user?._id}
                  apiPicUrl={apiPicUrl}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                />
              ))}

              {hasMore ? (
                <div className="flex justify-center pt-2">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="rounded-full px-8"
                  >
                    {loadingMore && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Load more
                  </Button>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400 py-4">
                  You're all caught up
                </p>
              )}
            </div>
          )}
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <RightSidebar onNavigate={navigate} suggestions={suggestions} apiPicUrl={apiPicUrl} />
          </div>
        </aside>
      </div>
    </div>
  );
}

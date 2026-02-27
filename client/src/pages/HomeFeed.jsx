import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { fetchFeed, createFeedPost, deleteFeedPost } from "@/services/feedService";
import { fetchMyCompanies } from "@/services/companyService";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Briefcase,
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
  Sparkles,
} from "lucide-react";

/* ─── constants ─── */
const CONTENT_TYPES = [
  { value: "job_update",    label: "Job Update",    icon: Briefcase,    color: "bg-blue-100 text-blue-700" },
  { value: "certification", label: "Certification", icon: Award,        color: "bg-green-100 text-green-700" },
  { value: "project",       label: "Project",       icon: FolderKanban, color: "bg-purple-100 text-purple-700" },
  { value: "degree",        label: "Degree",        icon: GraduationCap,color: "bg-orange-100 text-orange-700" },
  { value: "conference",    label: "Conference",    icon: Users,        color: "bg-pink-100 text-pink-700" },
  { value: "photo",         label: "Photo",         icon: Camera,       color: "bg-cyan-100 text-cyan-700" },
];

const typeMap = Object.fromEntries(CONTENT_TYPES.map((t) => [t.value, t]));

const LEFT_LINKS = [
  { key: "pi",         label: "Personal Details", icon: UserRound,    section: "pi" },
  { key: "education",  label: "Education",        icon: FileText,     section: "education" },
  { key: "experience", label: "Experience",       icon: Briefcase,    section: "experience" },
  { key: "projects",   label: "Projects",         icon: ClipboardList,section: "projects" },
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
function LeftSidebar({ user, apiPicUrl, onNavigate, companies }) {
  const [companyOpen, setCompanyOpen] = useState(false);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email || "User";

  return (
    <div className="space-y-3">
      {/* Profile card */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md overflow-hidden">
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
            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => onNavigate("/dashboard/profile")}
            className="mt-3 w-full rounded-lg border border-[color:var(--brand-orange)] py-1.5 text-xs font-semibold text-[color:var(--brand-orange)] transition hover:bg-orange-50"
          >
            View Profile
          </button>
        </div>
      </Card>

      {/* Quick navigation */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-left">
          Profile Sections
        </p>
        <div className="space-y-0.5">
          {LEFT_LINKS.map(({ key, label, icon: Icon, section }) => (
            <button
              key={key}
              onClick={() => onNavigate(`/dashboard/profile?section=${section}`)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-[color:var(--brand-orange)]"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-xs">{label}</span>
              <ChevronRight className="h-3 w-3 opacity-30" />
            </button>
          ))}

          {/* Company Page — expandable dropdown */}
          <div>
            <button
              onClick={() => setCompanyOpen((v) => !v)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-[color:var(--brand-orange)]"
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-xs">Company Page</span>
              {companyOpen
                ? <ChevronDown className="h-3 w-3 opacity-40" />
                : <ChevronRight className="h-3 w-3 opacity-30" />}
            </button>

            {companyOpen && (
              <div className="ml-6 mt-0.5 space-y-0.5">
                {companies && companies.length > 0 ? (
                  companies.map((co) => (
                    <button
                      key={co._id}
                      onClick={() =>
                        onNavigate(`/dashboard/profile?section=company&companyId=${co._id}`)
                      }
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-medium text-slate-600 transition hover:bg-orange-50 hover:text-[color:var(--brand-orange)] truncate"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{co.name || co.companyName}</span>
                    </button>
                  ))
                ) : (
                  <button
                    onClick={() => onNavigate("/dashboard/profile?section=company")}
                    className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left text-xs font-medium text-[color:var(--brand-orange)] transition hover:bg-orange-50"
                  >
                    <PlusSquare className="h-3.5 w-3.5 shrink-0" />
                    Create a Company Page
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════
   RIGHT SIDEBAR
═══════════════════════════════════════ */
function RightSidebar({ onNavigate }) {
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

      {/* Suggested Connections — future-ready placeholder */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-700 tracking-wide">People You May Know</p>
        </div>
        <div className="flex flex-col items-center justify-center py-4 text-center gap-2">
          <Users className="h-8 w-8 text-slate-200" />
          <p className="text-xs text-slate-400">Connections coming soon</p>
        </div>
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
  const [submitting, setSubmitting]   = useState(false);
  const textareaRef                   = useRef(null);

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
      if (e.key === "Escape") { handleCancel(); }
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { handleSubmit(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedType, postText, mediaFile]);

  const handleCancel = () => {
    setOpen(false);
    setSelectedType("");
    setPostText("");
    setMediaFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedType || !postText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("contentType", selectedType);
      fd.append("text", postText.trim());
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

  return (
    <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
      {!open ? (
        /* ── Collapsed trigger ── */
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
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            <div className="rounded-full p-2 hover:bg-slate-100 transition">
              <ImagePlus className="h-4 w-4 text-slate-400" />
            </div>
          </div>
        </button>
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
                : "What's on your mind?"
            }
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            className="min-h-[100px] resize-none text-sm"
            maxLength={2000}
          />

          {/* Character count */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 -mt-2">
            <span>{postText.length}/2000</span>
            <span className="hidden sm:inline">Ctrl+Enter to post · Esc to cancel</span>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:border-slate-300 transition">
              <ImagePlus className="h-3.5 w-3.5" />
              {mediaFile ? (
                <span className="max-w-[100px] truncate text-[color:var(--brand-orange)]">
                  {mediaFile.name}
                </span>
              ) : (
                "Add Photo/Video"
              )}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
              />
            </label>
            {mediaFile && (
              <button
                type="button"
                onClick={() => setMediaFile(null)}
                className="ml-1 text-slate-400 hover:text-red-500 transition"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
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
function PostCard({ post, currentUserId, apiPicUrl, onDelete }) {
  const postUser = post.user || {};
  const displayName =
    [postUser.firstName, postUser.lastName].filter(Boolean).join(" ").trim() ||
    postUser.email || "User";
  const ct = typeMap[post.contentType] || { label: post.contentType, color: "bg-slate-100 text-slate-600", icon: Briefcase };
  const TypeIcon = ct.icon;
  const isOwner = currentUserId && String(currentUserId) === String(postUser._id);

  return (
    <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-black/5">
            <AvatarImage
              src={`${apiPicUrl}/uploads/profile/${postUser.profilePic}`}
              alt={displayName}
              className="object-cover"
            />
            <AvatarFallback className="bg-orange-50 text-[color:var(--brand-orange)] font-semibold text-sm">
              {getInitial(displayName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold text-slate-800">{displayName}</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.color}`}>
                <TypeIcon className="h-3 w-3" />
                {ct.label}
              </span>
            </div>
          </div>
        </div>
        {isOwner && (
          <button
            type="button"
            onClick={() => onDelete(post._id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition"
            title="Delete post"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
        {post.text}
      </p>

      {post.mediaUrl && (
        <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
          {post.mediaType === "video" ? (
            <video
              src={`${apiPicUrl}/uploads/feed/${post.mediaUrl}`}
              controls
              className="w-full max-h-96 object-contain bg-black"
            />
          ) : (
            <img
              src={`${apiPicUrl}/uploads/feed/${post.mediaUrl}`}
              alt=""
              className="w-full max-h-96 object-cover"
            />
          )}
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
            <LeftSidebar user={user} apiPicUrl={apiPicUrl} onNavigate={navigate} companies={companies} />
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
            <RightSidebar onNavigate={navigate} />
          </div>
        </aside>
      </div>
    </div>
  );
}

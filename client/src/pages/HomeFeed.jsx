import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchFeed, createFeedPost, deleteFeedPost } from "@/services/feedService";
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
} from "lucide-react";

const CONTENT_TYPES = [
  { value: "job_update", label: "Job Update", icon: Briefcase, color: "bg-blue-100 text-blue-700" },
  { value: "certification", label: "Certification", icon: Award, color: "bg-green-100 text-green-700" },
  { value: "project", label: "Project", icon: FolderKanban, color: "bg-purple-100 text-purple-700" },
  { value: "degree", label: "Degree", icon: GraduationCap, color: "bg-orange-100 text-orange-700" },
  { value: "conference", label: "Conference", icon: Users, color: "bg-pink-100 text-pink-700" },
  { value: "photo", label: "Photo", icon: Camera, color: "bg-cyan-100 text-cyan-700" },
];

const typeMap = Object.fromEntries(CONTENT_TYPES.map((t) => [t.value, t]));

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

export default function HomeFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // create post state
  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("");
  const [postText, setPostText] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const apiPicUrl = import.meta.env.VITE_API_PIC_URL || "";

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

  useEffect(() => {
    loadFeed(1);
  }, [loadFeed]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    loadFeed(nextPage, true);
  };

  const handleCreatePost = async () => {
    if (!selectedType || !postText.trim()) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("contentType", selectedType);
      fd.append("text", postText.trim());
      if (mediaFile) fd.append("media", mediaFile);

      const res = await createFeedPost(fd);
      if (res?.data) {
        setPosts((prev) => [res.data, ...prev]);
        setTotal((t) => t + 1);
      }
      // reset composer
      setSelectedType("");
      setPostText("");
      setMediaFile(null);
      setComposerOpen(false);
    } catch (err) {
      console.error("Failed to create post", err);
    } finally {
      setSubmitting(false);
    }
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

  const hasMore = posts.length < total;

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-10">
      {/* Create Post */}
      <Card className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4 mb-6">
        {!composerOpen ? (
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="w-full flex items-center gap-3 text-left"
          >
            <Avatar className="h-12 w-12 shrink-0 ring-1 ring-black/5">
              <AvatarImage
                src={`${apiPicUrl}/uploads/profile/${user?.profilePic}`}
                alt={user?.firstName || "User"}
              />
              <AvatarFallback>
                {getInitial(user?.firstName || user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
              What's new? Share an update...
            </div>
          </button>
        ) : (
          <div className="space-y-4">
            {/* Step 1: Select content type */}
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">
                Select content type
              </p>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((ct) => {
                  const Icon = ct.icon;
                  const isSelected = selectedType === ct.value;
                  return (
                    <button
                      key={ct.value}
                      type="button"
                      onClick={() => setSelectedType(ct.value)}
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

            {/* Step 2: Text + media */}
            {selectedType ? (
              <>
                <Textarea
                  placeholder={`Share your ${typeMap[selectedType]?.label.toLowerCase()} update...`}
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  className="min-h-[80px] resize-none"
                  maxLength={2000}
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 cursor-pointer hover:border-slate-300 transition">
                      <ImagePlus className="h-3.5 w-3.5" />
                      {mediaFile ? mediaFile.name : "Add Photo"}
                      <input
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    {mediaFile ? (
                      <button
                        type="button"
                        onClick={() => setMediaFile(null)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setComposerOpen(false);
                        setSelectedType("");
                        setPostText("");
                        setMediaFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={!postText.trim() || submitting}
                      onClick={handleCreatePost}
                      className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        )}
      </Card>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="h-36 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center text-sm text-slate-400 py-20">
          No posts yet. Be the first to share an update!
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const postUser = post.user || {};
            const displayName =
              [postUser.firstName, postUser.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || postUser.email || "User";
            const ct = typeMap[post.contentType] || {
              label: post.contentType,
              color: "bg-slate-100 text-slate-600",
              icon: Briefcase,
            };
            const TypeIcon = ct.icon;
            const isOwner = user && String(user._id) === String(postUser._id);

            return (
              <Card
                key={post._id}
                className="rounded-2xl border border-white/60 bg-white/80 shadow-sm backdrop-blur-md p-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 shrink-0 ring-1 ring-black/5">
                      <AvatarImage
                        src={`${apiPicUrl}/uploads/profile/${postUser.profilePic}`}
                        alt={displayName}
                      />
                      <AvatarFallback>
                        {getInitial(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-semibold text-slate-800">
                        {displayName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{timeAgo(post.createdAt)}</span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ct.color}`}
                        >
                          <TypeIcon className="h-3 w-3" />
                          {ct.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => handleDelete(post._id)}
                      className="text-slate-300 hover:text-red-500 transition p-1"
                      title="Delete post"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Body */}
                <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap">
                  {post.text}
                </div>

                {/* Media */}
                {post.mediaUrl ? (
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
                ) : null}
              </Card>
            );
          })}

          {/* Load More */}
          {hasMore ? (
            <div className="flex justify-center pt-4">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="rounded-full"
              >
                {loadingMore ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Load More
              </Button>
            </div>
          ) : posts.length > 0 ? (
            <div className="text-center text-xs text-slate-400 py-4">
              You're all caught up
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

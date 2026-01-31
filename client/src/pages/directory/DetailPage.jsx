/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/directory/DetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  ClipboardList,
  UserRound,
  CheckCircle2,
  BadgeCheck,
  AlertTriangle,
  XCircle,
  Heart,
  Share2,
  MoreVertical,
  Star,
  Mic,
  Video,
  Mail,
  MapPin,
  Phone,
  FileDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  SectionWrapper,
  DefinitionList,
  DLRow,
  SubSection,
  LinkText,
} from "@/components/directory/DetailBlocks";
import { useSnackbar } from "notistack";
import { useAuth } from "@/context/AuthContext";
// 👇 verification service
import {
  verifyEducationRow,
  verifyExperienceRow,
  verifyProjectRow,
} from "@/services/verifyService";
import ProfileChatBox from "./ProfileChatBox";
import ProfileSummaryCard from "@/components/directory/ProfileSummaryCard";
import ProfilePdfDownload from "@/components/profile/ProfilePdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).formatToParts(dt);
  const day = parts.find((p) => p.type === "day")?.value || "";
  const month = parts.find((p) => p.type === "month")?.value || "";
  const year = parts.find((p) => p.type === "year")?.value || "";
  return [day, month, year].filter(Boolean).join("-");
};
const fmtMonthYear = (d) => {
  if (!d) return "";
  const raw = String(d || "").trim();
  const match = raw.match(/^(\d{4})-(\d{2})$/);
  const dt = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, 1)
    : new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = String(dt.getFullYear());
  return `${mm} / ${yyyy}`;
};
const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");
const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normalizeInstitute = normalize;
const normalizeCompany = normalize;

// Utility: credits -> Map
const creditsToMap = (arr, keyField) => {
  const out = new Map();
  (arr || []).forEach((b) => {
    const rawKey = b?.[keyField];
    const k =
      typeof rawKey === "string"
        ? rawKey
        : rawKey?.toString
        ? rawKey.toString()
        : "";
    if (!k) return;
    const prev = out.get(k) || { available: 0, used: 0 };
    out.set(k, {
      available: prev.available + Number(b.available || 0),
      used: prev.used + Number(b.used || 0),
    });
  });
  return out;
};

// === status helpers for verification ===
function eduStatus({ row, meId, meProfile, eduCreditMap }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.instituteKey || normalizeInstitute(row?.institute);
  if (!key) return "ineligible";

  const hasSame =
    Array.isArray(meProfile?.education) &&
    meProfile.education.some(
      (e) => (e.instituteKey || normalizeInstitute(e.institute)) === key
    );
  if (!hasSame) return "ineligible";

  const bucket = eduCreditMap.get(key);
  if (!bucket || (bucket.available || 0) <= 0) return "no-credits";

  return "eligible";
}

function expStatus({ row, meId, meProfile, expCreditMap }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.companyKey || normalizeCompany(row?.company);
  if (!key) return "ineligible";

  const hasSame =
    Array.isArray(meProfile?.experience) &&
    meProfile.experience.some(
      (e) => (e.companyKey || normalizeCompany(e.company)) === key
    );
  if (!hasSame) return "ineligible";

  const bucket = expCreditMap.get(key);
  if (!bucket || (bucket.available || 0) <= 0) return "no-credits";

  return "eligible";
}

function projectStatus({ row, meId, meProfile, projectCreditMap }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.companyKey || normalizeCompany(row?.company);
  if (!key) return "ineligible";

  const hasSame =
    Array.isArray(meProfile?.experience) &&
    meProfile.experience.some(
      (e) => (e.companyKey || normalizeCompany(e.company)) === key
    );
  if (!hasSame) return "ineligible";

  const bucket = projectCreditMap.get(key);
  if (!bucket || (bucket.available || 0) <= 0) return "no-credits";

  return "eligible";
}

const statusIconByStatus = (status) => {
  switch (status) {
    case "already-verified":
      return CheckCircle2;
    case "eligible":
      return BadgeCheck;
    case "no-credits":
      return XCircle;
    case "ineligible":
    default:
      return XCircle;
  }
};

const statusIconColor = (status) => {
  switch (status) {
    case "already-verified":
      return "text-orange-600";
    case "eligible":
      return "text-orange-600";
    case "no-credits":
      return "text-red-600";
    case "ineligible":
    default:
      return "text-red-600";
  }
};

// === shared helpers for labels/badges (keep brand wording) ===
function verifyCountText(count, type) {
  const detail =
    type === "experience"
      ? "experience"
      : type === "project"
      ? "project"
      : "education";
  const noun = count === 1 ? "user" : "users";
  const verb = count === 1 ? "has" : "have";
  return `${noun} ${verb} already veridated this ${detail}`;
}

function getVerifyLabel(type, status, isBusy) {
  if (status === "already-verified")
    return "You have already veridated this section";
  if (status === "eligible") return isBusy ? "Verifying..." : "Veridate Now";
  if (status === "no-credits")
    return "Unable to veridate: No credits available";
  // ineligible message depends on type
  if (type === "education") {
    return "Unable to veridate: Education doesn't match";
  }
  if (type === "project") {
    return "Unable to veridate: Company don't match";
  }
  return "Unable to veridate: Company don't match";
}

// === small presentational helpers ===
function ReviewStars({ value = 5, onChange, readOnly = false, size = "lg", className = "" }) {
  const stars = [1, 2, 3, 4, 5];
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const iconSize =
    size === "sm" ? "h-5 w-5" : size === "lg" ? "h-8 w-8" : "h-6 w-6";

  if (readOnly) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {stars.map((star) => {
          const isActive = star <= numericValue;
          return (
            <Star
              key={`star-static-${star}`}
              className={`${iconSize} ${isActive ? "text-yellow-500" : "text-gray-300"}`}
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {stars.map((star) => {
        const isActive = star <= numericValue;
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange?.(star)}
            className="rounded-md p-1 transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={`${iconSize} ${isActive ? "text-yellow-500" : "text-gray-300"}`}
              fill={isActive ? "currentColor" : "none"}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}

function VerifyBadge({ count, type }) {
  return (
    <Badge className={`${badgeClass(count)} rounded-lg`}>
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
      {count} {verifyCountText(count, type)}
    </Badge>
  );
}

function VerifyButton({ type, status, isBusy, id, onVerify }) {
  const Icon = statusIconByStatus(status);
  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md bg-transparent text-xs font-semibold text-slate-700 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-70"
      onClick={() => status === "eligible" && onVerify(String(id))}
      disabled={status !== "eligible" || isBusy}
    >
      <Icon className={`h-5 w-5 stroke-[2.5] ${statusIconColor(status)}`} />
      <span className="whitespace-nowrap">{getVerifyLabel(type, status, isBusy)}</span>
    </button>
  );
}

function VerificationPreview({ verifications = [], onOpen }) {
  if (!Array.isArray(verifications) || verifications.length === 0) return null;

  const numericRatings = verifications
    .map((entry) => Number(entry?.rating || 0))
    .filter((r) => Number.isFinite(r) && r > 0);

  if (!numericRatings.length) return null;

  const average =
    numericRatings.reduce((acc, curr) => acc + curr, 0) / numericRatings.length;

  const sorted = [...verifications].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
  const latest = sorted[0] || null;
  const comment = (latest?.comment || "").trim();

  return (
    <button
      type="button"
      onClick={onOpen}
      className="mt-2 w-full sm:w-auto sm:min-w-[285px] rounded-lg border border-orange-300 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-3 py-2 text-left text-white shadow transition hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="flex flex-col items-start gap-1">
        <div className="flex items-center gap-2">
          <ReviewStars value={average} readOnly size="sm" className="drop-shadow-sm" />
          <span className="text-xs font-semibold text-white drop-shadow-sm">
            {average.toFixed(1)} / 5
          </span>
        </div>
        <span className="text-xs font-semibold text-white drop-shadow-sm">
          {numericRatings.length} veridation{numericRatings.length > 1 ? "s" : ""}
        </span>
      </div>
      
     
    </button>
  );
}

function VerificationSummaryBox({ count = 0, type, verifications = [], onOpen }) {
  const numericRatings = Array.isArray(verifications)
    ? verifications
        .map((entry) => Number(entry?.rating || 0))
        .filter((r) => Number.isFinite(r) && r > 0)
    : [];
  const reviewsCount = numericRatings.length;
  const average =
    reviewsCount > 0
      ? numericRatings.reduce((acc, curr) => acc + curr, 0) / reviewsCount
      : 0;
  const canOpen = typeof onOpen === "function" && reviewsCount > 0;

  const BoxTag = canOpen ? "button" : "div";

  return (
    <BoxTag
      type={canOpen ? "button" : undefined}
      onClick={canOpen ? onOpen : undefined}
      className="w-full max-w-[520px] mr-auto rounded-xl border-0 bg-transparent px-0 py-0 text-left text-slate-700 shadow-none"
    >
      <div className="flex items-center gap-2 text-sm text-slate-700">
        <span className="font-semibold text-slate-600">Rating:</span>
        <ReviewStars value={average} readOnly size="sm" className="drop-shadow-sm" />
        <span className="text-xs font-semibold text-slate-700">
          {average ? `${Math.round(average)} / 5` : "0 / 5"}
        </span>
      </div>
      <div className="mt-1 text-xs font-semibold text-slate-600">
        {count} veridation{count === 1 ? "" : "s"}
      </div>
    </BoxTag>
  );
}

function sentenceCase(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const lower = text.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function reviewerLabel(entry) {
  const user = entry?.user;
  if (user && typeof user === "object") {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const name =
      fullName ||
      user.name ||
      user.fullName ||
      user.username ||
      user.displayName ||
      "";
    return sentenceCase(name) || "Verified User";
  }
  return "Verified User";
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
}

function recordAverageRating(row) {
  const ratings = Array.isArray(row?.verifications)
    ? row.verifications
        .map((entry) => Number(entry?.rating ?? 0))
        .filter((r) => Number.isFinite(r) && r >= 0)
    : [];
  if (!ratings.length) return 0;
  return ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length;
}

function overallProfileRating(profile) {
  const rows = [
    ...(Array.isArray(profile?.education) ? profile.education : []),
    ...(Array.isArray(profile?.experience) ? profile.experience : []),
    ...(Array.isArray(profile?.projects) ? profile.projects : []),
  ];

  const totalRecords = rows.length;
  const sumRatings = rows.reduce((acc, row) => acc + recordAverageRating(row), 0);
  const average = totalRecords ? sumRatings / totalRecords : 0;
  const rounded = Number(average.toFixed(1));

  return {
    totalRecords,
    sumRatings: Number(sumRatings.toFixed(1)),
    average: rounded,
  };
}

function timeAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const diffSeconds = Math.max(0, (Date.now() - date.getTime()) / 1000);
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [label, seconds] of units) {
    const count = Math.floor(diffSeconds / seconds);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? "s" : ""} ago`;
    }
  }

  return "Just now";
}

function EducationDetails({ edu, fileUrl }) {
  const instituteHref = edu.instituteWebsite || undefined;
  const fileHref = edu.degreeFile ? fileUrl("education", edu.degreeFile) : undefined;
  const dateRange = [fmtDate(edu.startDate), fmtDate(edu.endDate)]
    .filter(Boolean)
    .join(" till ");

  return (
    <div className="space-y-3 text-left">
      <div>
        <h4 className="text-[18px] font-semibold text-slate-800">
          {edu.degreeTitle || "Education"}
        </h4>
        <div className="mt-1 text-[16px] text-slate-600">
          {edu.institute ? (
            <LinkText href={instituteHref}>{edu.institute}</LinkText>
          ) : (
            <span>Institute not provided</span>
          )}
          {dateRange ? <span> | {dateRange}</span> : null}
          {fileHref ? (
            <span className="block mt-1 text-[14px]">
              <LinkText href={fileHref}>
                <span className="inline-flex items-center gap-1">
                  <FileDown className="h-4 w-4" />
                  View Degree File
                </span>
              </LinkText>
            </span>
          ) : null}
        </div>
      </div>
      {!fileHref ? (
        <span className="text-sm text-slate-500">Degree file not provided</span>
      ) : null}
    </div>
  );
}
function ExperienceDetails({ exp, fileUrl }) {
  const companyHref = exp.companyWebsite || undefined;
  const fileHref = exp.experienceLetterFile
    ? fileUrl("experience", exp.experienceLetterFile)
    : undefined;
  const dateRange = [fmtDate(exp.startDate), fmtDate(exp.endDate)]
    .filter(Boolean)
    .join(" till ");

  return (
    <div className="space-y-3 text-left">
      <div>
        <h4 className="text-[18px] font-semibold text-slate-800">
          {exp.jobTitle || "Experience"}
        </h4>
        <div className="mt-1 text-[16px] text-slate-600">
          {exp.company ? (
            <LinkText href={companyHref}>{exp.company}</LinkText>
          ) : (
            <span>Company not provided</span>
          )}
          {dateRange ? <span> | {dateRange}</span> : null}
          {fileHref ? (
            <span className="block mt-1 text-[14px]">
              <LinkText href={fileHref}>
                <span className="inline-flex items-center gap-1">
                  <FileDown className="h-4 w-4" />
                  View Experience Letter
                </span>
              </LinkText>
            </span>
          ) : null}
        </div>
      </div>
      {!fileHref ? (
        <span className="text-sm text-slate-500">Experience letter not provided</span>
      ) : null}
    </div>
  );
}
function ProjectDetails({ project }) {
  const projectHref = project.projectUrl || undefined;
  const dateRange = [fmtDate(project.startDate), fmtDate(project.endDate)]
    .filter(Boolean)
    .join(" till ");

  return (
    <div className="space-y-3 text-left">
      <div>
        <h4 className="text-[18px] font-semibold text-slate-800">
          {project.projectTitle || "Project"}
        </h4>
        <div className="mt-1 text-[16px] text-slate-600">
          {project.company ? (
            <span>{project.company}</span>
          ) : (
            <span>Company not provided</span>
          )}
          {dateRange ? <span> | {dateRange}</span> : null}
          {projectHref ? (
            <span className="block mt-0 text-[14px]">
              <LinkText href={projectHref}>View Project URL</LinkText>
            </span>
          ) : null}
        </div>
      </div>
      {!projectHref ? (
        <span className="text-sm text-slate-500">Project URL not provided</span>
      ) : null}
      <div className="text-[14px] text-slate-700 space-y-1">
        {project.department ? <div>Department: {project.department}</div> : null}
        {project.projectMember ? (
          <div>
            Project members:{" "}
            {Array.isArray(project.projectMember)
              ? project.projectMember.join(", ")
              : project.projectMember}
          </div>
        ) : null}
        {project.role ? <div>Role: {project.role}</div> : null}
        {project.description ? (
          <div>Description: {project.description}</div>
        ) : null}
      </div>
    </div>
  );
}
function SectionCard({ id, title, icon: Icon, children }) {
  return (
    <div
      id={`section-${id}`}
      className="rounded-2xl border border-white/60 bg-white/60 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)] backdrop-blur-md"
    >
      <div className="flex items-center gap-2 border-b border-white/60 px-4 py-3">
        {Icon ? <Icon className="h-4 w-4 text-orange-600" /> : null}
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export default function DetailPage() {
  const { userId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [meProfile, setMeProfile] = useState(null);
  const [activeSection, setActiveSection] = useState("summary");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [busyEdu, setBusyEdu] = useState("");
  const [busyExp, setBusyExp] = useState("");
  const [busyProject, setBusyProject] = useState("");
  const [reviewModal, setReviewModal] = useState({
    open: false,
    type: null,
    rowId: "",
  });
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewListModal, setReviewListModal] = useState({
    open: false,
    title: "",
    entries: [],
  });
  const [reviewSort, setReviewSort] = useState("newest");
  const [expandedReviews, setExpandedReviews] = useState({});
  const [copied, setCopied] = useState(false);

  const sectionItems = [
    { key: "summary", label: "AI Profile Summary", icon: Star },
    { key: "personal", label: "Personal Details", icon: UserRound },
    {
      key: "education",
      label: "Education",
      icon: FileText,
      count: profile?.education?.length || 0,
    },
    {
      key: "experience",
      label: "Experience",
      icon: Briefcase,
      count: profile?.experience?.length || 0,
    },
    {
      key: "projects",
      label: "Projects",
      icon: ClipboardList,
      count: profile?.projects?.length || 0,
    },
    { key: "audio", label: "Audio Profile", icon: Mic },
    { key: "video", label: "Video Profile", icon: Video },
  ];
  const reviewEntries = Array.isArray(reviewListModal.entries)
    ? reviewListModal.entries
    : [];
  const reviewRatings = reviewEntries
    .map((entry) => Number(entry?.rating || 0))
    .filter((r) => Number.isFinite(r) && r > 0);
  const reviewAverage = reviewRatings.length
    ? reviewRatings.reduce((acc, curr) => acc + curr, 0) / reviewRatings.length
    : 0;
  const sortedReviewEntries = useMemo(() => {
    const list = reviewEntries.map((entry, index) => {
      const rawTime =
        entry?.createdAt || entry?.updatedAt || entry?.timestamp || 0;
      const timeValue = rawTime ? new Date(rawTime).getTime() : 0;
      const time = Number.isFinite(timeValue) ? timeValue : 0;
      const ratingValue = Number(entry?.rating);
      const rating = Number.isFinite(ratingValue) ? ratingValue : 0;
      return { entry, index, time, rating };
    });

    const byDateDesc = (a, b) => {
      const diff = b.time - a.time;
      return diff !== 0 ? diff : a.index - b.index;
    };

    if (reviewSort === "highest") {
      return list
        .sort((a, b) => {
          const diff = b.rating - a.rating;
          return diff !== 0 ? diff : byDateDesc(a, b);
        })
        .map((item) => item.entry);
    }

    if (reviewSort === "lowest") {
      return list
        .sort((a, b) => {
          const diff = a.rating - b.rating;
          return diff !== 0 ? diff : byDateDesc(a, b);
        })
        .map((item) => item.entry);
    }

    return list.sort(byDateDesc).map((item) => item.entry);
  }, [reviewEntries, reviewSort]);

  const baseURL = useMemo(
    () => axiosInstance.defaults.baseURL?.replace(/\/$/, ""),
    []
  );
  const navigate = useNavigate();
  const fileBaseURL = useMemo(
    () => (baseURL ? baseURL.replace(/\/api\/v1$/, "") : ""),
    [baseURL]
  );
  const fileUrl = (type, name) =>
    name && fileBaseURL ? `${fileBaseURL}/uploads/${type}/${name}` : undefined;

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        setLoading(true);
        const [targetRes, meRes] = await Promise.all([
          userId
            ? axiosInstance.get(
                `/profile/getonid/${encodeURIComponent(userId)}`
              )
            : Promise.resolve({ data: null }),
          axiosInstance.get(`/profile/me`).catch(() => ({ data: null })),
        ]);
        if (!off) {
          setProfile(targetRes.data);
          setMeProfile(meRes.data);
        }
      } catch (e) {
        if (!off) setErr(e?.response?.data?.error || "Failed to fetch profile");
      } finally {
        if (!off) setLoading(false);
      }
    })();
    return () => {
      off = true;
    };
  }, [userId]);

  // Credit Maps
  const eduCreditMap = useMemo(() => {
    const buckets = authUser?.verifyCredits?.education || [];
    return creditsToMap(buckets, "instituteKey");
  }, [authUser]);

  const expCreditMap = useMemo(() => {
    const buckets = authUser?.verifyCredits?.experience || [];
    return creditsToMap(buckets, "companyKey");
  }, [authUser]);

  const projectCreditMap = useMemo(() => {
    const buckets = authUser?.verifyCredits?.projects || [];
    return creditsToMap(buckets, "companyKey");
  }, [authUser]);

  const resetReviewState = () => {
    setReviewModal({ open: false, type: null, rowId: "" });
    setReviewRating(5);
    setReviewComment("");
  };

  const openReviewDialog = (type, rowId) => {
    if (!rowId) return;
    setReviewModal({ open: true, type, rowId: String(rowId) });
    setReviewRating(5);
    setReviewComment("");
  };

  const handleReviewDialogChange = (open) => {
    if (!open) {
      if (submittingReview) return;
      resetReviewState();
    }
  };

  const beginEducationReview = (eduId) =>
    openReviewDialog("education", eduId);
  const beginExperienceReview = (expId) =>
    openReviewDialog("experience", expId);
  const beginProjectReview = (projectId) =>
    openReviewDialog("project", projectId);

  const openReviewListModal = (type, row) => {
    const entries = Array.isArray(row?.verifications)
      ? row.verifications
      : [];
    if (!entries.length) return;
    const sortedEntries = [...entries].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });

    const titleBase =
      type === "education"
        ? row?.degreeTitle || row?.institute || "Education verification"
        : type === "experience"
        ? row?.jobTitle || row?.company || "Experience verification"
        : row?.projectTitle || row?.company || "Project verification";

    setReviewListModal({
      open: true,
      title: titleBase,
      entries: sortedEntries,
    });
  };

  const handleReviewListChange = (open) => {
    if (!open) {
      setReviewListModal({ open: false, title: "", entries: [] });
    }
  };

  useEffect(() => {
    if (reviewListModal.open) {
      setReviewSort("newest");
      setExpandedReviews({});
    }
  }, [reviewListModal.open]);

  // === Verify Education Handler ===
  const onVerifyEdu = async (eduId, review) => {
    if (!eduId) return false;

    const rating = Number(review?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      enqueueSnackbar("Please select a star rating before Veridating.", {
        variant: "warning",
      });
      return false;
    }
    const comment =
      typeof review?.comment === "string"
        ? review.comment.trim().slice(0, 1000)
        : "";

    const payload = { rating, comment };

    setBusyEdu(eduId);
    try {
      const { success, data, error } = await verifyEducationRow(
        userId,
        eduId,
        payload
      );
      if (!success) {
        enqueueSnackbar(error, { variant: "error" });
        return false;
      }

      const updatedRow = data?.education?.find(
        (r) => String(r._id) === String(eduId)
      );

      setProfile((p) => {
        if (!p) return p;
        const fallbackEntry =
          authUser?._id && rating
            ? {
                user: {
                  _id: authUser._id,
                  name: authUser.name,
                  email: authUser.email,
                },
                rating,
                comment,
                createdAt: new Date().toISOString(),
              }
            : null;
        return {
          ...p,
          education: (p.education || []).map((row) =>
            String(row._id) === String(eduId)
              ? {
                  ...row,
                  verifyCount:
                    updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
                  verifiedBy:
                    updatedRow?.verifiedBy ??
                    [...(row.verifiedBy || []), authUser?._id].filter(Boolean),
                  verifications:
                    updatedRow?.verifications ??
                    [
                      ...(row.verifications || []),
                      ...(fallbackEntry ? [fallbackEntry] : []),
                    ],
                }
              : row
          ),
        };
      });

      enqueueSnackbar("Education verified successfully!", {
        variant: "success",
      });
      return true;
    } catch (e) {
      enqueueSnackbar(
        e?.message || "An unexpected error occurred during verification.",
        { variant: "error" }
      );
      return false;
    } finally {
      setBusyEdu("");
    }
  };

  // === Verify Experience Handler ===
  const onVerifyExp = async (expId, review) => {
    if (!expId) return false;

    const rating = Number(review?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      enqueueSnackbar("Please select a star rating before Veridating.", {
        variant: "warning",
      });
      return false;
    }
    const comment =
      typeof review?.comment === "string"
        ? review.comment.trim().slice(0, 1000)
        : "";

    const payload = { rating, comment };

    setBusyExp(expId);
    try {
      const { success, data, error } = await verifyExperienceRow(
        userId,
        expId,
        payload
      );
      if (!success) {
        enqueueSnackbar(error, { variant: "error" });
        return false;
      }

      const updatedRow = data?.experience?.find(
        (r) => String(r._id) === String(expId)
      );

      setProfile((p) => {
        if (!p) return p;
        const fallbackEntry =
          authUser?._id && rating
            ? {
                user: {
                  _id: authUser._id,
                  name: authUser.name,
                  email: authUser.email,
                },
                rating,
                comment,
                createdAt: new Date().toISOString(),
              }
            : null;
        return {
          ...p,
          experience: (p.experience || []).map((row) =>
            String(row._id) === String(expId)
              ? {
                  ...row,
                  verifyCount:
                    updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
                  verifiedBy:
                    updatedRow?.verifiedBy ??
                    [...(row.verifiedBy || []), authUser?._id].filter(Boolean),
                  verifications:
                    updatedRow?.verifications ??
                    [
                      ...(row.verifications || []),
                      ...(fallbackEntry ? [fallbackEntry] : []),
                    ],
                }
              : row
          ),
        };
      });

      enqueueSnackbar("Experience verified successfully!", {
        variant: "success",
      });
      return true;
    } catch (e) {
      enqueueSnackbar(
        e?.message || "An unexpected error occurred during verification.",
        { variant: "error" }
      );
      return false;
    } finally {
      setBusyExp("");
    }
  };

  const onVerifyProject = async (projectId, review) => {
    if (!projectId) return false;

    const rating = Number(review?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      enqueueSnackbar("Please select a star rating before Veridating.", {
        variant: "warning",
      });
      return false;
    }
    const comment =
      typeof review?.comment === "string"
        ? review.comment.trim().slice(0, 1000)
        : "";

    const payload = { rating, comment };

    setBusyProject(projectId);
    try {
      const { success, data, error } = await verifyProjectRow(
        userId,
        projectId,
        payload
      );
      if (!success) {
        enqueueSnackbar(error, { variant: "error" });
        return false;
      }

      const updatedRow = data?.projects?.find(
        (r) => String(r._id) === String(projectId)
      );

      setProfile((p) => {
        if (!p) return p;
        const fallbackEntry =
          authUser?._id && rating
            ? {
                user: {
                  _id: authUser._id,
                  name: authUser.name,
                  email: authUser.email,
                },
                rating,
                comment,
                createdAt: new Date().toISOString(),
              }
            : null;
        return {
          ...p,
          projects: (p.projects || []).map((row) =>
            String(row._id) === String(projectId)
              ? {
                  ...row,
                  verifyCount:
                    updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
                  verifiedBy:
                    updatedRow?.verifiedBy ??
                    [...(row.verifiedBy || []), authUser?._id].filter(Boolean),
                  verifications:
                    updatedRow?.verifications ??
                    [
                      ...(row.verifications || []),
                      ...(fallbackEntry ? [fallbackEntry] : []),
                    ],
                }
              : row
          ),
        };
      });

      enqueueSnackbar("Project verified successfully!", {
        variant: "success",
      });
      return true;
    } catch (e) {
      enqueueSnackbar(
        e?.message || "An unexpected error occurred during verification.",
        { variant: "error" }
      );
      return false;
    } finally {
      setBusyProject("");
    }
  };

  const handleReviewSubmit = async () => {
    const { type, rowId } = reviewModal;
    if (!type || !rowId) return;

    const reviewPayload = {
      rating: reviewRating,
      comment: reviewComment,
    };

    setSubmittingReview(true);
    try {
    const ok =
      type === "education"
        ? await onVerifyEdu(rowId, reviewPayload)
        : type === "experience"
        ? await onVerifyExp(rowId, reviewPayload)
        : await onVerifyProject(rowId, reviewPayload);

      if (ok) {
        resetReviewState();
      }
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Loading...</div>;
  if (err) return <div className="p-6 text-sm text-red-500">{err}</div>;
  if (!profile)
    return (
      <div className="p-6 text-sm text-muted-foreground">No profile found.</div>
    );

  const meId = authUser?._id;
  const fullName = profile?.name || "Unnamed";
  const overallRating = overallProfileRating(profile);
  const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const avatarUrl =
    profile?.profilePicUrl ||
    (profile?.profilePic ? fileUrl("profile", profile.profilePic) : undefined);
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/profiles/${userId}`
      : "";
  const audioUrl = profile?.audioProfile
    ? fileUrl("audio", profile.audioProfile)
    : "";
  const videoUrl = profile?.videoProfile
    ? fileUrl("video", profile.videoProfile)
    : "";
  const hiddenPersonalFields = new Set(
    (profile?.personalHiddenFields || []).filter(
      (field) => field !== "email" && field !== "mobile"
    )
  );
  const listToText = (list) =>
    Array.isArray(list) && list.length ? list.join(", ") : "";
  const personalDetails = [
    { key: "name", label: "Full Name", value: fullName },
    { key: "email", label: "Email", value: profile?.email || "" },
    { key: "mobile", label: "Mobile", value: profile?.mobile || "" },
    { key: "gender", label: "Gender", value: profile?.gender || "" },
    { key: "dob", label: "Date of Birth", value: fmtMonthYear(profile?.dob) },
    {
      key: "residentStatus",
      label: "Resident Status",
      value: profile?.residentStatus || "",
    },
    { key: "nationality", label: "Nationality", value: profile?.nationality || "" },
    { key: "street", label: "Street", value: profile?.street || "" },
    { key: "city", label: "City", value: profile?.city || "" },
    { key: "country", label: "Country", value: profile?.country || "" },
    {
      key: "shiftPreferences",
      label: "Shift Preferences",
      value: listToText(profile?.shiftPreferences),
    },
    {
      key: "workAuthorization",
      label: "Work Authorization",
      value: listToText(profile?.workAuthorization),
    },
  ];
  const visiblePersonalDetails = personalDetails.filter(
    (item) => !hiddenPersonalFields.has(item.key)
  );

  const scrollToSection = (key) => {
    setActiveSection(key);
    const el = document.getElementById(`section-${key}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const sectionOrder = sectionItems.map((item) => item.key);
  const activeIndex = sectionOrder.indexOf(activeSection);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;
  const goPrev = () => {
    if (safeIndex <= 0) return;
    scrollToSection(sectionOrder[safeIndex - 1]);
  };
  const goNext = () => {
    if (safeIndex >= sectionOrder.length - 1) return;
    scrollToSection(sectionOrder[safeIndex + 1]);
  };
  const handleShare = async () => {
    if (!profileUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Profile", url: profileUrl });
        return;
      }
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };
  const isActiveSection = (key) => activeSection === key;

  return (
    <>
      <Dialog open={reviewModal.open} onOpenChange={handleReviewDialogChange}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewModal.type === "education"
                ? "Veridate Education"
                : reviewModal.type === "experience"
                ? "Veridate Experience"
                : reviewModal.type === "project"
                ? "Veridate Project"
                : "Veridate Profile"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                Star rating <span className="text-red-500">*</span>
              </p>
              <ReviewStars value={reviewRating} onChange={setReviewRating} />
            </div>
            <div className="space-y-2">
              <label
                className="text-sm font-medium text-gray-700"
                htmlFor="verification-comment"
              >
                Comment (optional)
              </label>
              <Textarea
                id="verification-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Add supporting context for your verification"
                rows={4}
                maxLength={1000}
                disabled={submittingReview}
              />
              <p className="text-xs text-muted-foreground">
                Your name accompanies this review after you Veridate.
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              variant="outline"
              onClick={() => handleReviewDialogChange(false)}
              disabled={submittingReview}
            >
              Cancel
            </Button>
            <Button onClick={handleReviewSubmit} disabled={submittingReview}>
              {submittingReview ? "Submitting..." : "Submit & Veridate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reviewListModal.open} onOpenChange={handleReviewListChange}>
        <DialogContent className="sm:max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewListModal.title || "Verification feedback"}
            </DialogTitle>
            <DialogDescription>
              {reviewEntries.length ? "" : "No veridations captured yet."}
            </DialogDescription>
          </DialogHeader>
          {reviewEntries.length ? (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white/70 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ReviewStars
                      value={reviewAverage || 0}
                      readOnly
                      size="sm"
                      className="drop-shadow-sm"
                    />
                    <span className="text-sm font-semibold text-slate-800">
                      {reviewAverage.toFixed(1)} / 5
                    </span>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {reviewEntries.length} veridation
                    {reviewEntries.length > 1 ? "s" : ""}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {[
                    { id: "newest", label: "Newest" },
                    { id: "highest", label: "Highest" },
                    { id: "lowest", label: "Lowest" },
                  ].map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={reviewSort === option.id ? "default" : "outline"}
                      className={`rounded-full border ${
                        reviewSort === option.id
                          ? "bg-orange-500 text-white hover:bg-orange-500"
                          : "bg-white text-slate-700"
                      }`}
                      onClick={() => setReviewSort(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
                {sortedReviewEntries.map((entry, idx) => {
                  const rating = Number(entry?.rating || 0);
                  const comment = (entry?.comment || "").trim();
                  const reviewer = reviewerLabel(entry);
                  const when =
                    timeAgo(entry?.createdAt) ||
                    formatReviewDate(entry?.createdAt) ||
                    "";
                  const keyParts = [entry?.id, entry?._id, entry?.user?._id, idx];
                  const cardKey =
                    keyParts.filter(Boolean).join("-") || `review-${idx}`;
                  const truncated = comment.length > 260;
                  const isExpanded = !!expandedReviews[cardKey];
                  const displayComment = comment
                    ? truncated && !isExpanded
                      ? `${comment.slice(0, 260)}...`
                      : comment
                    : "No comment left.";
                  const avatarUrl =
                    entry?.user?.profilePicUrl ||
                    entry?.user?.profilePic ||
                    entry?.profilePicUrl ||
                    entry?.profilePic;
                  return (
                    <div
                      key={cardKey}
                      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-11 w-11">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={reviewer} />
                          ) : null}
                          <AvatarFallback className="bg-orange-100 text-sm font-semibold text-orange-700">
                            {initials(reviewer)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold text-slate-800">
                                {reviewer}
                              </p>
                            </div>
                            <div />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                            <ReviewStars
                              value={rating}
                              readOnly
                              size="sm"
                              className="drop-shadow-sm"
                            />
                            {when ? (
                              <span className="text-xs text-slate-500">
                                {when}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-3 whitespace-pre-wrap text-sm italic leading-relaxed text-slate-700">
                            “{displayComment}”
                            {truncated && !isExpanded ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReviews((prev) => ({
                                    ...prev,
                                    [cardKey]: true,
                                  }))
                                }
                                className="ml-1 text-blue-700 hover:underline"
                              >
                                More
                              </button>
                            ) : null}
                          </p>
                          <div />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No veridations captured yet.
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* <ProfileChatBox userId={userId} profile={profile} /> */}
      <div className="mx-auto max-w-5xl p-4 md:p-6">
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/dashboard/directory");
              }
            }}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <Card className="mb-6 overflow-hidden border border-orange-200/70 bg-[#f3f4f6] shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
          <div className="relative">
            <CardContent className="relative flex flex-col gap-6 p-6 text-slate-900 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5 md:gap-7">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-white/80 blur-xl" />
                  <div className="relative rounded-full bg-orange-200 p-1.5 shadow-sm backdrop-blur-sm">
                    <Avatar className="h-20 w-20 rounded-full border border-orange-100 shadow-md">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={fullName} />
                      ) : null}
                      <AvatarFallback className="rounded-full bg-orange-100 text-lg font-semibold text-orange-600">
                        {initials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-center gap-2 text-center md:justify-start md:text-left">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {fullName}
                    </h1>
                  </div>
                  <div className="w-full max-w-[320px] rounded-xl border border-orange-200 bg-white/80 px-3 py-2 text-left shadow-sm">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Over All Profile Rating
                    </div>
                    <div className="mt-1 text-sm font-semibold text-slate-800">
                      ⭐ {overallRating.average.toFixed(1)} / 5
                    </div>
                  </div>
                  <div />
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 md:w-auto md:items-end">
                <div className="flex flex-wrap items-center gap-3">
                  <ProfilePdfDownload userId={userId} inline />
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl border-orange-200 bg-white/80 text-orange-700 hover:bg-slate-100"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    {copied ? "Copied" : "Share"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-3 rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_20px_50px_-24px_rgba(15,23,42,0.35)] backdrop-blur-md">
              <div className="sr-only">Profile Sections</div>
              <div className="space-y-2">
                {sectionItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => scrollToSection(item.key)}
                      className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                        isActive
                          ? "bg-orange-100/80 text-orange-600 shadow-[0_6px_16px_-10px_rgba(234,88,12,0.7)]"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </span>
                      {typeof item.count === "number" ? (
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-orange-500 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="space-y-6">
            {/* === SUMMARY BOX (top) === */}
            {isActiveSection("summary") ? (
              <div id="section-summary">
                <ProfileSummaryCard profile={profile} userId={userId} />
              </div>
            ) : null}

        {/* Personal Details */}
        {isActiveSection("personal") ? (
          <SectionCard id="personal" title="Personal Details" icon={UserRound}>
            <SectionWrapper>
              <SubSection className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                {visiblePersonalDetails.length ? (
                  <div className="grid grid-cols-1 gap-3 text-left md:grid-cols-2">
                    {visiblePersonalDetails.map((detail) => {
                      const isName = detail.key === "name";
                      return (
                        <div key={detail.key} className="text-sm text-foreground">
                          <span
                            className={`font-semibold ${
                              isName ? "text-[#444]" : "text-slate-600"
                            }`}
                          >
                            {detail.label}:
                          </span>{" "}
                          <span className="font-bold text-black">
                            {detail.value || ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    No personal details provided.
                  </div>
                )}
              </SubSection>
            </SectionWrapper>
          </SectionCard>
        ) : null}

        {/* Education */}
        {isActiveSection("education") ? (
          <SectionCard id="education" title="Education" icon={FileText}>
            <SectionWrapper>
              {Array.isArray(profile?.education) && profile.education.length ? (
                <div className="space-y-6">
                  {profile.education.map((edu) => {
                    const cnt = edu.verifyCount || 0;
                    const status = eduStatus({
                      row: edu,
                      meId,
                      meProfile,
                      eduCreditMap,
                    });
                    const verifications = Array.isArray(edu.verifications)
                      ? edu.verifications
                      : [];

                    return (
                      <SubSection
                        key={String(edu._id)}
                        className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
                      >
                        <EducationDetails edu={edu} fileUrl={fileUrl} />
                        <div className="my-3 h-px bg-slate-200/40" />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
                          <div>
                            <VerificationSummaryBox
                              count={cnt}
                              type="education"
                              verifications={verifications}
                              onOpen={() =>
                                openReviewListModal("education", edu)
                              }
                            />
                          </div>
                          <div className="md:justify-self-end">
                            <VerifyButton
                              type="education"
                              status={status}
                              isBusy={busyEdu === String(edu._id)}
                              id={edu._id}
                              onVerify={beginEducationReview}
                            />
                          </div>
                        </div>
                      </SubSection>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No education added.
                </div>
              )}
            </SectionWrapper>
          </SectionCard>
        ) : null}

        {/* Experience */}
        {isActiveSection("experience") ? (
          <SectionCard id="experience" title="Experience" icon={Briefcase}>
            <SectionWrapper>
              {Array.isArray(profile?.experience) && profile.experience.length ? (
                <div className="space-y-6">
                  {profile.experience.map((exp) => {
                    const cnt = exp.verifyCount || 0;
                    const status = expStatus({
                      row: exp,
                      meId,
                      meProfile,
                      expCreditMap,
                    });
                    const verifications = Array.isArray(exp.verifications)
                      ? exp.verifications
                      : [];

                    return (
                      <SubSection
                        key={String(exp._id)}
                        className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
                      >
                        <ExperienceDetails exp={exp} fileUrl={fileUrl} />
                        <div className="my-3 h-px bg-slate-200/40" />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
                          <div>
                            <VerificationSummaryBox
                              count={cnt}
                              type="experience"
                              verifications={verifications}
                              onOpen={() =>
                                openReviewListModal("experience", exp)
                              }
                            />
                          </div>
                          <div className="md:justify-self-end">
                            <VerifyButton
                              type="experience"
                              status={status}
                              isBusy={busyExp === String(exp._id)}
                              id={exp._id}
                              onVerify={beginExperienceReview}
                            />
                          </div>
                        </div>
                      </SubSection>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No experience added.
                </div>
              )}
            </SectionWrapper>
          </SectionCard>
        ) : null}

        {/* Projects */}
        {isActiveSection("projects") ? (
          <SectionCard id="projects" title="Projects" icon={ClipboardList}>
            <SectionWrapper>
              {Array.isArray(profile?.projects) && profile.projects.length ? (
                <div className="space-y-6">
                  {profile.projects.map((project) => {
                    const cnt = project.verifyCount || 0;
                    const status = projectStatus({
                      row: project,
                      meId,
                      meProfile,
                      projectCreditMap,
                    });
                    const verifications = Array.isArray(project.verifications)
                      ? project.verifications
                      : [];

                    return (
                      <SubSection
                        key={String(project._id)}
                        className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
                      >
                        <ProjectDetails project={project} />
                        <div className="my-3 h-px bg-slate-200/40" />
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(0,320px)_1fr] md:items-start">
                          <div>
                            <VerificationSummaryBox
                              count={cnt}
                              type="project"
                              verifications={verifications}
                              onOpen={() =>
                                openReviewListModal("project", project)
                              }
                            />
                          </div>
                          <div className="md:justify-self-end">
                            <VerifyButton
                              type="project"
                              status={status}
                              isBusy={busyProject === String(project._id)}
                              id={project._id}
                              onVerify={beginProjectReview}
                            />
                          </div>
                        </div>
                      </SubSection>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No projects added.
                </div>
              )}
            </SectionWrapper>
          </SectionCard>
        ) : null}
        {/* Audio Profile */}
        {isActiveSection("audio") ? (
          <SectionCard id="audio" title="Audio Profile" icon={Mic}>
            <SectionWrapper>
              <SubSection className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                {audioUrl ? (
                  <audio controls src={audioUrl} className="w-full" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No audio profile uploaded.
                  </p>
                )}
              </SubSection>
            </SectionWrapper>
          </SectionCard>
        ) : null}

        {/* Video Profile */}
        {isActiveSection("video") ? (
          <SectionCard id="video" title="Video Profile" icon={Video}>
            <SectionWrapper>
              <SubSection className="border-orange-200/70 bg-slate-50 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
                {videoUrl ? (
                  <video controls src={videoUrl} className="w-full rounded-xl" />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No video profile uploaded.
                  </p>
                )}
              </SubSection>
            </SectionWrapper>
          </SectionCard>
        ) : null}

        <div className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={goPrev}
            disabled={safeIndex === 0}
            className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            type="button"
            variant="default"
            onClick={goNext}
            disabled={safeIndex === sectionOrder.length - 1}
            className="rounded-full border border-orange-200 bg-orange-50/80 px-4 py-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}

function initials(name) {
  if (!name) return "NA";
  const p = String(name).trim().split(/\s+/);
  return (p[0]?.[0] || "").toUpperCase() + (p[1]?.[0] || "").toUpperCase();
}

function badgeClass(count) {
  if (count >= 10) return "bg-blue-500 text-white hover:bg-blue-500";
  if (count >= 5) return "bg-yellow-500 text-black hover:bg-yellow-500";
  if (count >= 3) return "bg-zinc-300 text-zinc-900 hover:bg-zinc-300";
  return "bg-zinc-900 text-white hover:bg-zinc-900";
}





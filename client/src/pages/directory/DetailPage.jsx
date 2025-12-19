/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/directory/DetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import {
  ArrowLeft,
  FileText,
  Briefcase,
  CheckCircle2,
  Heart,
  Share2,
  MoreVertical,
  Star,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import AccordionSection from "@/components/common/AccordionSection";
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
} from "@/services/verifyService";
import ProfileChatBox from "./ProfileChatBox";
import ProfileSummaryCard from "@/components/directory/ProfileSummaryCard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");
const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normalizeInstitute = normalize;
const normalizeCompany = normalize;

// Utility: credits -> Map
const creditsToMap = (arr, keyField) => {
  const out = new Map();
  (arr || []).forEach((b) => {
    const k = b?.[keyField];
    if (k)
      out.set(k, {
        available: Number(b.available || 0),
        used: Number(b.used || 0),
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

const btnStyleByStatus = (status) => {
  switch (status) {
    case "already-verified":
      return "bg-green-600 hover:bg-green-600 text-white disabled:opacity-100 cursor-default";
    case "eligible":
      return "bg-blue-600 hover:bg-blue-600 text-white disabled:opacity-100";
    case "no-credits":
      return "bg-gray-400 hover:bg-gray-400 text-white disabled:opacity-100 cursor-not-allowed";
    case "ineligible":
    default:
      return "bg-red-600 hover:bg-red-600 text-white disabled:opacity-100 cursor-not-allowed";
  }
};

// === shared helpers for labels/badges (keep brand wording) ===
function verifyCountText(count) {
  return count === 1
    ? "Person has already verified"
    : "Persons have already verified";
}

function getVerifyLabel(type, status, isBusy) {
  if (status === "already-verified")
    return "You have already Veridate this section";
  if (status === "eligible") return isBusy ? "Verifying..." : "Veridate Now";
  if (status === "no-credits")
    return "Unable to Veridate: No credits available";
  // ineligible message depends on type
  return type === "education"
    ? "Unable to Veridate: Education don't match"
    : "Unable to Veridate: Company don't match";
}

// === small presentational helpers ===
function ReviewStars({ value = 5, onChange, readOnly = false, size = "lg", className = "" }) {
  const stars = [1, 2, 3, 4, 5];
  const numericValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const iconSize =
    size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-6 w-6";

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

function VerifyBadge({ count }) {
  return (
    <Badge className={`${badgeClass(count)} rounded-lg`}>
      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
      {count} {verifyCountText(count)}
    </Badge>
  );
}

function VerifyButton({ type, status, isBusy, id, onVerify }) {
  return (
    <Button
      size="sm"
      className={`${btnStyleByStatus(status)} rounded-xl`}
      onClick={() => status === "eligible" && onVerify(String(id))}
      disabled={status !== "eligible" || isBusy}
    >
      {getVerifyLabel(type, status, isBusy)}
    </Button>
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
      className="mt-2 w-full rounded-lg border border-orange-300 bg-gradient-to-r from-orange-500 via-orange-400 to-amber-300 px-3 py-2 text-left text-white shadow transition hover:brightness-110 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
    >
      <div className="flex items-center gap-2">
        <ReviewStars value={average} readOnly size="sm" className="drop-shadow-sm" />
        <span className="text-xs font-semibold text-white drop-shadow-sm">
          {average.toFixed(1)} / 5 | {numericRatings.length} review
          {numericRatings.length > 1 ? "s" : ""}
        </span>
      </div>
      
     
    </button>
  );
}

function reviewerLabel(entry) {
  const user = entry?.user;
  if (user && typeof user === "object") {
    return (
      user.name ||
      user.fullName ||
      user.email ||
      "Verified user"
    );
  }
  return "Verified user";
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString();
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
  return (
    <DefinitionList>
      <DLRow label="Degree Title">{edu.degreeTitle}</DLRow>
      <DLRow label="Institute">{edu.institute}</DLRow>
      <DLRow label="Institute Website">
        <LinkText href={edu.instituteWebsite}>{edu.instituteWebsite}</LinkText>
      </DLRow>
      <DLRow label="Start">{fmtDate(edu.startDate)}</DLRow>
      <DLRow label="End">{fmtDate(edu.endDate)}</DLRow>
      <DLRow label="Degree File">
        <LinkText
          href={
            edu.degreeFile ? fileUrl("education", edu.degreeFile) : undefined
          }
        >
          {edu.degreeFile || "—"}
        </LinkText>
      </DLRow>
    </DefinitionList>
  );
}

function ExperienceDetails({ exp, fileUrl }) {
  return (
    <DefinitionList>
      <DLRow label="Job Title">{exp.jobTitle}</DLRow>
      <DLRow label="Company">{exp.company}</DLRow>
      <DLRow label="Company Website">
        <LinkText href={exp.companyWebsite}>{exp.companyWebsite}</LinkText>
      </DLRow>
      <DLRow label="Start">{fmtDate(exp.startDate)}</DLRow>
      <DLRow label="End">{fmtDate(exp.endDate)}</DLRow>
      <DLRow label="Experience Letter">
        <LinkText
          href={
            exp.experienceLetterFile
              ? fileUrl("experience", exp.experienceLetterFile)
              : undefined
          }
        >
          {exp.experienceLetterFile || "—"}
        </LinkText>
      </DLRow>
      <DLRow label="Job Functions">{joinArr(exp.jobFunctions)}</DLRow>
      <DLRow label="Industry">{exp.industry}</DLRow>
    </DefinitionList>
  );
}

export default function DetailPage() {
  const { userId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user: authUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [meProfile, setMeProfile] = useState(null);
  const [openValue, setOpenValue] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [busyEdu, setBusyEdu] = useState("");
  const [busyExp, setBusyExp] = useState("");
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
        : row?.jobTitle || row?.company || "Experience verification";

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
          : await onVerifyExp(rowId, reviewPayload);

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
  const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const avatarUrl =
    profile?.profilePicUrl ||
    (profile?.profilePic ? fileUrl("profile", profile.profilePic) : undefined);
  const educationCount = Array.isArray(profile?.education)
    ? profile.education.length
    : 0;
  const experienceCount = Array.isArray(profile?.experience)
    ? profile.experience.length
    : 0;
  const lastUpdated = profile?.updatedAt ? fmtDate(profile.updatedAt) : null;

  return (
    <>
      <Dialog open={reviewModal.open} onOpenChange={handleReviewDialogChange}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>
              {reviewModal.type === "education"
                ? "Veridate education entry"
                : reviewModal.type === "experience"
                ? "Veridate experience entry"
                : "Veridate profile entry"}
            </DialogTitle>
            <DialogDescription>
              Share a star rating (required) and an optional comment before
              submitting your verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Star rating</p>
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
              {reviewEntries.length
                ? `Collected from ${reviewEntries.length} verifier${
                    reviewEntries.length > 1 ? "s" : ""
                  }.`
                : "No reviews captured yet."}
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
                    {reviewEntries.length} review
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
                              <p className="text-sm font-semibold uppercase tracking-wide text-slate-800">
                                {reviewer}
                              </p>
                              <p className="text-xs text-slate-500">1 review</p>
                            </div>
                            <button
                              type="button"
                              className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
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
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                            {displayComment}
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
                          <div className="mt-4 flex items-center gap-6 text-sm text-slate-500">
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:text-orange-600"
                            >
                              <Heart className="h-4 w-4" />
                              <span>Helpful</span>
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:text-orange-600"
                            >
                              <Share2 className="h-4 w-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No reviews captured yet.
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
            className="flex items-center gap-2 bg-orange-200 text-black"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <Card className="mb-6 overflow-hidden border border-orange-100/60 shadow-[0_18px_50px_-26px_rgba(230,146,64,0.45)]">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-100 via-orange-50 to-amber-100" />
            <CardContent className="relative flex flex-col gap-6 p-6 text-slate-900 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4 md:gap-6">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-white/80 blur-xl" />
                  <div className="relative rounded-3xl bg-orange-200 p-1.5 shadow-sm backdrop-blur-sm">
                    <Avatar className="h-20 w-20 rounded-2xl border border-orange-100 shadow-md">
                      {avatarUrl ? (
                        <AvatarImage src={avatarUrl} alt={fullName} />
                      ) : null}
                      <AvatarFallback className="rounded-2xl bg-orange-100 text-lg font-semibold text-orange-600">
                        {initials(fullName)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                      {fullName}
                    </h1>
                    {profile?.gender ? (
                      <Badge className="rounded-full border border-orange-200/80 bg-orange-50/80 px-3 py-1 text-[13px] font-medium text-orange-700">
                        {profile.gender}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 md:text-sm">
                    {profile?.email ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-orange-700 shadow-sm">
                        <Mail className="h-3.5 w-3.5 text-orange-500" />
                        {profile.email}
                      </span>
                    ) : null}
                    {profile?.mobile ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-orange-700 shadow-sm">
                        <Phone className="h-3.5 w-3.5 text-orange-500" />
                        {profile.mobile}
                      </span>
                    ) : null}
                    {location ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1 text-orange-700 shadow-sm">
                        <MapPin className="h-3.5 w-3.5 text-orange-500" />
                        {location}
                      </span>
                    ) : null}
                    {!profile?.email && !profile?.mobile && !location ? (
                      <span className="text-sm text-slate-500">
                        Contact details not provided
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex w-full flex-col gap-3 text-orange-700/80 md:w-auto md:items-end">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-semibold text-orange-700">
                      {educationCount}
                    </span>
                    <span className="text-xs uppercase tracking-[0.25em] text-orange-600/70">
                      Education
                    </span>
                  </div>
                  <div className="hidden h-10 w-px bg-orange-200 md:block" />
                  <div className="flex flex-col items-center">
                    <span className="text-xl font-semibold text-orange-700">
                      {experienceCount}
                    </span>
                    <span className="text-xs uppercase tracking-[0.25em] text-orange-600/70">
                      Experience
                    </span>
                  </div>
                </div>
                {lastUpdated ? (
                  <span className="text-[11px] uppercase tracking-[0.3em] text-orange-500/60">
                    Updated {lastUpdated}
                  </span>
                ) : null}
              </div>
            </CardContent>
          </div>
        </Card>

        {/* === SUMMARY BOX (top) === */}
        <ProfileSummaryCard profile={profile} userId={userId} />

        {/* Education */}
        <AccordionSection
          title="Education"
          icon={FileText}
          value="education"
          openValue={openValue}
          setOpenValue={setOpenValue}
          locked={!!profile?.educationLocked}
          contentClassName="text-left"
        >
          <SectionWrapper>
            {Array.isArray(profile?.education) && profile.education.length ? (
              <div className="space-y-4">
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
                    <SubSection key={String(edu._id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <VerifyBadge count={cnt} />
                        </div>
                        <VerifyButton
                          type="education"
                          status={status}
                          isBusy={busyEdu === String(edu._id)}
                          id={edu._id}
                          onVerify={beginEducationReview}
                        />
                      </div>
                      <VerificationPreview
                        verifications={verifications}
                        onOpen={() => openReviewListModal("education", edu)}
                      />
                      <EducationDetails edu={edu} fileUrl={fileUrl} />
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
        </AccordionSection>

        {/* Experience */}
        <AccordionSection
          title="Experience"
          icon={Briefcase}
          value="experience"
          openValue={openValue}
          setOpenValue={setOpenValue}
          locked={!!profile?.experienceLocked}
          contentClassName="text-left"
        >
          <SectionWrapper>
            {Array.isArray(profile?.experience) && profile.experience.length ? (
              <div className="space-y-4">
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
                    <SubSection key={String(exp._id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <VerifyBadge count={cnt} />
                        </div>
                        <VerifyButton
                          type="experience"
                          status={status}
                          isBusy={busyExp === String(exp._id)}
                          id={exp._id}
                          onVerify={beginExperienceReview}
                        />
                      </div>
                      <VerificationPreview
                        verifications={verifications}
                        onOpen={() => openReviewListModal("experience", exp)}
                      />
                      <ExperienceDetails exp={exp} fileUrl={fileUrl} />
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
        </AccordionSection>
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

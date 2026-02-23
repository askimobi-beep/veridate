import React, { useEffect, useId, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Heart,
  MapPin,
  MessageSquare,
  MoveRight,
  Download,
  XCircle,
} from "lucide-react";
import { initials } from "@/utils/profileUtils";
import axiosInstance from "@/utils/axiosInstance";
import buildProfilePdf from "@/utils/buildProfilePdf";

async function toDataUrl(url) {
  try {
    if (!url) return "";
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result || "");
      r.onerror = () => resolve("");
      r.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

const fmtDate = (value) => {
  if (!value) return "N/A";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "N/A";
  return dt.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

const calcYears = (start, end) => {
  if (!start) return null;
  const s = new Date(start);
  if (Number.isNaN(s.getTime())) return null;
  const e = end ? new Date(end) : new Date();
  if (Number.isNaN(e.getTime())) return null;
  const diff = e.getTime() - s.getTime();
  if (diff < 0) return null;
  return diff / MS_PER_YEAR;
};

const formatYears = (years) => {
  if (!Number.isFinite(years)) return "N/A";
  const rounded = Math.round(years * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
};

const formatDurationLabel = (years) => {
  if (!Number.isFinite(years)) return "N/A years";
  if (years < 1) {
    const rounded = Math.round(years * 100) / 100;
    return `${rounded.toFixed(2)} years`;
  }
  return `${formatYears(years)} years`;
};

const formatRange = (start, end) => {
  const range = `${fmtDate(start)} - ${fmtDate(end)}`;
  const years = calcYears(start, end);
  const label = formatDurationLabel(years);
  return `${range} (${label})`;
};

const formatRangeNoYears = (start, end) => `${fmtDate(start)} - ${fmtDate(end)}`;

const normalizeList = (value) => {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
};

const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normalizeInstitute = normalize;
const normalizeCompany = normalize;

const overlapDays = (startA, endA, startB, endB) => {
  if (!startA || !startB) return 0;
  const s = Math.max(new Date(startA).getTime(), new Date(startB).getTime());
  const e = Math.min(
    endA ? new Date(endA).getTime() : Date.now(),
    endB ? new Date(endB).getTime() : Date.now()
  );
  if (e <= s) return 0;
  return (e - s) / (1000 * 60 * 60 * 24);
};

function eduStatus({ row, meId, meProfile }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.instituteKey || normalizeInstitute(row?.institute);
  if (!key) return "ineligible";

  const matchingRows = (meProfile?.education || []).filter(
    (e) => (e.instituteKey || normalizeInstitute(e.institute)) === key
  );
  if (!matchingRows.length) return "ineligible";

  const hasOverlap = matchingRows.some(
    (e) => overlapDays(e.startDate, e.endDate, row.startDate, row.endDate) >= 30
  );
  if (!hasOverlap) return "no-overlap";

  return "eligible";
}

function expStatus({ row, meId, meProfile }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.companyKey || normalizeCompany(row?.company);
  if (!key) return "ineligible";

  const matchingRows = (meProfile?.experience || []).filter(
    (e) => (e.companyKey || normalizeCompany(e.company)) === key
  );
  if (!matchingRows.length) return "ineligible";

  const hasOverlap = matchingRows.some(
    (e) => overlapDays(e.startDate, e.endDate, row.startDate, row.endDate) >= 30
  );
  if (!hasOverlap) return "no-overlap";

  return "eligible";
}

function projectStatus({ row, meId, meProfile }) {
  const already =
    Array.isArray(row?.verifiedBy) &&
    row.verifiedBy.some((x) => String(x) === String(meId));
  if (already) return "already-verified";

  const key = row?.companyKey || normalizeCompany(row?.company);
  if (!key) return "ineligible";

  const matchingRows = (meProfile?.experience || []).filter(
    (e) => (e.companyKey || normalizeCompany(e.company)) === key
  );
  if (!matchingRows.length) return "ineligible";

  const hasOverlap = matchingRows.some(
    (e) => overlapDays(e.startDate, e.endDate, row.startDate, row.endDate) >= 30
  );
  if (!hasOverlap) return "no-overlap";

  return "eligible";
}

const sortLatest = (list = []) => {
  const copy = [...normalizeList(list)];
  copy.sort((a, b) => {
    const ad = new Date(a?.endDate || a?.startDate || 0).getTime();
    const bd = new Date(b?.endDate || b?.startDate || 0).getTime();
    return bd - ad;
  });
  return copy.slice(0, 3);
};

const sumYears = (list = []) =>
  normalizeList(list).reduce((acc, row) => {
    const years = calcYears(row?.startDate, row?.endDate);
    return Number.isFinite(years) ? acc + years : acc;
  }, 0);

const recordAverageRating = (row) => {
  const ratings = Array.isArray(row?.verifications)
    ? row.verifications
        .map((entry) => Number(entry?.rating ?? 0))
        .filter((r) => Number.isFinite(r) && r >= 0)
    : [];
  if (!ratings.length) return 0;
  return ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length;
};

const overallProfileRating = (profile) => {
  if (!profile) return 0;
  const rows = [
    ...(Array.isArray(profile?.education) ? profile.education : []),
    ...(Array.isArray(profile?.experience) ? profile.experience : []),
    ...(Array.isArray(profile?.projects) ? profile.projects : []),
  ];
  const totalRecords = rows.length;
  const sumRatings = rows.reduce((acc, row) => acc + recordAverageRating(row), 0);
  return totalRecords ? sumRatings / totalRecords : 0;
};

export default function DirectoryCard({
  profile,
  meProfile,
  authUser,
  onViewProfile,
  onViewSummary,
  onVerifySection,
}) {
  const [downloading, setDownloading] = useState(false);
  const [detail, setDetail] = useState(null);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const meId = authUser?._id;

  useEffect(() => {
    let active = true;
    if (!profile?.user) return undefined;
    axiosInstance
      .get(`/profile/getonid/${encodeURIComponent(profile.user)}`)
      .then((res) => {
        if (active) setDetail(res?.data || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.user]);

  const expSource = detail?.experience ?? profile.experience;
  const eduSource = detail?.education ?? profile.education;
  const projSource = detail?.projects ?? profile.projects;
  const experiences = sortLatest(expSource);
  const projects = sortLatest(projSource);
  const educations = sortLatest(eduSource);
  const allExperiences = normalizeList(expSource);
  const allProjects = normalizeList(projSource);
  const allEducations = normalizeList(eduSource);
  const totalExpYears = sumYears(expSource);
  const totalExpLabel = formatDurationLabel(totalExpYears);
  const ratingValue = overallProfileRating(detail || profile);
  const hasAudio = Boolean(detail?.audioProfile);
  const hasVideo = Boolean(detail?.videoProfile);

  const canVerifyEducation =
    Boolean(meId) &&
    String(meId) !== String(profile?.user || profile?._id) &&
    allEducations.some(
      (row) => eduStatus({ row, meId, meProfile }) === "eligible"
    );

  const canVerifyExperience =
    Boolean(meId) &&
    String(meId) !== String(profile?.user || profile?._id) &&
    allExperiences.some(
      (row) => expStatus({ row, meId, meProfile }) === "eligible"
    );

  const canVerifyProjects =
    Boolean(meId) &&
    String(meId) !== String(profile?.user || profile?._id) &&
    allProjects.some(
      (row) => projectStatus({ row, meId, meProfile }) === "eligible"
    );

  const handleDownload = async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      const res = await axiosInstance.get(
        `/profile/getonid/${encodeURIComponent(profile.user)}`
      );
      const payload = res?.data;
      if (!payload) return;
      const photoSrc = await toDataUrl(payload.profilePicUrl);
      const profileUrl = `${window.location.origin}/dashboard/profiles/${profile.user}`;
      const pdf = await buildProfilePdf({
        data: payload,
        photoDataUrl: photoSrc,
        profileUrl,
      });
      pdf.save(`Profile_${payload?.name || profile.user}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="hover:shadow-xl transition rounded-2xl border border-gray-200">
      <CardContent className="p-5 text-left">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-20 w-20 shrink-0 ring-2 ring-[color:var(--brand-orange)]">
              <AvatarImage src={profile.profilePicUrl || ""} alt={profile.name} />
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-lg font-semibold text-slate-900">
                {profile.name || "Unnamed"}
              </div>
              <div className="mt-1 flex items-center gap-1 text-sm font-medium text-slate-600">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location || "N/A"}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm font-semibold brand-orange">
                <RatingStars value={ratingValue} />
                <span>
                  {Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "0.0"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewSummary?.(profile)}
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
              title="AI Profile Summary"
            >
              <GeminiIcon className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
              title="Add to Favorities"
            >
              <Heart className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)] disabled:cursor-not-allowed disabled:opacity-60"
              title="Download profile"
            >
              <Download className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
              title="Message"
            >
              <MessageSquare className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewProfile?.(profile)}
              className="ml-2 inline-flex items-center gap-2 text-sm font-semibold brand-orange transition"
            >
              View Profile
              <MoveRight className="h-5 w-6" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700 text-left">
          <div className="text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-700 text-left">
                Work Experience ({totalExpLabel})
              </div>
              {canVerifyExperience ? (
                <button
                  type="button"
                  onClick={() => onVerifySection?.(profile, "experience")}
                  className="text-xs font-semibold text-[color:var(--brand-orange)]"
                >
                  Verify
                </button>
              ) : null}
            </div>
            <div className="mt-1 space-y-1 text-left">
              {experiences.length ? (
                experiences.map((row, idx) => (
                  <div key={`exp-${idx}`} className="text-left">
                    {row.jobTitle || "N/A"} at {row.company || "N/A"}{" "}
                    <span className="mx-2 text-slate-400">|</span>
                    {formatRange(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No experience added.</div>
              )}
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-700 text-left">Projects</div>
              {canVerifyProjects ? (
                <button
                  type="button"
                  onClick={() => onVerifySection?.(profile, "projects")}
                  className="text-xs font-semibold text-[color:var(--brand-orange)]"
                >
                  Verify
                </button>
              ) : null}
            </div>
            <div className="mt-1 space-y-1 text-left">
              {projects.length ? (
                projects.map((row, idx) => (
                  <div key={`proj-${idx}`} className="text-left">
                    {row.projectTitle || "N/A"} at {row.company || "N/A"}{" "}
                    <span className="mx-2 text-slate-400">|</span>
                    {formatRangeNoYears(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No projects added.</div>
              )}
            </div>
          </div>

          <div className="text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold text-slate-700 text-left">Education</div>
              {canVerifyEducation ? (
                <button
                  type="button"
                  onClick={() => onVerifySection?.(profile, "education")}
                  className="text-xs font-semibold text-[color:var(--brand-orange)]"
                >
                  Verify
                </button>
              ) : null}
            </div>
            <div className="mt-1 space-y-1 text-left">
              {educations.length ? (
                educations.map((row, idx) => (
                  <div key={`edu-${idx}`} className="text-left">
                    {row.degreeTitle || "N/A"} at {row.institute || "N/A"}{" "}
                    <span className="mx-2 text-slate-400">|</span>
                    {formatRangeNoYears(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No education added.</div>
              )}
              <div className="mt-4 text-left">
                <div className="mb-2 h-px w-full bg-slate-200/80" />
                <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
                  <div className="flex items-center gap-2">
                    {hasAudio ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Audio Profile</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasVideo ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span>Video Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


const RatingStars = ({ value = 0 }) => {
  const rating = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;
  return (
    <div className="flex items-center gap-1 brand-orange">
      {Array.from({ length: 5 }).map((_, index) => {
        const starIndex = index + 1;
        const fill =
          rating >= starIndex
            ? "full"
            : rating >= starIndex - 0.5
            ? "half"
            : "empty";
        return <StarGlyph key={`star-${starIndex}`} fill={fill} />;
      })}
    </div>
  );
};

const StarGlyph = ({ fill }) => {
  const clipId = useId();
  const pct = fill === "full" ? 100 : fill === "half" ? 50 : 0;
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      aria-hidden="true"
      fill="none"
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={`${pct}%`} height="100%" x="0" y="0" />
        </clipPath>
      </defs>
      <path
        d="M12 2l2.9 6.1 6.7.6-5 4.3 1.5 6.5L12 16.9 5.9 19.5 7.4 13 2.4 8.7l6.7-.6L12 2z"
        fill="currentColor"
        clipPath={`url(#${clipId})`}
      />
      <path
        d="M12 2l2.9 6.1 6.7.6-5 4.3 1.5 6.5L12 16.9 5.9 19.5 7.4 13 2.4 8.7l6.7-.6L12 2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
};

const GeminiIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <path
      d="M9 3l1.6 3.7L14.3 8l-3.7 1.6L9 13.3 7.4 9.6 3.7 8l3.7-1.3L9 3Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.9"
    />
    <path
      d="M19 11l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.8"
    />
    <path
      d="M19 3l.5 1 1 .5-1 .5-.5 1-.5-1-1-.5 1-.5.5-1Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      opacity="0.7"
    />
  </svg>
);










import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  Heart,
  MapPin,
  MessageSquare,
  MoveRight,
  Sparkles,
  Star,
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
    const months = years * 12;
    const rounded = Math.round(months * 10) / 10;
    const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `${value} months`;
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

export default function DirectoryCard({ profile, onViewProfile, onViewSummary }) {
  const [downloading, setDownloading] = useState(false);
  const [detail, setDetail] = useState(null);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

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
  const totalExpYears = sumYears(expSource);
  const totalExpLabel = formatDurationLabel(totalExpYears);
  const ratingValue = overallProfileRating(detail || profile);
  const hasAudio = Boolean(detail?.audioProfile);
  const hasVideo = Boolean(detail?.videoProfile);

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
            <Avatar className="h-20 w-20 ring-2 ring-orange-200">
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
              <div className="mt-1 flex items-center gap-1 text-sm font-semibold text-orange-600">
                <Star className="h-4 w-4" />
                <span>{Number.isFinite(ratingValue) ? ratingValue.toFixed(1) : "0.0"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewSummary?.(profile)}
              className="h-9 px-3 rounded-full border border-orange-200 bg-orange-50 text-orange-700 transition hover:border-orange-300 hover:text-orange-800"
              title="AI Profile Summary"
            >
              <span className="inline-flex items-center gap-2 text-xs font-semibold">
                <Sparkles className="h-4 w-4" />
                AI Profile Summary
              </span>
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              title="Add to Favorities"
            >
              <Heart className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              title="Download profile"
            >
              <Download className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              title="Message"
            >
              <MessageSquare className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewProfile?.(profile)}
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 transition hover:text-orange-700"
            >
              View Profile
              <MoveRight className="h-5 w-6" />
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700 text-left">
          <div className="text-left">
            <div className="font-semibold text-slate-700 text-left">
              Work Experience ({totalExpLabel})
            </div>
            <div className="mt-1 space-y-1 text-left">
              {experiences.length ? (
                experiences.map((row, idx) => (
                  <div key={`exp-${idx}`} className="text-left">
                    {row.jobTitle || "N/A"} at {row.company || "N/A"} |{" "}
                    {formatRange(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No experience added.</div>
              )}
            </div>
          </div>

          <div className="text-left">
            <div className="font-semibold text-slate-700 text-left">Projects</div>
            <div className="mt-1 space-y-1 text-left">
              {projects.length ? (
                projects.map((row, idx) => (
                  <div key={`proj-${idx}`} className="text-left">
                    {row.projectTitle || "N/A"} at {row.company || "N/A"} |{" "}
                    {formatRangeNoYears(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No projects added.</div>
              )}
            </div>
          </div>

          <div className="text-left">
            <div className="font-semibold text-slate-700 text-left">Education</div>
            <div className="mt-1 space-y-1 text-left">
              {educations.length ? (
                educations.map((row, idx) => (
                  <div key={`edu-${idx}`} className="text-left">
                    {row.degreeTitle || "N/A"} at {row.institute || "N/A"} |{" "}
                    {formatRangeNoYears(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400 text-left">No education added.</div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-4 text-left">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  {hasAudio ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span>Audio Profile</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
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
      </CardContent>
    </Card>
  );
}







import React, { useCallback, useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const safeNum = (n) => (Number.isFinite(n) ? n : 0);
const yearsBetween = (start, end) => {
  try {
    const s = start ? new Date(start).getTime() : NaN;
    const e = end ? new Date(end).getTime() : Date.now();
    if (!Number.isFinite(s) || !Number.isFinite(e)) return 0;
    const yrs = (e - s) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0, yrs);
  } catch {
    return 0;
  }
};

function guessHeadlineRole(exps) {
  if (!Array.isArray(exps) || !exps.length) return "";
  const sorted = [...exps].sort((a, b) => {
    const ae = a?.endDate ? new Date(a.endDate).getTime() : Infinity;
    const be = b?.endDate ? new Date(b.endDate).getTime() : Infinity;
    return be - ae;
  });
  const top = sorted[0];
  return [top?.jobTitle, top?.company].filter(Boolean).join(" @ ");
}

function quickLocalSummary(profile) {
  const name = profile?.name || "This candidate";
  const edu = Array.isArray(profile?.education) ? profile.education : [];
  const exp = Array.isArray(profile?.experience) ? profile.experience : [];

  const eduCount = edu.length;
  const expCount = exp.length;

  const totalYrs = safeNum(
    exp.reduce((acc, r) => acc + yearsBetween(r.startDate, r.endDate), 0)
  ).toFixed(1);

  const headline = guessHeadlineRole(exp);
  const topDegrees = edu
    .slice(0, 2)
    .map((e) => [e.degreeTitle, e.institute].filter(Boolean).join(" - "))
    .filter(Boolean)
    .join("; ");

  const industries = Array.from(
    new Set(exp.map((e) => (e.industry || "").trim()).filter(Boolean))
  ).slice(0, 3);

  const lines = [];
  if (headline) {
    lines.push(`${name} is currently ${headline}.`);
  } else {
    lines.push(`${name} has shared their professional background.`);
  }

  lines.push(
    expCount
      ? `They bring approximately ${totalYrs} years of experience across ${expCount} role${expCount > 1 ? "s" : ""}${
          industries.length ? ` within ${industries.join(", ")}` : ""
        }.`
      : "They have not listed formal work experience yet."
  );
  lines.push(
    eduCount
      ? `Their education includes ${topDegrees || `${eduCount} recorded achievement${eduCount > 1 ? "s" : ""}`}.`
      : "They have not added education details yet."
  );

  return lines.join(" ");
}

function buildAIContext(profile) {
  if (!profile) return {};
  return {
    name: profile.name,
    city: profile.city,
    country: profile.country,
    email: profile.email,
    mobile: profile.mobile,
    education: (profile.education || []).map((e) => ({
      degreeTitle: e.degreeTitle,
      institute: e.institute,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
    experience: (profile.experience || []).map((e) => ({
      jobTitle: e.jobTitle,
      company: e.company,
      industry: e.industry,
      jobFunctions: e.jobFunctions,
      startDate: e.startDate,
      endDate: e.endDate,
    })),
  };
}

const escapeRegExp = (str) =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function highlightSummaryText(text, phrases) {
  if (!text) return text;
  const unique = Array.from(
    new Set(
      (phrases || [])
        .map((p) => (typeof p === "string" ? p.trim() : ""))
        .filter((p) => p.length > 0)
    )
  );
  if (!unique.length) return text;

  const pattern = new RegExp(
    `(${unique.map((p) => escapeRegExp(p)).join("|")})`,
    "gi"
  );

  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={`highlight-${key++}`} className="font-semibold text-foreground">
        {match[0]}
      </strong>
    );
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

function SummaryLoadingState() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--brand-orange)]/70 bg-gradient-to-br from-[color:var(--brand-orange)]/80 via-white to-[color:var(--brand-orange)]/60 p-6 shadow-sm">
      <div className="absolute inset-0 opacity-80 bg-[radial-gradient(circle_at_top_right,_rgba(249,115,22,0.18),_transparent_55%)]" />
      <div className="relative space-y-3 text-left">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-[color:var(--brand-orange)]/80">
          <Loader2 className="h-4 w-4 animate-spin text-[color:var(--brand-orange)]/90" />
          Weaving Insights
        </span>
        <p className="text-lg font-semibold leading-snug text-transparent bg-clip-text bg-gradient-to-r from-[color:var(--brand-orange)] via-[color:var(--brand-orange)] to-[color:var(--brand-orange)]">
          Crafting an AI narrative for this candidate...
        </p>
      </div>
    </div>
  );
}

export default function ProfileSummaryCard({ profile, userId }) {
  const [summary, setSummary] = useState("");
  const [summaryErr, setSummaryErr] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(
    async (force = false) => {
      if (!profile) return;

      setSummaryErr("");
      setSummaryLoading(true);
      try {
        const res = await axiosInstance.post("/profile/ai/profile-summary", {
          userId,
          force,
          context: buildAIContext(profile),
        });
        const text = res?.data?.summary;
        if (text && typeof text === "string") {
          setSummary(text.trim());
        } else {
          setSummary(quickLocalSummary(profile));
          setSummaryErr("AI summary unavailable - showing a quick local overview.");
        }
      } catch {
        setSummary(quickLocalSummary(profile));
        setSummaryErr("AI summary failed - showing a quick local overview.");
      } finally {
        setSummaryLoading(false);
      }
    },
    [profile, userId]
  );

  useEffect(() => {
    if (!profile) return;
    fetchSummary(false);
  }, [profile?._id, fetchSummary]);

  if (!profile) return null;

  const formattedSummary = summary
    ? summary.replace(/\s*\n\s*/g, " ").trim()
    : "";

  const highlightPhrases = useMemo(() => {
    const phrases = [];
    (profile.experience || []).forEach((exp) => {
      if (exp?.jobTitle) phrases.push(exp.jobTitle);
      if (exp?.company) phrases.push(exp.company);
    });
    (profile.education || []).forEach((edu) => {
      if (edu?.degreeTitle) phrases.push(edu.degreeTitle);
      if (edu?.institute) phrases.push(edu.institute);
    });
    phrases.push("experience", "education");
    return phrases;
  }, [profile]);

  const renderedSummary = useMemo(
    () => highlightSummaryText(formattedSummary, highlightPhrases),
    [formattedSummary, highlightPhrases]
  );

  return (
    <Card className="mb-6 rounded-2xl border border-white/60 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-2 border-b border-white/60 px-4 py-3">
        <GeminiIcon className="h-4 w-4 text-[color:var(--brand-orange)]" />
        <h3 className="text-sm font-semibold text-slate-800">
          AI Profile Summary
        </h3>
      </div>
      <CardContent className="p-4 text-left">
        <div>
          {summaryLoading ? (
            <SummaryLoadingState />
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Overview
              </p>
              <p className="text-base leading-relaxed text-muted-foreground">
                {formattedSummary ? renderedSummary : "No overview available yet."}
              </p>
            </div>
          )}
          {summaryErr ? (
            <p className="mt-2 text-xs text-[color:var(--brand-orange)]">{summaryErr}</p>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Powered by OpenAI
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

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

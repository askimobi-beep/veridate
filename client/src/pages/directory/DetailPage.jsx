/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/directory/DetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, FileText, Briefcase, CheckCircle2, Sparkles, Copy, Loader2 } from "lucide-react";
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
import { verifyEducationRow, verifyExperienceRow } from "@/services/verifyService";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");
const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normalizeInstitute = normalize;
const normalizeCompany = normalize;

// Utility: credits → Map
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

// === tiny helpers for summary fallback ===
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
  // pick the most recent by endDate (or current)
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

  // rough total years
  const totalYrs = safeNum(
    exp.reduce((acc, r) => acc + yearsBetween(r.startDate, r.endDate), 0)
  ).toFixed(1);

  const headline = guessHeadlineRole(exp);
  const topDegrees = edu
    .slice(0, 2)
    .map((e) => [e.degreeTitle, e.institute].filter(Boolean).join(" — "))
    .filter(Boolean)
    .join("; ");

  const industries = Array.from(
    new Set(exp.map((e) => (e.industry || "").trim()).filter(Boolean))
  ).slice(0, 3);

  return [
    `${name}${headline ? ` is currently ${headline}` : ""}.`,
    expCount
      ? `Brings ~${totalYrs} years across ${expCount} role${expCount > 1 ? "s" : ""}${industries.length ? ` (${industries.join(", ")})` : ""}.`
      : `No listed work experience.`,
    eduCount ? `Education: ${topDegrees || `${eduCount} record(s)`}.` : `No listed education.`,
  ].join(" ");
}

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
  if (status === "already-verified") return "You have already Veridate this section";
  if (status === "eligible") return isBusy ? "Verifying…" : "Veridate Now";
  if (status === "no-credits") return "Unable to Veridate: No credits available";
  // ineligible message depends on type
  return type === "education"
    ? "Unable to Veridate: Education don't match"
    : "Unable to Veridate: Company don't match";
}

// === small presentational helpers ===
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
        <LinkText href={edu.degreeFile ? fileUrl("education", edu.degreeFile) : undefined}>
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
        <LinkText href={exp.experienceLetterFile ? fileUrl("experience", exp.experienceLetterFile) : undefined}>
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

  // === SUMMARY BOX state ===
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryErr, setSummaryErr] = useState("");

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

  // === SUMMARY BOX: fetch from backend (Zoho/Zia or your AI) ===
  const buildAIContext = (p) => {
    if (!p) return {};
    return {
      name: p.name,
      city: p.city,
      country: p.country,
      email: p.email,
      mobile: p.mobile,
      education: (p.education || []).map((e) => ({
        degreeTitle: e.degreeTitle,
        institute: e.institute,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      experience: (p.experience || []).map((e) => ({
        jobTitle: e.jobTitle,
        company: e.company,
        industry: e.industry,
        jobFunctions: e.jobFunctions,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      // add any other fields you want summarized
    };
  };

  const fetchSummary = async (force = false) => {
    if (!profile) return;
    setSummaryErr("");
    setSummaryLoading(true);
    try {
      // Try your backend (should proxy to Zoho Zia / OpenAI and cache result)
      const res = await axiosInstance.post("/profile/ai/profile-summary", {
        userId,
        force,
        context: buildAIContext(profile),
      });
      const text = res?.data?.summary;
      if (text && typeof text === "string") {
        setSummary(text.trim());
      } else {
        // fallback to local quick summary
        setSummary(quickLocalSummary(profile));
        setSummaryErr("AI summary unavailable — showing a quick local overview.");
      }
    } catch (e) {
      setSummary(quickLocalSummary(profile));
      setSummaryErr("AI summary failed — showing a quick local overview.");
    } finally {
      setSummaryLoading(false);
    }
  };

  // Auto-run on profile load
  useEffect(() => {
    if (profile) fetchSummary(false);
  }, [profile?._id]);

  // === Verify Education Handler ===
  const onVerifyEdu = async (eduId) => {
    setBusyEdu(eduId);
    try {
      const { success, data, error } = await verifyEducationRow(userId, eduId);
      if (!success) {
        enqueueSnackbar(error, { variant: "error" });
        return;
      }

      const updatedRow = data?.education?.find(
        (r) => String(r._id) === String(eduId)
      );

      setProfile((p) => ({
        ...p,
        education: p.education.map((row) =>
          String(row._id) === String(eduId)
            ? {
                ...row,
                verifyCount: updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
                verifiedBy: updatedRow?.verifiedBy ?? [
                  ...(row.verifiedBy || []),
                  authUser?._id,
                ],
              }
            : row
        ),
      }));

      enqueueSnackbar("Education verified successfully!", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(e?.message || "An unexpected error occurred during verification.", { variant: "error" });
    } finally {
      setBusyEdu("");
    }
  };

  // === Verify Experience Handler ===
  const onVerifyExp = async (expId) => {
    setBusyExp(expId);
    try {
      const { success, data, error } = await verifyExperienceRow(userId, expId);
      if (!success) {
        enqueueSnackbar(error, { variant: "error" });
        return;
      }

      const updatedRow = data?.experience?.find(
        (r) => String(r._id) === String(expId)
      );

      setProfile((p) => ({
        ...p,
        experience: p.experience.map((row) =>
          String(row._id) === String(expId)
            ? {
                ...row,
                verifyCount: updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
                verifiedBy: updatedRow?.verifiedBy ?? [
                  ...(row.verifiedBy || []),
                  authUser?._id,
                ],
              }
            : row
        ),
      }));

      enqueueSnackbar("Experience verified successfully!", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(e?.message || "An unexpected error occurred during verification.", { variant: "error" });
    } finally {
      setBusyExp("");
    }
  };

  if (loading)
    return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
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

  return (
    <>
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
        <Card className="mb-6">
          <CardContent className="p-5 md:p-6 flex items-center gap-4 md:gap-6">
            <Avatar className="h-16 w-16 rounded-lg">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={fullName} />
              ) : null}
              <AvatarFallback className="rounded-lg">
                {initials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-semibold">
                  {fullName}
                </h1>
                {profile?.gender ? (
                  <Badge variant="secondary">{profile.gender}</Badge>
                ) : null}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {profile?.email || "—"}{" "}
                {profile?.mobile ? `• ${profile.mobile}` : ""}
              </div>
              <div className="text-sm text-muted-foreground">
                {location || "—"}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* === SUMMARY BOX (top) === */}
        <Card className="mb-6 border-blue-200">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-base md:text-lg font-semibold">AI Profile Summary</h2>
              </div>
              <div className="flex items-center gap-2">
                {summaryLoading ? (
                  <Button size="sm" className="rounded-xl" disabled aria-busy>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading…
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    disabled={!summary}
                    onClick={async () => {
                      if (!summary) return;
                      try {
                        await navigator.clipboard.writeText(summary);
                        enqueueSnackbar("Summary copied!", { variant: "success" });
                      } catch {
                        enqueueSnackbar("Failed to copy summary.", { variant: "error" });
                      }
                    }}
                  >
                    <Copy className="h-4 w-4 mr-2" /> Copy
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-3">
              {summaryLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-3 bg-muted rounded w-11/12" />
                  <div className="h-3 bg-muted rounded w-10/12" />
                  <div className="h-3 bg-muted rounded w-8/12" />
                </div>
              ) : (
                <p className="text-sm leading-6 text-muted-foreground">
                  {summary || "No summary yet."}
                </p>
              )}
              {summaryErr ? (
                <p className="mt-2 text-xs text-orange-600">{summaryErr}</p>
              ) : null}
              <p className="mt-2 text-[11px] text-muted-foreground">Powered by OpenAI</p>
            </div>
          </CardContent>
        </Card>

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
                          onVerify={onVerifyEdu}
                        />
                      </div>
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
                          onVerify={onVerifyExp}
                        />
                      </div>
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

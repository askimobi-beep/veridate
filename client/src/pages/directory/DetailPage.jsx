// src/pages/DetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";
import { ArrowLeft, FileText, Briefcase, CheckCircle2 } from "lucide-react";
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

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");

const isHex24 = (s) => typeof s === "string" && /^[a-f0-9]{24}$/i.test(s);

const normalize = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
const normalizeInstitute = normalize;
const normalizeCompany = normalize;

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
      return "bg-amber-500 hover:bg-amber-500 text-black disabled:opacity-100 cursor-not-allowed";
    case "ineligible":
    default:
      return "bg-red-600 hover:bg-red-600 text-white disabled:opacity-100 cursor-not-allowed";
  }
};

export default function DetailPage() {
  const { userId } = useParams();
  const { enqueueSnackbar } = useSnackbar();
  const { user: authUser, checkAuth } = useAuth();

  const [profile, setProfile] = useState(null);
  const [meProfile, setMeProfile] = useState(null);
  const [openValue, setOpenValue] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyEdu, setBusyEdu] = useState("");
  const [busyExp, setBusyExp] = useState("");

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

  const eduCreditMap = useMemo(() => {
    const buckets = authUser?.verifyCredits?.education || [];
    return creditsToMap(buckets, "instituteKey");
  }, [authUser]);

  const expCreditMap = useMemo(() => {
    const buckets = authUser?.verifyCredits?.experience || [];
    return creditsToMap(buckets, "companyKey");
  }, [authUser]);

  // === Verify Education ===
  const onVerifyEdu = async (eduId) => {
    try {
      if (!isHex24(userId) || !isHex24(eduId)) {
        enqueueSnackbar("Bad ids: target user or education id is invalid.", {
          variant: "error",
        });
        return;
      }
      setBusyEdu(eduId);

      const url = `/verify/profiles/${encodeURIComponent(
        userId
      )}/verify/education/${encodeURIComponent(eduId)}`;
      const { data } = await axiosInstance.post(url);

      const updatedRow = data?.education?.find(
        (r) => String(r._id) === String(eduId)
      );

      const nextEducation = profile.education.map((row) =>
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
      );

      setProfile((p) => ({ ...p, education: nextEducation }));
      await checkAuth();
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to verify education",
        { variant: "error" }
      );
    } finally {
      setBusyEdu("");
    }
  };

  // === Verify Experience ===
  const onVerifyExp = async (expId) => {
    try {
      if (!isHex24(userId) || !isHex24(expId)) {
        enqueueSnackbar("Bad ids: target user or experience id is invalid.", {
          variant: "error",
        });
        return;
      }
      setBusyExp(expId);

      const url = `/verify/profiles/${encodeURIComponent(
        userId
      )}/verify/experience/${encodeURIComponent(expId)}`;
      const { data } = await axiosInstance.post(url);

      const updatedRow = data?.experience?.find(
        (r) => String(r._id) === String(expId)
      );

      const nextExperience = profile.experience.map((row) =>
        String(row._id) === String(expId)
          ? {
              ...row,
              verifyCount:
                updatedRow?.verifyCount ?? (row.verifyCount || 0) + 1,
              verifiedBy: updatedRow?.verifiedBy ?? [
                ...(row.verifiedBy || []),
                authUser?._id,
              ],
            }
          : row
      );

      setProfile((p) => ({ ...p, experience: nextExperience }));
      await checkAuth();
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message ||
          e?.response?.data?.error ||
          "Failed to verify experience",
        { variant: "error" }
      );
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
              {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName} /> : null}
              <AvatarFallback className="rounded-lg">
                {initials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl md:text-2xl font-semibold">{fullName}</h1>
                {profile?.gender ? (
                  <Badge variant="secondary">{profile.gender}</Badge>
                ) : null}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                {profile?.email || "—"} {profile?.mobile ? `• ${profile.mobile}` : ""}
              </div>
              <div className="text-sm text-muted-foreground">{location || "—"}</div>
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
                  const status = eduStatus({ row: edu, meId, meProfile, eduCreditMap });
                  const label =
                    status === "already-verified"
                      ? "Already veridate"
                      : status === "eligible"
                      ? busyEdu === String(edu._id)
                        ? "Verifying…"
                        : "Veridate now"
                      : status === "no-credits"
                      ? "No credits"
                      : "Mismatch education";

                  return (
                    <SubSection key={String(edu._id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={badgeClass(cnt)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {cnt} verified
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className={btnStyleByStatus(status)}
                          onClick={() =>
                            status === "eligible" && onVerifyEdu(String(edu._id))
                          }
                          disabled={
                            status !== "eligible" || busyEdu === String(edu._id)
                          }
                        >
                          {label}
                        </Button>
                      </div>
                      <DefinitionList>
                        <DLRow label="Degree Title">{edu.degreeTitle}</DLRow>
                        <DLRow label="Institute">{edu.institute}</DLRow>
                        <DLRow label="Institute Website">
                          <LinkText href={edu.instituteWebsite}>
                            {edu.instituteWebsite}
                          </LinkText>
                        </DLRow>
                        <DLRow label="Start">{fmtDate(edu.startDate)}</DLRow>
                        <DLRow label="End">{fmtDate(edu.endDate)}</DLRow>
                        <DLRow label="Degree File">
                          <LinkText
                            href={
                              edu.degreeFile
                                ? fileUrl("education", edu.degreeFile)
                                : undefined
                            }
                          >
                            {edu.degreeFile || "—"}
                          </LinkText>
                        </DLRow>
                      </DefinitionList>
                    </SubSection>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No education added.</div>
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
                  const status = expStatus({ row: exp, meId, meProfile, expCreditMap });
                  const label =
                    status === "already-verified"
                      ? "Already veridate"
                      : status === "eligible"
                      ? busyExp === String(exp._id)
                        ? "Verifying…"
                        : "Veridate now"
                      : status === "no-credits"
                      ? "No credits"
                      : "Mismatch experience";

                  return (
                    <SubSection key={String(exp._id)}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge className={badgeClass(cnt)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                            {cnt} verified
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className={btnStyleByStatus(status)}
                          onClick={() =>
                            status === "eligible" && onVerifyExp(String(exp._id))
                          }
                          disabled={
                            status !== "eligible" || busyExp === String(exp._id)
                          }
                        >
                          {label}
                        </Button>
                      </div>
                      <DefinitionList>
                        <DLRow label="Job Title">{exp.jobTitle}</DLRow>
                        <DLRow label="Company">{exp.company}</DLRow>
                        <DLRow label="Company Website">
                          <LinkText href={exp.companyWebsite}>
                            {exp.companyWebsite}
                          </LinkText>
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
                    </SubSection>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No experience added.</div>
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

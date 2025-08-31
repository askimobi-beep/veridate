// src/pages/DetailPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "@/utils/axiosInstance";

import AccordionSection from "@/components/common/AccordionSection";
import { User, FileText, Briefcase, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  SectionWrapper,
  DefinitionList,
  DLRow,
  SubSection,
  Line,
  LinkText,
} from "@/components/directory/DetailBlocks";

import { useSnackbar } from "notistack";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "");
const joinArr = (a) => (Array.isArray(a) && a.length ? a.join(", ") : "");

export default function DetailPage() {
  const { userId } = useParams();
  const { enqueueSnackbar } = useSnackbar();

  const [profile, setProfile] = useState(null);
  const [openValue, setOpenValue] = useState("personal");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [busyEdu, setBusyEdu] = useState("");
  const [busyExp, setBusyExp] = useState("");

  const baseURL = useMemo(
    () => axiosInstance.defaults.baseURL?.replace(/\/$/, ""),
    []
  );
  const fileUrl = (type, name) =>
    name && baseURL ? `${baseURL}/uploads/${type}/${name}` : undefined;

  useEffect(() => {
    if (!userId) return;
    let off = false;

    (async () => {
      try {
        setLoading(true);
        const { data } = await axiosInstance.get(`/profile/getonid/${userId}`);
        if (!off) setProfile(data);
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

  const onVerifyEdu = async (eduId) => {
    try {
      setBusyEdu(eduId);

      const { data } = await axiosInstance.post(
        `/verify/profiles/${userId}/verify/education/${eduId}`
      );

      const nextEducation = profile.education.map((row) => {
        const found = data?.education?.find(
          (r) => String(r._id) === String(row._id)
        );
        return found ? { ...row, verifyCount: found.verifyCount } : row;
      });
      setProfile((p) => ({ ...p, education: nextEducation }));

      enqueueSnackbar("Education verified. Thanks for contributing!", {
        variant: "success",
      });
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

  const onVerifyExp = async (expId) => {
    try {
      setBusyExp(expId);

      const { data } = await axiosInstance.post(
        `/verify/profiles/${userId}/verify/experience/${expId}`
      );

      const nextExperience = profile.experience.map((row) => {
        const found = data?.experience?.find(
          (r) => String(r._id) === String(row._id)
        );
        return found ? { ...row, verifyCount: found.verifyCount } : row;
      });
      setProfile((p) => ({ ...p, experience: nextExperience }));

      enqueueSnackbar("Experience verified. Appreciate it!", {
        variant: "success",
      });
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

  const fullName = profile?.name || "Unnamed";
  const location = [profile?.city, profile?.country].filter(Boolean).join(", ");
  const avatarUrl =
    profile?.profilePicUrl ||
    (profile?.profilePic ? fileUrl("profile", profile.profilePic) : undefined);

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-6">
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
              {profile?.email || "—"}{" "}
              {profile?.mobile ? `• ${profile.mobile}` : ""}
            </div>
            <div className="text-sm text-muted-foreground">
              {location || "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PERSONAL */}
      <AccordionSection
        title="Personal Details"
        icon={User}
        value="personal"
        openValue={openValue}
        setOpenValue={setOpenValue}
        locked={!!profile?.personalInfoLocked}
        contentClassName="text-left" 
      >
        <SectionWrapper>
          <DefinitionList className="!text-left !grid-cols-1 space-y-2">
            <DLRow label="User ID">{profile?.user}</DLRow>
            <DLRow label="Father Name">{profile?.fatherName}</DLRow>
            <DLRow label="CNIC">{profile?.cnic}</DLRow>
            <DLRow label="Marital Status">{profile?.maritalStatus}</DLRow>
            <DLRow label="Resident Status">{profile?.residentStatus}</DLRow>
            <DLRow label="Nationality">{profile?.nationality}</DLRow>
            <DLRow label="Date of Birth">{fmtDate(profile?.dob)}</DLRow>
            <DLRow label="Shift Preferences">
              {joinArr(profile?.shiftPreferences)}
            </DLRow>
            <DLRow label="Work Authorization">
              {joinArr(profile?.workAuthorization)}
            </DLRow>
            <DLRow label="Resume">
              <LinkText
                href={
                  profile?.resume
                    ? fileUrl("resume", profile.resume)
                    : undefined
                }
              >
                {profile?.resume || "—"}
              </LinkText>
            </DLRow>
          </DefinitionList>

          <Line />

          <div className="text-xs text-muted-foreground text-center">
            Created: {fmtDate(profile?.createdAt) || "—"} • Updated:{" "}
            {fmtDate(profile?.updatedAt) || "—"}
          </div>
        </SectionWrapper>
      </AccordionSection>

      {/* EDUCATION */}
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
                return (
                  <SubSection key={String(edu._id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={badgeClass(cnt, "education")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {cnt} verified
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onVerifyEdu(String(edu._id))}
                        disabled={busyEdu === String(edu._id)}
                      >
                        {busyEdu === String(edu._id)
                          ? "Verifying…"
                          : "Verify education"}
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
                              ? fileUrl("degrees", edu.degreeFile)
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
            <div className="text-sm text-muted-foreground">
              No education added.
            </div>
          )}
        </SectionWrapper>
      </AccordionSection>

      {/* EXPERIENCE */}
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
                return (
                  <SubSection key={String(exp._id)}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge className={badgeClass(cnt, "experience")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          {cnt} verified
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => onVerifyExp(String(exp._id))}
                        disabled={busyExp === String(exp._id)}
                      >
                        {busyExp === String(exp._id)
                          ? "Verifying…"
                          : "Verify experience"}
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
                      <DLRow label="Job Functions">
                        {joinArr(exp.jobFunctions)}
                      </DLRow>
                      <DLRow label="Industry">{exp.industry}</DLRow>
                    </DefinitionList>
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
  );
}

function initials(name) {
  if (!name) return "NA";
  const p = String(name).trim().split(/\s+/);
  return (p[0]?.[0] || "").toUpperCase() + (p[1]?.[0] || "").toUpperCase();
}

/** Badge color logic — tune thresholds if you want  */
function badgeClass(count) {
  // neutral → silver at 3+ → gold at 5+ → blue at 10+
  if (count >= 10) return "bg-blue-500 text-white hover:bg-blue-500";
  if (count >= 5) return "bg-yellow-500 text-black hover:bg-yellow-500";
  if (count >= 3) return "bg-zinc-300 text-zinc-900 hover:bg-zinc-300";
  return "bg-zinc-900 text-white hover:bg-zinc-900";
}

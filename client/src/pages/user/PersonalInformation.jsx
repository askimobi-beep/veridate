// pages/.../PersonalInformation.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSnackbar } from "notistack";
import { useSearchParams } from "react-router-dom";
import {
  BriefcaseBusiness as Briefcase,
  FileText,
  UserRound,
  ClipboardList,
  Mic,
  Video,
  Building2,
  PlusCircle,
  Plus,
} from "lucide-react";

import ProfileHeader from "@/components/profile/ProfileHeader";
import PersonalDetailsForm from "@/components/profile/PersonalDetailsForm";
import EducationForm from "@/components/profile/EducationForm";
import ExperienceForm from "@/components/profile/ExperienceForm";
import ProjectForm from "@/components/profile/ProjectForm";
import MediaProfileSection from "@/components/profile/MediaProfileSection";
import CompanyProfilesSection from "@/components/profile/CompanyProfilesSection";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import usePersonalInformationForm from "@/hooks/usePersonalInformationForm";
import { toYMD, toYM } from "@/lib/dates";
import { getProfileMe } from "@/lib/profileApi";
import { useAuth } from "@/context/AuthContext";
import ProfilePdfDownload from "@/components/profile/ProfilePdf";
import { fetchOrganizations } from "@/services/organizationService";
import { fetchApprovedCompanies, fetchMyCompanies } from "@/services/companyService";

export default function PersonalInformation() {
  const {
    formData,
    setFormData,
    handleChange,
    handleCustomChange,
    // education
    addEducation,
    updateEducation,
    removeEducation,
    saveEducation,
    saveEducationRow,
    isRowSaving,
    // experience
    addExperience,
    updateExperience,
    removeExperience,
    saveExperience,
    saveExperienceRow,
    isExpRowSaving,
    // projects
    addProject,
    updateProject,
    removeProject,
    saveProjects,
    saveProjectRow,
    isProjectRowSaving,
    // personal
    savePersonalInfo,
    saveProfilePhoto,
    saving,
    submit,
    resetForm,
    clearPersonalFiles,
    clearEducationFiles,
    clearExperienceFiles,
  } = usePersonalInformationForm();

  const { enqueueSnackbar } = useSnackbar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useState("pi");
  const [locked, setLocked] = useState({});
  const [companyCreateOpen, setCompanyCreateOpen] = useState(false);
  const [companyPages, setCompanyPages] = useState([]);
  const [companyPagesLoading, setCompanyPagesLoading] = useState(false);
  const [expandedCompanyId, setExpandedCompanyId] = useState("");
  const [orgOptions, setOrgOptions] = useState({
    companies: [],
    universities: [],
  });
  const selectedCompanyId = String(searchParams.get("companyId") || "").trim();
  const selectedCompanyTab = String(searchParams.get("companyTab") || "overview").trim();
  const hasPendingCompanyRequest = companyPages.some(
    (company) => String(company?.status || "").toLowerCase() === "pending"
  );

  const { user, loading: authLoading } = useAuth();
  const userId = String(user?._id || "").trim();

  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const eduBuckets = Array.isArray(user?.verifyCredits?.education)
    ? user.verifyCredits.education
    : [];
  const expBuckets = Array.isArray(user?.verifyCredits?.experience)
    ? user.verifyCredits.experience
    : [];
  const projectBuckets = Array.isArray(user?.verifyCredits?.projects)
    ? user.verifyCredits.projects
    : [];
  const eduTotalAvailable = eduBuckets.reduce(
    (a, b) => a + (b?.available || 0),
    0
  );
  const expTotalAvailable = expBuckets.reduce(
    (a, b) => a + (b?.available || 0),
    0
  );
  const projectTotalAvailable = projectBuckets.reduce(
    (a, b) => a + (b?.available || 0),
    0
  );

  const eduCreditByKey = useMemo(() => {
    const m = new Map();
    for (const b of eduBuckets) {
      if (!b) continue;
      const key = b.instituteKey || norm(b.institute);
      if (key) m.set(key, b);
    }
    return m;
  }, [user?.verifyCredits?.education]);

  const expCreditByKey = useMemo(() => {
    const m = new Map();
    for (const b of expBuckets) {
      if (!b) continue;
      const key = b.companyKey || norm(b.company);
      if (key) m.set(key, b);
    }
    return m;
  }, [user?.verifyCredits?.experience]);

  const projectCreditByKey = useMemo(() => {
    const m = new Map();
    for (const b of projectBuckets) {
      if (!b) continue;
      const key = b.projectId ? String(b.projectId) : "";
      if (key) m.set(key, b);
    }
    return m;
  }, [user?.verifyCredits?.projects]);

  const projectCompanyOptions = useMemo(() => {
    const list = Array.isArray(formData?.experience) ? formData.experience : [];
    const unique = new Set(
      list
        .map((exp) => String(exp?.company || "").trim())
        .filter((val) => val.length > 0)
    );
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [formData?.experience]);

  // uploader refs
  const resumeRef = useRef(null);
  const profilePicRef = useRef(null);
  const degreeRefs = useRef([]);
  const letterRefs = useRef([]);

  // confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingTitle, setPendingTitle] = useState("");
  const [pendingValue, setPendingValue] = useState(null);

  const onAskConfirm = (sectionValue, sectionTitle, actionFn) => {
    setPendingValue(sectionValue);
    setPendingTitle(sectionTitle);
    setPendingAction(() => actionFn);
    setConfirmOpen(true);
  };

  const normalizeFromServer = (data) => {
    if (!data) return;
    setFormData((prev) => ({
      ...prev,
      ...data,
      name: `${user?.firstName ?? data.firstName ?? ""} ${
        user?.lastName ?? data.lastName ?? ""
      }`.trim(),
      email: user?.email ?? data.email ?? "",
      personalHiddenFields: Array.isArray(data.personalHiddenFields)
        ? data.personalHiddenFields
        : prev.personalHiddenFields,
      audioProfile: data.audioProfile || null,
      videoProfile: data.videoProfile || null,
      dob: toYM(data.dob),
      education: Array.isArray(data.education)
        ? data.education.map((e, i) => ({
            ...e,
            startDate: toYMD(e.startDate),
            endDate: toYMD(e.endDate),
            // ✅ keep any existing local rowLocked unless server explicitly sets it
            rowLocked:
              (typeof e.rowLocked === "boolean" ? e.rowLocked : undefined) ??
              prev.education?.[i]?.rowLocked ??
              false,
          }))
        : prev.education,
      experience: Array.isArray(data.experience)
        ? data.experience.map((x, i) => ({
            ...x,
            startDate: toYMD(x.startDate),
            endDate: toYMD(x.endDate),
            // (optional) if you also do row locking for experience later
            rowLocked:
              (typeof x.rowLocked === "boolean" ? x.rowLocked : undefined) ??
              prev.experience?.[i]?.rowLocked ??
              false,
          }))
        : prev.experience,
      projects: Array.isArray(data.projects)
        ? data.projects.map((p, i) => ({
            ...p,
            startDate: toYMD(p.startDate),
            endDate: toYMD(p.endDate),
            projectUrl: p.projectUrl || "",
            projectMember: Array.isArray(p.projectMember)
              ? p.projectMember
              : typeof p.projectMember === "string"
              ? p.projectMember
                  .split(",")
                  .map((member) => member.trim())
                  .filter((member) => member.length > 0)
              : [],
            rowLocked:
              (typeof p.rowLocked === "boolean" ? p.rowLocked : undefined) ??
              prev.projects?.[i]?.rowLocked ??
              false,
          }))
            : prev.projects,
    }));
  };

  const handleConfirm = async () => {
    setConfirmOpen(false);
    if (!pendingAction) return;

    try {
      const res = await pendingAction();
      if (res?.ok) {
        const serverProfile = res?.data?.profile;
        enqueueSnackbar(`${pendingTitle} saved`, { variant: "success" });

        // lock only full sections; don't lock the entire education section for a single row save
        if (
          pendingValue === "pi" ||
          pendingValue === "experience" ||
          pendingValue === "education" ||
          pendingValue === "projects"
        ) {
          setLocked((prev) => ({ ...prev, [pendingValue]: true }));
        }

        if (serverProfile) normalizeFromServer(serverProfile);

        if (pendingValue === "pi") {
          resumeRef.current?.reset?.();
          profilePicRef.current?.reset?.();
          clearPersonalFiles();
        }

        // full education section save (legacy behavior)
        if (pendingValue === "education") {
          degreeRefs.current.forEach((r) => r?.reset?.());
          clearEducationFiles();
          // (optional) lock all rows after full save
          setFormData((prev) => ({
            ...prev,
            education: prev.education.map((e) => ({ ...e, rowLocked: true })),
          }));
        }

        // row-wise education save: pendingValue = "education:<index>"
        if (
          typeof pendingValue === "string" &&
          pendingValue.startsWith("education:")
        ) {
          const idx = Number(pendingValue.split(":")[1]);
          if (!Number.isNaN(idx)) {
            degreeRefs.current?.[idx]?.reset?.(); // only reset this uploader
          }
          // keep the accordion open on row save
          setOpen("education");
        }

        if (
          typeof pendingValue === "string" &&
          pendingValue.startsWith("experience:")
        ) {
          const idx = Number(pendingValue.split(":")[1]);
          if (!Number.isNaN(idx)) {
            letterRefs.current?.[idx]?.reset?.(); // reset only this row's uploader
          }
          setOpen("experience"); // keep accordion open on row save
        }

        if (pendingValue === "experience") {
          letterRefs.current.forEach((r) => r?.reset?.());
          clearExperienceFiles();
        }

        if (
          typeof pendingValue === "string" &&
          pendingValue.startsWith("projects:")
        ) {
          setOpen("projects");
        }

        if (pendingValue === "projects") {
          setOpen("projects");
        }
      } else {
        enqueueSnackbar(res?.error || `Failed to save ${pendingTitle}`, {
          variant: "error",
        });
      }
    } catch {
      enqueueSnackbar(`Failed to save ${pendingTitle}`, { variant: "error" });
    } finally {
      setPendingAction(null);
      setPendingTitle("");
      setPendingValue(null);
    }
  };

  // const handleCancel = () => {
  //   setConfirmOpen(false);
  //   setPendingAction(null);
  //   setPendingTitle("");
  //   setPendingValue(null);
  // };

  // reflect auth user into the form fast
  useEffect(() => {
    if (!authLoading && user) {
      setFormData((prev) => ({
        ...prev,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || prev.email || "",
      }));
    }
  }, [authLoading, user, setFormData]);

  useEffect(() => {
    let mounted = true;
    const uniqueSorted = (arr) =>
      Array.from(
        new Set(
          arr
            .map((val) => String(val || "").trim())
            .filter((val) => val.length > 0)
        )
      ).sort((a, b) => a.localeCompare(b));

    const loadOrganizations = async () => {
      try {
        const rows = await fetchOrganizations();
        const approvedCompanies = await fetchApprovedCompanies();
        if (!mounted) return;
        const companies = approvedCompanies.map((r) => r.name);
        const universities = rows
          .filter((r) => r.role === "university")
          .map((r) => r.name);
        setOrgOptions({
          companies: uniqueSorted(companies),
          universities: uniqueSorted(universities),
        });
      } catch (err) {
        if (mounted) {
          console.error("Failed to load organizations", err);
        }
      }
    };

    if (!authLoading) loadOrganizations();
    return () => {
      mounted = false;
    };
  }, [authLoading]);

  useEffect(() => {
    let mounted = true;
    const loadMyCompanies = async () => {
      if (authLoading) return;
      setCompanyPagesLoading(true);
      try {
        const rows = await fetchMyCompanies();
        if (mounted) setCompanyPages(rows || []);
      } catch {
        if (mounted) setCompanyPages([]);
      } finally {
        if (mounted) setCompanyPagesLoading(false);
      }
    };
    loadMyCompanies();
    return () => {
      mounted = false;
    };
  }, [authLoading]);

  // fetch full profile — ✅ also preserves rowLocked from local state
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfileMe();

        setFormData((prev) => ({
          ...prev,
          ...data,
          name: `${user?.firstName ?? data.firstName ?? ""} ${
            user?.lastName ?? data.lastName ?? ""
          }`.trim(),
          email: user?.email ?? data.email ?? prev.email ?? "",
          audioProfile: data.audioProfile || null,
          videoProfile: data.videoProfile || null,
          dob: toYM(data.dob),
          education: Array.isArray(data.education)
            ? data.education.map((e, i) => ({
                ...e,
                startDate: toYMD(e.startDate),
                endDate: toYMD(e.endDate),
                rowLocked:
                  (typeof e.rowLocked === "boolean"
                    ? e.rowLocked
                    : undefined) ??
                  prev.education?.[i]?.rowLocked ??
                  false,
              }))
            : prev.education,
          experience: Array.isArray(data.experience)
            ? data.experience.map((x, i) => ({
                ...x,
                startDate: toYMD(x.startDate),
                endDate: toYMD(x.endDate),
                rowLocked:
                  (typeof x.rowLocked === "boolean"
                    ? x.rowLocked
                    : undefined) ??
                  prev.experience?.[i]?.rowLocked ??
                  false,
              }))
            : prev.experience || [
                {
                  jobTitle: "",
                  startDate: "",
                  endDate: "",
                  company: "",
                  companyWebsite: "",
                  experienceLetterFile: null,
                  jobFunctions: [],
                  industry: "",
                  hiddenFields: [],
                },
              ],
          projects: Array.isArray(data.projects)
            ? data.projects.map((p, i) => ({
                ...p,
                startDate: toYMD(p.startDate),
                endDate: toYMD(p.endDate),
                projectUrl: p.projectUrl || "",
                projectMember: Array.isArray(p.projectMember)
                  ? p.projectMember
                  : typeof p.projectMember === "string"
                  ? p.projectMember
                      .split(",")
                      .map((member) => member.trim())
                      .filter((member) => member.length > 0)
                  : [],
                rowLocked:
                  (typeof p.rowLocked === "boolean" ? p.rowLocked : undefined) ??
                  prev.projects?.[i]?.rowLocked ??
                  false,
              }))
            : prev.projects || [
                {
                  projectTitle: "",
                  company: "",
                  projectUrl: "",
                  startDate: "",
                  endDate: "",
                  department: "",
                  projectMember: [],
                  role: "",
                  description: "",
                },
              ],
        }));

        setLocked({
          pi: data.personalInfoLocked,
          education: data.educationLocked,
          experience: data.experienceLocked,
          projects: data.projectLocked,
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    if (!authLoading) load();
  }, [authLoading, user, setFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await submit();

    if (res.ok) {
      enqueueSnackbar("Profile saved successfully", { variant: "success" });
      resumeRef.current?.reset?.();
      profilePicRef.current?.reset?.();
      degreeRefs.current.forEach((r) => r?.reset?.());
      letterRefs.current.forEach((r) => r?.reset?.());
      resetForm();
      setLocked({});
    } else {
      enqueueSnackbar(res.error, { variant: "error" });
    }
  };

  // Share button logic ...
  const baseUrl =
    import.meta.env.VITE_PROFILE_BASE_URL ||
    (typeof window !== "undefined" && window.location?.origin) ||
    "http://localhost:5173";

  const shareUrl = useMemo(() => {
    const id = user?._id || formData?.id || "UNKNOWN_ID";
    return `${baseUrl}/dashboard/profiles/${id}`;
  }, [baseUrl, user?._id, formData?.id]);

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Profile",
          text: "Check out my profile",
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      window.prompt("Copy this URL:", shareUrl);
    }
  };

  const hasPersonal = Boolean(
    String(formData?.name || "").trim() && String(formData?.email || "").trim()
  );
  const firstEdu = Array.isArray(formData?.education)
    ? formData.education[0]
    : null;
  const hasEducation = Boolean(
    firstEdu && (firstEdu?.degreeTitle || firstEdu?.institute)
  );
  const firstExp = Array.isArray(formData?.experience)
    ? formData.experience[0]
    : null;
  const hasExperience = Boolean(
    firstExp && (firstExp?.jobTitle || firstExp?.company)
  );
  const firstProject = Array.isArray(formData?.projects)
    ? formData.projects[0]
    : null;
  const hasProjects = Boolean(
    firstProject && (firstProject?.projectTitle || firstProject?.company)
  );
  const hasAudio =
    formData?.audioProfile instanceof File ||
    (typeof formData?.audioProfile === "string" && formData?.audioProfile);
  const hasVideo =
    formData?.videoProfile instanceof File ||
    (typeof formData?.videoProfile === "string" && formData?.videoProfile);

  const sectionOrder = [
    "pi",
    "education",
    "experience",
    "projects",
    "audio",
    "video",
    "company",
  ];
  const sectionItems = [
    {
      key: "pi",
      label: "Personal Details",
      icon: UserRound,
      done: hasPersonal,
      hint: hasPersonal ? "Completed" : "Needs info",
    },
    {
      key: "education",
      label: "Education",
      icon: FileText,
      done: hasEducation,
      hint: hasEducation ? "Completed" : "Add degree",
    },
    {
      key: "experience",
      label: "Experience",
      icon: Briefcase,
      done: hasExperience,
      hint: hasExperience ? "Completed" : "Add role",
    },
    {
      key: "projects",
      label: "Projects",
      icon: ClipboardList,
      done: hasProjects,
      hint: hasProjects ? "Completed" : "Add project",
    },
    {
      key: "audio",
      label: "Audio Profile",
      icon: Mic,
      done: hasAudio,
      hint: hasAudio ? "Completed" : "Add audio",
    },
    {
      key: "video",
      label: "Video Profile",
      icon: Video,
      done: hasVideo,
      hint: hasVideo ? "Completed" : "Add video",
    },
    {
      key: "company",
      label: "Company Page",
      icon: Building2,
      done: false,
      hint: "Create company",
    },
  ];

  const primarySectionItems = sectionItems.filter((item) => item.key !== "company");
  const companySectionItem = sectionItems.find((item) => item.key === "company");

  const scrollToSection = (key) => {
    setOpen(key);
    if (key !== "company") {
      setCompanyCreateOpen(false);
      const next = new URLSearchParams(searchParams);
      next.delete("section");
      next.delete("companyId");
      next.delete("companyTab");
      setSearchParams(next, { replace: true });
    }
  };

  const openCompanySection = (companyId, tab = "overview") => {
    setOpen("company");
    setCompanyCreateOpen(false);
    setExpandedCompanyId(String(companyId));
    const next = new URLSearchParams(searchParams);
    next.set("section", "company");
    next.set("companyId", String(companyId));
    next.set("companyTab", String(tab || "overview"));
    setSearchParams(next, { replace: true });
  };

  const openCompanyPage = (companyId) => openCompanySection(companyId, "overview");

  const getCompanyRole = (company) => {
    if (!company) return "";
    if (String(company?.createdBy || "") === userId) return "owner";
    const members = Array.isArray(company?.members) ? company.members : [];
    const me = members.find((member) => String(member?.user || "") === userId);
    return String(me?.role || "").toLowerCase();
  };

  const canPostJob = (company) => {
    const role = getCompanyRole(company);
    const status = String(company?.status || "").toLowerCase();
    return status === "approved" && ["owner", "admin", "manager"].includes(role);
  };

  const canManageTeam = (company) => {
    const role = getCompanyRole(company);
    return ["owner", "admin"].includes(role);
  };

  useEffect(() => {
    const section = String(searchParams.get("section") || "").trim();
    const allowed = ["pi", "education", "experience", "projects", "audio", "video", "company"];
    if (section && allowed.includes(section)) {
      setOpen((prev) => (prev === section ? prev : section));
    }
  }, [searchParams]);

  useEffect(() => {
    if (open !== "company" || companyCreateOpen || selectedCompanyId || !companyPages.length) {
      return;
    }
    openCompanyPage(companyPages[0]._id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, companyCreateOpen, selectedCompanyId, companyPages]);

  useEffect(() => {
    if (companyCreateOpen) return;
    if (open !== "company") return;
    if (!selectedCompanyId) return;
    setExpandedCompanyId(String(selectedCompanyId));
  }, [open, selectedCompanyId, companyCreateOpen]);

  const activeIndex = sectionOrder.indexOf(open);
  const safeIndex = activeIndex === -1 ? 0 : activeIndex;
  const goPrev = () => {
    if (safeIndex <= 0) return;
    scrollToSection(sectionOrder[safeIndex - 1]);
  };
  const goNext = () => {
    if (open === "pi") {
      scrollToSection("company");
      return;
    }
    if (safeIndex >= sectionOrder.length - 1) return;
    scrollToSection(sectionOrder[safeIndex + 1]);
  };

  return (
    <div className="min-h-screen w-full flex items-start justify-center px-4 py-10 relative">
      <div className="relative z-10 w-full max-w-5xl">
        <ProfileHeader
          user={formData}
          profilePicRef={profilePicRef}
          uploading={saving && open === "pi"}
          onPhotoChange={(file) => {
            if (file) handleCustomChange("profilePic", file);
            else handleCustomChange("profilePic", "");
          }}
          onPhotoSave={async () => {
            const res = await saveProfilePhoto();
            if (res?.ok) {
              const serverProfile = res?.data?.profile;
              if (serverProfile) {
                setFormData((prev) => ({
                  ...prev,
                  profilePic:
                    typeof serverProfile.profilePic !== "undefined"
                      ? serverProfile.profilePic
                      : prev.profilePic,
                  profilePicPending:
                    typeof serverProfile.profilePicPending !== "undefined"
                      ? serverProfile.profilePicPending
                      : prev.profilePicPending,
                }));
              }
              enqueueSnackbar(res?.data?.message || "Profile photo updated", {
                variant: "success",
              });
              profilePicRef.current?.reset?.();
            } else {
              enqueueSnackbar(res?.error || "Failed to save photo", {
                variant: "error",
              });
            }
          }}
          onShare={handleShare}
          copied={copied}
          shareUrl={shareUrl}
          extraActions={<ProfilePdfDownload userId={user?._id} inline />}
        />

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-24 overflow-visible px-4 pb-12 pt-1">
              <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
                <div className="sr-only">Profile Sections</div>
                <div className="space-y-2">
                  {primarySectionItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = open === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => scrollToSection(item.key)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold transition ${
                          isActive
                            ? "brand-orange-soft text-[color:var(--brand-orange)] shadow-[0_6px_16px_-10px_rgba(251,119,59,0.7)]"
                            : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {companySectionItem ? (
                <div className="mt-5 mb-3 space-y-3">
                  {companyPagesLoading ? (
                    <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-xs text-slate-500 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
                      Loading companies...
                    </div>
                  ) : companyPages.length ? (
                    companyPages.map((company) => (
                      <div
                        key={company._id}
                        className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedCompanyId((prev) =>
                              prev === String(company._id) ? "" : String(company._id)
                            )
                          }
                          className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                            open === "company" &&
                            String(selectedCompanyId) === String(company._id) &&
                            !companyCreateOpen
                              ? "brand-orange-soft text-[color:var(--brand-orange)]"
                              : "text-slate-600 hover:bg-white/70 hover:text-slate-800"
                          }`}
                        >
                          <span className="truncate">{company.name}</span>
                          <Plus className="h-4 w-4 shrink-0" />
                        </button>

                        <div
                          className={`grid transition-all duration-300 ease-out ${
                            expandedCompanyId === String(company._id)
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden pl-2 pr-1">
                            <div className="mt-2 mb-1 space-y-1.5">
                              <button
                                type="button"
                                onClick={() => openCompanySection(company._id, "overview")}
                                className="flex w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
                              >
                                View Page
                              </button>
                              <button
                                type="button"
                                onClick={() => openCompanySection(company._id, "jobs")}
                                className="flex w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
                              >
                                View Job Posts
                              </button>
                              {canPostJob(company) ? (
                                <button
                                  type="button"
                                  onClick={() => openCompanySection(company._id, "create")}
                                  className="flex w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:border-[color:var(--brand-orange)] hover:text-[color:var(--brand-orange)]"
                                >
                                  Post a Job
                                </button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-white/60 bg-white/60 p-4 text-xs text-slate-500 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
                      No company pages
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/60 bg-white/60 p-4 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => {
                        if (hasPendingCompanyRequest) return;
                        setOpen("company");
                        setCompanyCreateOpen(true);
                        setExpandedCompanyId("");
                        const next = new URLSearchParams(searchParams);
                      next.set("section", "company");
                      next.delete("companyId");
                      next.delete("companyTab");
                      setSearchParams(next, { replace: true });
                      }}
                      disabled={hasPendingCompanyRequest}
                      title={
                        hasPendingCompanyRequest
                          ? "You already have a pending company page request."
                          : "Create a Company Page"
                      }
                      className={`flex h-9 w-full items-center gap-2 rounded-xl border border-transparent px-3 text-left text-sm font-semibold transition ${
                        hasPendingCompanyRequest
                          ? "cursor-not-allowed opacity-50"
                          : open === "company" && companyCreateOpen
                          ? "brand-orange-soft text-[color:var(--brand-orange)] shadow-[0_6px_16px_-10px_rgba(251,119,59,0.7)]"
                          : "text-slate-500 hover:bg-white/70 hover:text-slate-700"
                      }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Create a Company Page</span>
                  </button>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>

          <div className="min-w-0 space-y-6 lg:pl-2">

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-3xl border border-white/60 bg-white/60 p-6 shadow-[0_22px_50px_-28px_rgba(15,23,42,0.4)] backdrop-blur-md">
              {open !== "company" ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      {open === "pi" ? <UserRound className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      {open === "education" ? <FileText className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      {open === "experience" ? <Briefcase className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      {open === "projects" ? <ClipboardList className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      {open === "audio" ? <Mic className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      {open === "video" ? <Video className="h-5 w-5 text-[color:var(--brand-orange)]" /> : null}
                      <h2 className="text-lg font-semibold text-slate-800">
                        {sectionItems[safeIndex]?.label}
                      </h2>
                    </div>
                  </div>
              ) : null}

                <div className="mt-6">
                  {open === "pi" ? (
                    <PersonalDetailsForm
                      formData={formData}
                      handleChange={handleChange}
                      handleCustomChange={handleCustomChange}
                      locked={!!locked.pi}
                      resumeRef={resumeRef}
                      profilePicRef={profilePicRef}
                      userId={user?._id}
                      onAskConfirm={onAskConfirm}
                      savePersonalInfo={savePersonalInfo}
                      saving={saving}
                    />
                  ) : null}

                  {open === "education" ? (
                    <EducationForm
                      educationList={formData.education}
                      addEducation={addEducation}
                      removeEducation={removeEducation}
                      updateEducation={updateEducation}
                      locked={!!locked.education}
                      degreeRefs={degreeRefs}
                      eduCreditByKey={eduCreditByKey}
                      instituteOptions={orgOptions.universities}
                      saveEducation={saveEducationRow}
                      isRowSaving={isRowSaving}
                      onAskConfirm={onAskConfirm}
                    />
                  ) : null}

                  {open === "experience" ? (
                    <ExperienceForm
                      experienceList={formData.experience}
                      addExperience={addExperience}
                      removeExperience={removeExperience}
                      updateExperience={updateExperience}
                      locked={!!locked.experience}
                      letterRefs={letterRefs}
                      expCreditByKey={expCreditByKey}
                      companyOptions={orgOptions.companies}
                      onAskConfirm={onAskConfirm}
                      saveExperience={saveExperienceRow}
                      isRowSaving={isExpRowSaving}
                    />
                  ) : null}

                  {open === "projects" ? (
                    <ProjectForm
                      projectList={formData.projects}
                      addProject={addProject}
                      removeProject={removeProject}
                      updateProject={updateProject}
                      locked={!!locked.projects}
                      projectCreditByKey={projectCreditByKey}
                      companyOptions={projectCompanyOptions}
                      saveProject={saveProjectRow}
                      isRowSaving={isProjectRowSaving}
                      onAskConfirm={onAskConfirm}
                    />
                  ) : null}

                  {open === "audio" ? (
                    <MediaProfileSection
                      kind="audio"
                      title="Audio Profile"
                      icon={Mic}
                      formData={formData}
                      handleCustomChange={handleCustomChange}
                      locked={!!locked.pi}
                      onAskConfirm={onAskConfirm}
                      savePersonalInfo={savePersonalInfo}
                      saving={saving}
                    />
                  ) : null}

                  {open === "video" ? (
                    <MediaProfileSection
                      kind="video"
                      title="Video Profile"
                      icon={Video}
                      formData={formData}
                      handleCustomChange={handleCustomChange}
                      locked={!!locked.pi}
                      onAskConfirm={onAskConfirm}
                      savePersonalInfo={savePersonalInfo}
                      saving={saving}
                    />
                  ) : null}

                  {open === "company" ? (
                    <CompanyProfilesSection
                      createOpen={companyCreateOpen}
                      setCreateOpen={setCompanyCreateOpen}
                      selectedCompanyId={selectedCompanyId}
                      selectedCompanyTab={selectedCompanyTab || "overview"}
                      onCompaniesLoaded={setCompanyPages}
                    />
                  ) : null}
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={safeIndex === 0}
                    className="rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={safeIndex === sectionOrder.length - 1}
                    className="rounded-full border border-[color:var(--brand-orange)] brand-orange-soft px-4 py-2 text-sm font-semibold text-[color:var(--brand-orange)] transition hover:text-[color:var(--brand-orange)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {open === "pi" ? "Create Company Page" : "Next"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
          setPendingTitle("");
          setPendingValue(null);
        }}
        title={`Save ${pendingTitle}?`}
        description={`Once saved, your ${pendingTitle.toLowerCase()} cannot be modified. Please review carefully before confirming.`}
        confirmText="Yes, save it"
        cancelText="Cancel"
      />
    </div>
  );
}

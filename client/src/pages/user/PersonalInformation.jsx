import React, { useEffect, useMemo, useRef, useState } from "react"; // ⬅️ add useMemo
import { useSnackbar } from "notistack";
import {
  BriefcaseBusiness as Briefcase,
  FileText,
  UserRound,
} from "lucide-react";

import AccordionSection from "@/components/common/AccordionSection";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PersonalDetailsForm from "@/components/profile/PersonalDetailsForm";
import EducationForm from "@/components/profile/EducationForm";
import ExperienceForm from "@/components/profile/ExperienceForm";
import ConfirmDialog from "@/components/common/ConfirmDialog";

import usePersonalInformationForm from "@/hooks/usePersonalInformationForm";
import { toYMD } from "@/lib/dates";
import { getProfileMe } from "@/lib/profileApi";
import { useAuth } from "@/context/AuthContext";

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
    // experience
    addExperience,
    updateExperience,
    removeExperience,
    saveExperience,
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
  const [open, setOpen] = useState("pi");
  const [locked, setLocked] = useState({});

  const { user, loading: authLoading } = useAuth();

  const eduCredits = Number(user?.verifyCredits?.education ?? 0);
  const expCredits = Number(user?.verifyCredits?.experience ?? 0);

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
        : [],
      dob: toYMD(data.dob),
      education: Array.isArray(data.education)
        ? data.education.map((e) => ({
            ...e,
            startDate: toYMD(e.startDate),
            endDate: toYMD(e.endDate),
          }))
        : prev.education,
      experience: Array.isArray(data.experience)
        ? data.experience.map((x) => ({
            ...x,
            startDate: toYMD(x.startDate),
            endDate: toYMD(x.endDate),
          }))
        : prev.experience,
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

        setLocked((prev) => ({ ...prev, [pendingValue]: true }));

        if (serverProfile) normalizeFromServer(serverProfile);

        if (pendingValue === "pi") {
          resumeRef.current?.reset?.();
          profilePicRef.current?.reset?.();
          clearPersonalFiles();
        }
        if (pendingValue === "education") {
          degreeRefs.current.forEach((r) => r?.reset?.());
          clearEducationFiles();
        }
        if (pendingValue === "experience") {
          letterRefs.current.forEach((r) => r?.reset?.());
          clearExperienceFiles();
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

  const handleCancel = () => {
    setConfirmOpen(false);
    setPendingAction(null);
    setPendingTitle("");
    setPendingValue(null);
  };

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

  // fetch full profile
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
          dob: toYMD(data.dob),
          education: Array.isArray(data.education)
            ? data.education.map((e) => ({
                ...e,
                startDate: toYMD(e.startDate),
                endDate: toYMD(e.endDate),
              }))
            : prev.education,
          experience: Array.isArray(data.experience)
            ? data.experience.map((x) => ({
                ...x,
                startDate: toYMD(x.startDate),
                endDate: toYMD(x.endDate),
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
        }));

        setLocked({
          pi: data.personalInfoLocked,
          education: data.educationLocked,
          experience: data.experienceLocked,
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

  // ===== Share Button logic (moved here) =====
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
  // ===========================================

  return (
    <div className="min-h-screen w-full flex items-start justify-center px-4 py-10 relative overflow-hidden">
      <div className="relative z-10 w-full max-w-5xl">
        <ProfileHeader
          user={formData}
          profilePicRef={profilePicRef}
          uploading={saving && open === "pi"}
          onPhotoChange={(file) => {
            if (file) {
              handleCustomChange("profilePic", file);
            } else {
              handleCustomChange("profilePic", "");
            }
          }}
          onPhotoSave={async () => {
            const res = await saveProfilePhoto();
            if (res?.ok) {
              enqueueSnackbar("Profile photo saved", { variant: "success" });
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
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          <AccordionSection
            title="Personal Details"
            icon={UserRound}
            value="pi"
            openValue={open}
            setOpenValue={setOpen}
            onSave={async () => await savePersonalInfo()}
            saving={saving}
            onAskConfirm={onAskConfirm}
            locked={!!locked.pi}
          >
            <PersonalDetailsForm
              formData={formData}
              handleChange={handleChange}
              handleCustomChange={handleCustomChange}
              locked={!!locked.pi}
              resumeRef={resumeRef}
              profilePicRef={profilePicRef}
              userId={user?._id}
            />
          </AccordionSection>

          <AccordionSection
            title="Education"
            icon={FileText}
            value="education"
            openValue={open}
            setOpenValue={setOpen}
            onSave={async () => await saveEducation()}
            saving={saving}
            onAskConfirm={onAskConfirm}
            locked={!!locked.education}
            verifyCredits={eduCredits}
          >
            <EducationForm
              educationList={formData.education}
              addEducation={addEducation}
              removeEducation={removeEducation}
              updateEducation={updateEducation}
              locked={!!locked.education}
              degreeRefs={degreeRefs}
            />
          </AccordionSection>

          <AccordionSection
            title="Experience"
            icon={Briefcase}
            value="experience"
            openValue={open}
            setOpenValue={setOpen}
            onSave={async () => await saveExperience()}
            saving={saving}
            onAskConfirm={onAskConfirm}
            locked={!!locked.experience}
            verifyCredits={expCredits}
          >
            <ExperienceForm
              experienceList={formData.experience}
              addExperience={addExperience}
              removeExperience={removeExperience}
              updateExperience={updateExperience}
              locked={!!locked.experience}
              letterRefs={letterRefs}
            />
          </AccordionSection>
        </form>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        title={`Save ${pendingTitle}?`}
        description={`Once saved, your ${pendingTitle.toLowerCase()} cannot be modified. Please review carefully before confirming.`}
        confirmText="Yes, save it"
        cancelText="Cancel"
      />
    </div>
  );
}

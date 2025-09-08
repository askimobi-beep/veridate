import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "@/context/AuthContext"; // ✅ NEW

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

  // ✅ auth context (logged-in user)
  const { user, loading: authLoading } = useAuth();

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
      // ✅ also make sure name/email are always in sync with auth when available
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

  // ✅ 1) Immediately reflect auth user into the form (fast UI), even before /profile call
  useEffect(() => {
    if (!authLoading && user) {
      setFormData((prev) => ({
        ...prev,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: user.email || prev.email || "",
      }));
    }
    // if user is null we don't clear fields; keep whatever is there
  }, [authLoading, user, setFormData]);

  // ✅ 2) Fetch full profile + normalize; also respects auth user for name/email
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfileMe();

        setFormData((prev) => ({
          ...prev,
          ...data,
          // ensure name/email come from auth if available, else from profile
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

    // only load after auth check finishes (prevents flicker/race)
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

  return (
    <div className="min-h-screen w-full flex items-start justify-center px-4 py-10 relative overflow-hidden bg-gradient-to-br from-white via-[#eaf0ff] to-[#dfe8ff]">
      <div className="pointer-events-none absolute -top-36 left-1/3 h-[42rem] w-[42rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.22),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 right-[-10%] h-[40rem] w-[40rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.24),transparent_70%)] blur-3xl" />

      <div className="relative z-10 w-full max-w-5xl">
        <ProfileHeader
          user={formData}
          profilePicRef={profilePicRef}
          uploading={saving && open === "pi"}
          onPhotoChange={(file) => {
            // file can be null (Delete)
            // use the SAME key that works with your FileUploader:
            //   <FileUploader onChange={(file) => handleCustomChange("profilePic", file)} />
            if (file) {
              handleCustomChange("profilePic", file); // << key al  igned
            } else {
              handleCustomChange("profilePic", ""); // clear
            }
          }}
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
              userId={user._id} // or whatever your user id is
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

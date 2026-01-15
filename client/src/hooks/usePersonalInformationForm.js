import { useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { useAuth } from "@/context/AuthContext";

const getEmptyForm = () => ({
  // --- personal ---
  name: "",
  email: "",
  fatherName: "",
  mobile: "",
  cnic: "",
  city: "",
  country: "",
  gender: "",
  maritalStatus: "",
  residentStatus: "",
  nationality: "",
  dob: "",
  shiftPreferences: [],
  workAuthorization: [],
  resume: null,
  profilePic: null,
  audioProfile: null,
  videoProfile: null,
  personalHiddenFields: [],

  // --- education ---
  education: [
    {
      degreeTitle: "",
      startDate: "",
      endDate: "",
      institute: "",
      instituteWebsite: "",
      degreeFile: null,
      hiddenFields: [],
    },
  ],

  // --- experience ---
  experience: [
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

  // --- projects ---
  projects: [
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
});

export default function usePersonalInformationForm() {
  const [formData, setFormData] = useState(getEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingRows, setSavingRows] = useState(new Set());
  const [savingExpRows, setSavingExpRows] = useState(new Set());
  const [savingProjectRows, setSavingProjectRows] = useState(new Set());
  const setRowSaving = (index, on) =>
    setSavingRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  const isRowSaving = (i) => savingRows.has(i);

  const setExpRowSaving = (index, on) =>
    setSavingExpRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  const isExpRowSaving = (i) => savingExpRows.has(i);

  const setProjectRowSaving = (index, on) =>
    setSavingProjectRows((prev) => {
      const next = new Set(prev);
      if (on) next.add(index);
      else next.delete(index);
      return next;
    });
  const isProjectRowSaving = (i) => savingProjectRows.has(i);
  const { checkAuth } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files?.[0] || null }));
  };

  const handleCustomChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ===== EDUCATION =====
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degreeTitle: "",
          startDate: "",
          endDate: "",
          institute: "",
          instituteWebsite: "",
          degreeFile: null,
          hiddenFields: [],
        },
      ],
    }));
  };

  const updateEducation = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated[index][field] = value;
      return { ...prev, education: updated };
    });
  };

  const updateExperience = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated[index][field] = value;
      return { ...prev, experience: updated };
    });
  };

  const removeEducation = (index) => {
    setFormData((prev) => {
      const updated = [...prev.education];
      updated.splice(index, 1);
      return { ...prev, education: updated };
    });
  };

  // ===== EXPERIENCE =====
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
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
  };

  const removeExperience = (index) => {
    setFormData((prev) => {
      const updated = [...prev.experience];
      updated.splice(index, 1);
      return { ...prev, experience: updated };
    });
  };

  // ===== PROJECTS =====
  const addProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...(prev.projects || []),
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
  };

  const updateProject = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...(prev.projects || [])];
      updated[index][field] = value;
      return { ...prev, projects: updated };
    });
  };

  const removeProject = (index) => {
    setFormData((prev) => {
      const updated = [...(prev.projects || [])];
      updated.splice(index, 1);
      return { ...prev, projects: updated };
    });
  };

  // ===== resets =====
  const resetForm = () => setFormData(getEmptyForm());

  const clearPersonalFiles = () =>
    setFormData((prev) => ({
      ...prev,
      resume: null,
      profilePic: null,
      audioProfile: null,
      videoProfile: null,
    }));

  const clearEducationFiles = () =>
    setFormData((prev) => ({
      ...prev,
      education: prev.education.map((e) => ({ ...e, degreeFile: null })),
    }));

  const clearExperienceFiles = () =>
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.map((e) => ({
        ...e,
        experienceLetterFile: null,
      })),
    }));

  // ===== APIs =====
  const savePersonalInfo = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name || "");
      fd.append("email", formData.email || "");
      fd.append("fatherName", formData.fatherName || "");
      fd.append("mobile", formData.mobile || "");
      fd.append("mobileCountryCode", formData.mobileCountryCode || "+92"); // 👈 ADD THIS
      fd.append("cnic", formData.cnic || "");
      fd.append("city", formData.city || "");
      fd.append("country", formData.country || "");
      fd.append("gender", formData.gender || "");
      fd.append("maritalStatus", formData.maritalStatus || "");
      fd.append("residentStatus", formData.residentStatus || "");
      fd.append("nationality", formData.nationality || "");
      fd.append("dob", formData.dob || "");
      fd.append(
        "shiftPreferences",
        JSON.stringify(formData.shiftPreferences || [])
      );
      fd.append(
        "workAuthorization",
        JSON.stringify(formData.workAuthorization || [])
      );
      fd.append(
        "personalHiddenFields",
        JSON.stringify(formData.personalHiddenFields || [])
      );

      if (formData.resume instanceof File) {
        fd.append("resume", formData.resume);
      }
      if (formData.profilePic instanceof File) {
        fd.append("profilePic", formData.profilePic);
      } else if (formData.profilePic === "") {
        fd.append("profilePic", "");
      }
      if (formData.audioProfile instanceof File) {
        fd.append("audioProfile", formData.audioProfile);
      }
      if (formData.videoProfile instanceof File) {
        fd.append("videoProfile", formData.videoProfile);
      }

      const res = await axiosInstance.post("/profile/save-personal-info", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });



      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save personal info",
      };
    } finally {
      setSaving(false);
    }
  };



  const saveProfilePhoto = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      if (formData.profilePic instanceof File) {
        fd.append("profilePic", formData.profilePic);
      } else if (formData.profilePic === "") {
        fd.append("profilePic", "");
      }

      const res = await axiosInstance.post("/profile/save-profile-photo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res?.status === 200) {
        checkAuth();
      }
      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save profile photo",
      };
    } finally {
      setSaving(false);
    }
  };

  const saveEducation = async () => {
    setSaving(true);
    const data = new FormData();

    const eduList = formData.education.map((edu, i) => {
      if (edu.degreeFile instanceof File)
        data.append(`educationFiles[${i}]`, edu.degreeFile);
      const { degreeFile, ...rest } = edu;
      return rest;
    });

    data.append("education", JSON.stringify(eduList));

    try {
      const res = await axiosInstance.post("/profile/save-education", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save education",
      };
    } finally {
      setSaving(false);
      checkAuth();
    }
  };

  const saveEducationRow = async (index, row) => {
    setRowSaving(index, true);

    const data = new FormData();

    // attach ONLY this row's file if present
    if (row.degreeFile instanceof File) {
      data.append("educationFiles[0]", row.degreeFile);
    }

    // strip file before JSON
    const { degreeFile, ...rest } = row;

    // send a single-row payload + index hint
    data.append("education", JSON.stringify([rest]));
    data.append("rowIndex", String(index));

    try {
      const res = await axiosInstance.post("/profile/save-education", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // if server returns the normalized row, merge it and lock
      if (res?.data?.row) {
        setFormData((prev) => {
          const education = [...prev.education];
          education[index] = {
            ...education[index],
            ...res.data.row,
            _id: res?.data?.row?._id ?? education[index]?._id, // keep/beef up id
            rowLocked: true, // 🔒 lock this row only
          };
          return { ...prev, education };
        });
      } else {
        // BE didn't echo the row? still lock locally.
        setFormData((prev) => {
          const education = [...prev.education];
          education[index] = {
            ...education[index],
            rowLocked: true,
          };
          return { ...prev, education };
        });
      }

      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save education row",
      };
    } finally {
      setRowSaving(index, false);
      checkAuth();
    }
  };

  const saveExperience = async () => {
    setSaving(true);
    const data = new FormData();

    const expList = formData.experience.map((exp, i) => {
      if (exp.experienceLetterFile instanceof File) {
        data.append(`experienceFiles[${i}]`, exp.experienceLetterFile);
      }
      const { experienceLetterFile, ...rest } = exp;
      return rest;
    });

    data.append("experience", JSON.stringify(expList));

    try {
      const res = await axiosInstance.post("/profile/save-experience", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save experience",
      };
    } finally {
      setSaving(false);
      checkAuth();
    }
  };

  const saveExperienceRow = async (index, row) => {
    setExpRowSaving(index, true);
    const data = new FormData();

    if (row.experienceLetterFile instanceof File) {
      data.append("experienceFiles[0]", row.experienceLetterFile);
    }

    const { experienceLetterFile, ...rest } = row;
    data.append("experience", JSON.stringify([rest]));
    data.append("rowIndex", String(index));

    try {
      const res = await axiosInstance.post("/profile/save-experience", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.row) {
        setFormData((prev) => {
          const experience = [...prev.experience];
          experience[index] = {
            ...experience[index],
            ...res.data.row,
            _id: res?.data?.row?._id ?? experience[index]?._id,
            rowLocked: true, // 🔒 lock this experience row
          };
          return { ...prev, experience };
        });
      } else {
        // lock locally even without echo
        setFormData((prev) => {
          const experience = [...prev.experience];
          experience[index] = { ...experience[index], rowLocked: true };
          return { ...prev, experience };
        });
      }

      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save experience row",
      };
    } finally {
      setExpRowSaving(index, false);
      checkAuth();
    }
  };

  const saveProjects = async () => {
    setSaving(true);
    const data = new FormData();
    data.append("projects", JSON.stringify(formData.projects || []));

    try {
      const res = await axiosInstance.post("/profile/save-projects", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save projects",
      };
    } finally {
      setSaving(false);
      checkAuth();
    }
  };

  const saveProjectRow = async (index, row) => {
    setProjectRowSaving(index, true);
    const data = new FormData();

    data.append("projects", JSON.stringify([row]));
    data.append("rowIndex", String(index));

    try {
      const res = await axiosInstance.post("/profile/save-projects", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res?.data?.row) {
        setFormData((prev) => {
          const projects = [...(prev.projects || [])];
          projects[index] = {
            ...projects[index],
            ...res.data.row,
            _id: res?.data?.row?._id ?? projects[index]?._id,
            rowLocked: true,
          };
          return { ...prev, projects };
        });
      } else {
        setFormData((prev) => {
          const projects = [...(prev.projects || [])];
          projects[index] = { ...projects[index], rowLocked: true };
          return { ...prev, projects };
        });
      }

      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err?.response?.data?.error ||
          err?.message ||
          "Failed to save project row",
      };
    } finally {
      setProjectRowSaving(index, false);
      checkAuth();
    }
  };

  const submit = async () => {
    setSubmitting(true);
    const data = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "education") {
        const eduList = value.map((edu, i) => {
          if (edu.degreeFile instanceof File)
            data.append(`educationFiles[${i}]`, edu.degreeFile);
          const { degreeFile, ...rest } = edu;
          return rest;
        });
        data.append("education", JSON.stringify(eduList));
      } else if (key === "experience") {
        const expList = value.map((exp, i) => {
          if (exp.experienceLetterFile instanceof File)
            data.append(`experienceFiles[${i}]`, exp.experienceLetterFile);
          const { experienceLetterFile, ...rest } = exp;
          return rest;
        });
        data.append("experience", JSON.stringify(expList));
      } else if (Array.isArray(value)) {
        data.append(key, JSON.stringify(value));
      } else {
        data.append(key, value ?? "");
      }
    });

    try {
      const res = await axiosInstance.post("/profile/create", data);
      return { ok: true, data: res.data };
    } catch (error) {
      return {
        ok: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          "Something went wrong",
      };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    handleChange,
    handleFileChange,
    handleCustomChange,
    updateEducation,
    addEducation,
    removeEducation,
    saveEducation,
    clearEducationFiles,
    addExperience,
    updateExperience,
    removeExperience,
    saveExperience,
    saveExperienceRow,
    isExpRowSaving,
    addProject,
    updateProject,
    removeProject,
    saveProjects,
    saveProjectRow,
    isProjectRowSaving,
    clearExperienceFiles,
    savePersonalInfo,
    saveProfilePhoto,
    saveEducationRow,
    isRowSaving,
    submit,
    resetForm,
    clearPersonalFiles,
    submitting,
    saving,
  };
}

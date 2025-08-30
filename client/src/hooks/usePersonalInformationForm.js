import { useState } from "react";
import axiosInstance from "@/utils/axiosInstance";

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
});

export default function usePersonalInformationForm() {
  const [formData, setFormData] = useState(getEmptyForm());
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // ===== resets =====
  const resetForm = () => setFormData(getEmptyForm());

  const clearPersonalFiles = () =>
    setFormData((prev) => ({ ...prev, resume: null, profilePic: null }));

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
      fd.append("cnic", formData.cnic || "");
      fd.append("city", formData.city || "");
      fd.append("country", formData.country || "");
      fd.append("gender", formData.gender || "");
      fd.append("maritalStatus", formData.maritalStatus || "");
      fd.append("residentStatus", formData.residentStatus || "");
      fd.append("nationality", formData.nationality || "");
      fd.append("dob", formData.dob || "");
      fd.append("shiftPreferences", JSON.stringify(formData.shiftPreferences || []));
      fd.append("workAuthorization", JSON.stringify(formData.workAuthorization || []));
      fd.append("personalHiddenFields", JSON.stringify(formData.personalHiddenFields || []));
      if (formData.resume instanceof File) fd.append("resume", formData.resume);
      if (formData.profilePic instanceof File) fd.append("profilePic", formData.profilePic);

      const res = await axiosInstance.post("/profile/save-personal-info", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return { ok: true, data: res.data };
    } catch (err) {
      return {
        ok: false,
        error: err?.response?.data?.error || err?.message || "Failed to save personal info",
      };
    } finally {
      setSaving(false);
    }
  };

 const saveEducation = async () => {
  setSaving(true);
  const data = new FormData();

  const eduList = formData.education.map((edu, i) => {
    if (edu.degreeFile instanceof File) data.append(`educationFiles[${i}]`, edu.degreeFile); // CHANGED
    const { degreeFile, ...rest } = edu;
    return rest;
  });

  data.append("education", JSON.stringify(eduList));

  try {
    const res = await axiosInstance.post("/profile/save-education", data, {
      headers: { "Content-Type": "multipart/form-data" }, // CHANGED: ensure header
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return {
      ok: false,
      error: err?.response?.data?.error || err?.message || "Failed to save education",
    };
  } finally {
    setSaving(false);
  }
};

 const saveExperience = async () => {
  setSaving(true);
  const data = new FormData();

  const expList = formData.experience.map((exp, i) => {
    // CHANGED: send files with explicit index so backend can map to the right row
    if (exp.experienceLetterFile instanceof File) {
      data.append(`experienceFiles[${i}]`, exp.experienceLetterFile);
    }
    const { experienceLetterFile, ...rest } = exp;
    return rest;
  });

  data.append("experience", JSON.stringify(expList));

  try {
    const res = await axiosInstance.post("/profile/save-experience", data, {
      headers: { "Content-Type": "multipart/form-data" }, // ensure multipart
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return {
      ok: false,
      error: err?.response?.data?.error || err?.message || "Failed to save experience",
    };
  } finally {
    setSaving(false);
  }
};

const submit = async () => {
  setSubmitting(true);
  const data = new FormData();

  Object.entries(formData).forEach(([key, value]) => {
    if (key === "education") {
      const eduList = value.map((edu, i) => {
        if (edu.degreeFile instanceof File) data.append(`educationFiles[${i}]`, edu.degreeFile); // CHANGED
        const { degreeFile, ...rest } = edu;
        return rest;
      });
      data.append("education", JSON.stringify(eduList));
    } else if (key === "experience") {
      const expList = value.map((exp, i) => {
        if (exp.experienceLetterFile instanceof File) data.append(`experienceFiles[${i}]`, exp.experienceLetterFile); // (optional symmetry)
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
      error: error?.response?.data?.error || error?.message || "Something went wrong",
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
    // education
    updateEducation,
    addEducation,
    removeEducation,
    saveEducation,
    clearEducationFiles,
    // experience
    addExperience,
    updateExperience,
    removeExperience,
    saveExperience,
    clearExperienceFiles,
    // personal
    savePersonalInfo,
    // global
    submit,
    resetForm,
    clearPersonalFiles,
    submitting,
    saving,
  };
}

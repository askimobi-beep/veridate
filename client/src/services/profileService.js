// services/profileService.js
import axiosInstance from "@/utils/axiosInstance";
import { latestByDate } from "@/utils/profileUtils";

export const fetchProfiles = async (params) => {
  const res = await axiosInstance.get("/profile/directory", { params });
  const raw = Array.isArray(res.data?.data) ? res.data.data : [];

  const normalized = raw.map((p) => {
    const educationArr = Array.isArray(p.education)
      ? p.education
      : p.education
      ? [p.education]
      : [];
    const experienceArr = Array.isArray(p.experience)
      ? p.experience
      : p.experience
      ? [p.experience]
      : [];
    const projectsArr = Array.isArray(p.projects)
      ? p.projects
      : p.projects
      ? [p.projects]
      : [];

    const educationLatest = educationArr.length ? latestByDate(educationArr) : null;
    const experienceLatest = experienceArr.length
      ? latestByDate(experienceArr)
      : null;

    return {
      ...p,
      education: educationArr,
      experience: experienceArr,
      projects: projectsArr,
      educationLatest,
      experienceLatest,
    };
  });

  return { data: normalized, total: res.data?.total || 0 };
};

// services/profileService.js
import axiosInstance from "@/utils/axiosInstance";
import { latestByDate } from "@/utils/profileUtils";

export const fetchProfiles = async (params) => {
  const res = await axiosInstance.get("/profile/directory", { params });
  const raw = res.data?.data || [];

  const normalized = raw.map((p) => {
    const educationLatest = Array.isArray(p.education)
      ? latestByDate(p.education)
      : p.education || null;

    const experienceLatest = Array.isArray(p.experience)
      ? latestByDate(p.experience)
      : p.experience || null;

    return { ...p, educationLatest, experienceLatest };
  });

  return { data: normalized, total: res.data?.total || 0 };
};

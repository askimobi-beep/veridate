import axiosInstance from "@/utils/axiosInstance";

export async function getProfileMe() {
  const res = await axiosInstance.get("/profile/me");
  return res.data;
}

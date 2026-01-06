import axiosInstance from "@/utils/axiosInstance";

export const fetchOrganizations = async () => {
  const res = await axiosInstance.get("/organizations");
  return res?.data?.data || [];
};

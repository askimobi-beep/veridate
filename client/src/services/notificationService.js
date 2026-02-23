import axiosInstance from "@/utils/axiosInstance";

export const fetchNotifications = async (params = {}) => {
  const res = await axiosInstance.get("/notifications", { params });
  return res.data;
};

export const markNotificationRead = async (id) => {
  const res = await axiosInstance.patch(`/notifications/${id}/read`);
  return res.data;
};

export const markAllNotificationsRead = async () => {
  const res = await axiosInstance.patch("/notifications/read-all");
  return res.data;
};

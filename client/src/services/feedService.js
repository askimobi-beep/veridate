import axiosInstance from "@/utils/axiosInstance";

export async function fetchFeed(page = 1, limit = 10) {
  const res = await axiosInstance.get(`feed?page=${page}&limit=${limit}`);
  return {
    data: res.data?.data || [],
    total: res.data?.total || 0,
    page: res.data?.page || 1,
    limit: res.data?.limit || 10,
  };
}

export async function createFeedPost(formData) {
  const res = await axiosInstance.post("feed", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deleteFeedPost(id) {
  const res = await axiosInstance.delete(`feed/${id}`);
  return res.data;
}

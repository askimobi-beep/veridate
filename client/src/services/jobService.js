import axiosInstance from "@/utils/axiosInstance";

export async function fetchJobs(params = {}) {
  const query = new URLSearchParams();
  if (params.title) query.set("title", params.title);
  if (params.location) query.set("location", params.location);
  if (params.company) query.set("company", params.company);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));

  const res = await axiosInstance.get(`jobs?${query.toString()}`);
  return {
    data: res.data?.data || [],
    total: res.data?.total || 0,
    page: res.data?.page || 1,
    limit: res.data?.limit || 10,
  };
}

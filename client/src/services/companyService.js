import axiosInstance from "@/utils/axiosInstance";

export const createCompanyProfile = async (payload) => {
  const res = await axiosInstance.post("/companies", payload, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res?.data;
};

export const fetchMyCompanies = async () => {
  const res = await axiosInstance.get("/companies/mine");
  return res?.data?.data || [];
};

export const fetchApprovedCompanies = async () => {
  const res = await axiosInstance.get("/companies/approved");
  return res?.data?.data || [];
};

export const fetchCompanyPublic = async (id) => {
  const res = await axiosInstance.get(`/companies/${id}`);
  return res?.data;
};

export const fetchCompanyJobs = async (companyId) => {
  const res = await axiosInstance.get(`/companies/${companyId}/jobs`);
  return res?.data?.data || [];
};

export const createCompanyJob = async (companyId, payload) => {
  const res = await axiosInstance.post(`/companies/${companyId}/jobs`, payload);
  return res?.data?.data;
};

export const createCompanyInvite = async (companyId, payload) => {
  const res = await axiosInstance.post(`/companies/${companyId}/invites`, payload);
  return res?.data?.data;
};

export const fetchCompanyMembers = async (companyId) => {
  const res = await axiosInstance.get(`/companies/${companyId}/members`);
  return res?.data?.data || [];
};

export const updateCompanyMemberRole = async (companyId, memberId, role) => {
  const res = await axiosInstance.patch(
    `/companies/${companyId}/members/${memberId}`,
    { role }
  );
  return res?.data;
};

export const removeCompanyMember = async (companyId, memberId) => {
  const res = await axiosInstance.delete(
    `/companies/${companyId}/members/${memberId}`
  );
  return res?.data;
};

export const fetchInvitePreview = async (token) => {
  const res = await axiosInstance.get(`/companies/invite/${token}`);
  return res?.data?.data;
};

export const acceptInvite = async (token) => {
  const res = await axiosInstance.post(`/companies/invite/${token}/accept`);
  return res?.data;
};

export const declineInvite = async (token) => {
  const res = await axiosInstance.post(`/companies/invite/${token}/decline`);
  return res?.data;
};

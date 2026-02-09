import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCompanyPublic,
  fetchCompanyJobs,
  createCompanyJob,
  createCompanyInvite,
  fetchCompanyMembers,
  updateCompanyMemberRole,
  removeCompanyMember,
} from "@/services/companyService";
import { Button } from "@/components/ui/button";
import AppInput from "@/components/form/AppInput";
import { Textarea } from "@/components/ui/textarea";

export default function CompanyProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "overview";

  const [company, setCompany] = useState(null);
  const [myRole, setMyRole] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "" });
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState("manager");
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [inviteLimit, setInviteLimit] = useState(1);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);

  const canManageTeam = ["owner", "admin"].includes(myRole);
  const canPost =
    company?.status === "approved" &&
    ["owner", "admin", "manager"].includes(myRole);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetchCompanyPublic(id);
      const data = res?.data;
      setCompany(data);
      setMyRole(res?.myRole || "");
      if (data?._id) {
        const list = await fetchCompanyJobs(data._id);
        setJobs(list);
      }
    } catch {
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) load();
  }, [id]);

  const loadMembers = async () => {
    if (!company?._id || !canManageTeam) return;
    setMembersLoading(true);
    try {
      const list = await fetchCompanyMembers(company._id);
      setMembers(list);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "team") loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, company?._id, canManageTeam]);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onCreateJob = async () => {
    if (!form.title || !form.description) return;
    setSaving(true);
    try {
      await createCompanyJob(company._id, form);
      setForm({ title: "", description: "", location: "" });
      const list = await fetchCompanyJobs(company._id);
      setJobs(list);
      setSearchParams({ tab: "jobs" });
    } finally {
      setSaving(false);
    }
  };

  const onCreateInvite = async () => {
    if (!company?._id) return;
    setInviteBusy(true);
    try {
      const invite = await createCompanyInvite(company._id, {
        role: inviteRole,
        expiresInDays: Number(inviteExpiry) || 7,
        usageLimit: Number(inviteLimit) || 1,
      });
      const link = `${window.location.origin}/company/${company._id}/invite/${invite.token}`;
      setInviteLink(link);
    } finally {
      setInviteBusy(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-600">Loading company...</div>;
  }

  if (!company) {
    return <div className="p-6 text-sm text-slate-600">Company not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
        >
          ← Back
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between flex-wrap gap-3 text-left">
          <div>
            <div className="text-2xl font-bold text-[color:var(--brand-orange)]">
              {company.name}
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <span>📞</span>
              <a href={`tel:${company.phone}`} className="hover:underline">
                {company.phone}
              </a>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2">
                📍 {company.address}
              </span>
              <span className="text-slate-400">|</span>
              <a
                href={company.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-[color:var(--brand-orange)] hover:underline"
              >
                🌐 Visit Website
              </a>
            </div>
          </div>
          <span
            className={`text-xs font-semibold ${
              company.status === "approved"
                ? "text-green-600"
                : company.status === "rejected"
                ? "text-red-600"
                : "text-amber-600"
            }`}
          >
            {String(company.status || "pending").toUpperCase()}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button
            type="button"
            variant={tab === "overview" ? "default" : "outline"}
            onClick={() => setSearchParams({ tab: "overview" })}
            className={
              tab === "overview"
                ? "bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                : ""
            }
          >
            Overview
          </Button>
          <Button
            type="button"
            variant={tab === "jobs" ? "default" : "outline"}
            onClick={() => setSearchParams({ tab: "jobs" })}
            className={
              tab === "jobs"
                ? "bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                : ""
            }
          >
            View Job Posts
          </Button>
          {canPost ? (
            <Button
              type="button"
              variant={tab === "create" ? "default" : "outline"}
              onClick={() => setSearchParams({ tab: "create" })}
              className={
                tab === "create"
                  ? "bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                  : ""
              }
            >
              Create Job Post
            </Button>
          ) : null}
          {canManageTeam ? (
            <Button
              type="button"
              variant={tab === "team" ? "default" : "outline"}
              onClick={() => setSearchParams({ tab: "team" })}
              className={
                tab === "team"
                  ? "bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
                  : ""
              }
            >
              Manage Team
            </Button>
          ) : null}
        </div>
      </div>

      {tab === "overview" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm text-slate-700">
            Company verification status:{" "}
            <span className="font-semibold">{company.status}</span>
          </div>
          {company.status !== "approved" ? (
            <div className="mt-2 text-sm text-slate-500">
              Your submission has been received. Verification will take up to 5
              business days.
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "jobs" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-800 mb-3">
            Job Posts
          </div>
          {jobs.length ? (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div
                  key={job._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="font-semibold text-slate-800">
                    {job.title}
                  </div>
                  <div className="text-sm text-slate-600">
                    {job.location || "Location not specified"}
                  </div>
                  <div className="text-sm text-slate-700 mt-2">
                    {job.description}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No job posts yet.</div>
          )}
        </div>
      ) : null}

      {tab === "create" && canPost ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="text-sm font-semibold text-slate-800 mb-3">
            Create Job Post
          </div>
          <div className="grid grid-cols-1 gap-4">
            <AppInput
              label="Job Title"
              name="title"
              value={form.title}
              onChange={onChange}
              placeholder="Job title"
            />
            <AppInput
              label="Location"
              name="location"
              value={form.location}
              onChange={onChange}
              placeholder="Location"
            />
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                Description
              </div>
              <Textarea
                name="description"
                value={form.description}
                onChange={onChange}
                placeholder="Job description"
                className="min-h-[120px]"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              type="button"
              onClick={onCreateJob}
              disabled={saving}
              className="bg-[color:var(--brand-orange)] text-white hover:bg-[color:var(--brand-orange)]"
            >
              {saving ? "Creating..." : "Create Job Post"}
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "team" && canManageTeam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="text-sm font-semibold text-slate-800">Manage Team</div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_120px_auto] gap-3 items-end">
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                Role
              </div>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                Expiry (days)
              </div>
              <input
                type="number"
                min="1"
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-700 mb-1">
                Usage
              </div>
              <input
                type="number"
                min="1"
                value={inviteLimit}
                onChange={(e) => setInviteLimit(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <Button
              type="button"
              onClick={onCreateInvite}
              disabled={inviteBusy}
              className="h-10 bg-[color:var(--brand-orange)] text-white hover:brightness-110"
            >
              {inviteBusy ? "Generating..." : "Generate Link"}
            </Button>
          </div>

          {inviteLink ? (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-slate-500">Invite link</div>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={inviteLink}
                  className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => navigator.clipboard.writeText(inviteLink)}
                >
                  Copy
                </Button>
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-4">
            <div className="text-sm font-semibold text-slate-800 mb-3">
              Members
            </div>
            {membersLoading ? (
              <div className="text-sm text-slate-500">Loading members...</div>
            ) : members.length ? (
              <div className="space-y-3">
                {members.map((member) => {
                  const userObj = member.user || {};
                  const memberId = userObj._id || userObj.id || "";
                  const displayName =
                    userObj.name ||
                    [userObj.firstName, userObj.lastName]
                      .filter(Boolean)
                      .join(" ")
                      .trim() ||
                    userObj.email ||
                    "Member";
                  const isOwner = member.isOwner;

                  return (
                    <div
                      key={memberId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <div className="text-sm text-slate-700">{displayName}</div>
                      <div className="flex items-center gap-3">
                        <select
                          value={member.role}
                          disabled={isOwner}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            await updateCompanyMemberRole(
                              company._id,
                              memberId,
                              newRole
                            );
                            await loadMembers();
                          }}
                          className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="manager">Manager</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        <button
                          type="button"
                          disabled={isOwner}
                          className="text-xs font-semibold text-red-600 disabled:opacity-40"
                          onClick={async () => {
                            await removeCompanyMember(company._id, memberId);
                            await loadMembers();
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-slate-500">No members yet.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

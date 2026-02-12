import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Save,
  Share2,
  Globe,
  MapPin,
  Phone,
  Search,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  fetchCompanyPublic,
  fetchCompanyJobs,
  createCompanyJob,
  createCompanyInvite,
  fetchCompanyMembers,
  updateCompanyMemberRole,
  updateCompanyAbout,
  removeCompanyMember,
} from "@/services/companyService";
import { Button } from "@/components/ui/button";
import AppInput from "@/components/form/AppInput";
import { Textarea } from "@/components/ui/textarea";

const statusClass = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const toLogoUrl = (logoFile) => {
  if (!logoFile) return "";
  if (typeof logoFile === "string") return logoFile;
  if (!logoFile.filename) return "";
  const base = (import.meta.env.VITE_API_PIC_URL || "").replace(/\/$/, "");
  if (!base) return `/uploads/company-logo/${logoFile.filename}`;
  return `${base}/uploads/company-logo/${logoFile.filename}`;
};

export default function CompanyProfile({
  companyId: companyIdProp,
  embedded = false,
  initialTab = "overview",
  onBack,
}) {
  const { id: routeCompanyId } = useParams();
  const id = companyIdProp || routeCompanyId;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [embeddedTab, setEmbeddedTab] = useState(initialTab || "overview");
  const tab = embedded ? embeddedTab : searchParams.get("tab") || "overview";

  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [myRole, setMyRole] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "" });

  const [jobTitleQuery, setJobTitleQuery] = useState("");
  const [jobLocationQuery, setJobLocationQuery] = useState("");

  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteRole, setInviteRole] = useState("manager");
  const [inviteExpiry, setInviteExpiry] = useState(7);
  const [inviteLimit, setInviteLimit] = useState(1);
  const [inviteLink, setInviteLink] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);

  const canManageTeam = ["owner", "admin"].includes(myRole);
  const canPost = company?.status === "approved" && ["owner", "admin", "manager"].includes(myRole);
  const canEditCompanyPage = ["owner", "admin", "manager"].includes(myRole);

  const changeTab = (nextTab) => {
    if (embedded) {
      setEmbeddedTab(nextTab);
      return;
    }
    setSearchParams({ tab: nextTab });
  };

  useEffect(() => {
    if (embedded) setEmbeddedTab(initialTab || "overview");
  }, [embedded, initialTab]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchCompanyPublic(id);
      const data = res?.data;
      setCompany(data || null);
      setMyRole(res?.myRole || "");
      if (data?._id) {
        const list = await fetchCompanyJobs(data._id);
        setJobs(Array.isArray(list) ? list : []);
      }
    } catch {
      setCompany(null);
      setMyRole("");
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [id]);

  useEffect(() => {
    setAboutDraft(company?.about || "");
    setEditingAbout(false);
  }, [company?._id, company?.about]);

  const loadMembers = async () => {
    if (!company?._id || !canManageTeam) return;
    setMembersLoading(true);
    try {
      const list = await fetchCompanyMembers(company._id);
      setMembers(Array.isArray(list) ? list : []);
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "team") loadMembers();
  }, [tab, company?._id, canManageTeam]);

  const onCreateJob = async () => {
    if (!form.title || !form.description || !company?._id) return;
    setSaving(true);
    try {
      await createCompanyJob(company._id, form);
      setForm({ title: "", description: "", location: "" });
      const list = await fetchCompanyJobs(company._id);
      setJobs(Array.isArray(list) ? list : []);
      changeTab("jobs");
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
      setInviteLink(`${window.location.origin}/company/${company._id}/invite/${invite.token}`);
    } finally {
      setInviteBusy(false);
    }
  };

  const onSaveAbout = async () => {
    if (!company?._id || !String(aboutDraft || "").trim()) return;
    setAboutSaving(true);
    try {
      const updated = await updateCompanyAbout(company._id, aboutDraft);
      setCompany((prev) => ({ ...(prev || {}), ...(updated || {}), about: updated?.about || aboutDraft }));
      setEditingAbout(false);
    } finally {
      setAboutSaving(false);
    }
  };

  const filteredJobs = useMemo(() => {
    const titleQ = jobTitleQuery.trim().toLowerCase();
    const locationQ = jobLocationQuery.trim().toLowerCase();
    return jobs.filter((job) => {
      const titleOk = !titleQ || String(job.title || "").toLowerCase().includes(titleQ);
      const locOk = !locationQ || String(job.location || "").toLowerCase().includes(locationQ);
      return titleOk && locOk;
    });
  }, [jobs, jobTitleQuery, jobLocationQuery]);

  if (loading) return <div className="p-4 text-sm text-slate-600">Loading company...</div>;
  if (!company) return <div className="p-4 text-sm text-slate-600">Company not found.</div>;

  const companyLogoUrl = toLogoUrl(company.logo);
  const companyInitial = String(company.name || "C").charAt(0).toUpperCase();
  const companyPublicUrl = `${window.location.origin}/dashboard/companies/${company._id}`;
  const onShareCompany = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: company?.name || "Company Page",
          text: "Check this company page",
          url: companyPublicUrl,
        });
      } else {
        await navigator.clipboard.writeText(companyPublicUrl);
      }
    } catch {
      // no-op
    }
  };

  return (
    <div className={`${embedded ? "space-y-4" : "max-w-6xl mx-auto p-6 space-y-4"}`}>
      {!embedded ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
      ) : onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to company list
        </button>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3 text-left">
            <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex items-center justify-center text-lg font-bold text-slate-600 shrink-0">
              {companyLogoUrl ? (
                <img src={companyLogoUrl} alt={company.name} className="h-full w-full object-cover" />
              ) : (
                companyInitial
              )}
            </div>
            <div className="min-w-0 text-left">
              <div className="truncate text-left text-xl font-bold text-slate-900">{company.name}</div>
              <div className="mt-1 flex flex-wrap items-center justify-start gap-x-4 gap-y-1 text-sm text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  <a href={`tel:${company.phone}`} className="hover:underline">{company.phone}</a>
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  {company.address}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Globe className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  <a href={company.website} target="_blank" rel="noreferrer" className="hover:underline">
                    Visit Website
                  </a>
                </span>
              </div>
            </div>
          </div>

          <span
            className={`inline-flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold ${
              statusClass[company.status] || statusClass.pending
            }`}
          >
            {String(company.status || "pending").toUpperCase()}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            variant={tab === "overview" ? "default" : "outline"}
            onClick={() => changeTab("overview")}
            className={tab === "overview" ? "bg-[color:var(--brand-orange)] text-white hover:brightness-110" : ""}
          >
            Overview
          </Button>
          <Button
            type="button"
            variant={tab === "jobs" ? "default" : "outline"}
            onClick={() => changeTab("jobs")}
            className={tab === "jobs" ? "bg-[color:var(--brand-orange)] text-white hover:brightness-110" : ""}
          >
            Jobs
          </Button>
          {canPost ? (
            <Button
              type="button"
              variant={tab === "create" ? "default" : "outline"}
              onClick={() => changeTab("create")}
              className={tab === "create" ? "bg-[color:var(--brand-orange)] text-white hover:brightness-110" : ""}
            >
              Post a Job
            </Button>
          ) : null}
          {canManageTeam ? (
            <Button
              type="button"
              variant={tab === "team" ? "default" : "outline"}
              onClick={() => changeTab("team")}
              className={tab === "team" ? "bg-[color:var(--brand-orange)] text-white hover:brightness-110" : ""}
            >
              Manage Team
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={onShareCompany}>
            <Share2 className="mr-1 h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {tab === "overview" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4 text-left">
          <div>
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-slate-800">Tagline</div>
              {canEditCompanyPage ? (
                editingAbout ? (
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { setEditingAbout(false); setAboutDraft(company?.about || ""); }}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={onSaveAbout}
                      disabled={aboutSaving || !String(aboutDraft || "").trim()}
                      className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
                    >
                      <Save className="mr-1 h-4 w-4" />
                      {aboutSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingAbout(true)}>
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                )
              ) : null}
            </div>
            {editingAbout ? (
              <Textarea
                value={aboutDraft}
                onChange={(e) => setAboutDraft(e.target.value)}
                placeholder="Tell people what your company does"
                className="mt-2 min-h-[96px]"
              />
            ) : (
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">
                {company.about || "No company about added yet."}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-xs font-semibold text-slate-500">Website</div>
              <a href={company.website} target="_blank" rel="noreferrer" className="text-slate-700 hover:underline">
                {company.website}
              </a>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Address</div>
              <div className="text-slate-700">{company.address}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Phone</div>
              <a href={`tel:${company.phone}`} className="text-slate-700 hover:underline">{company.phone}</a>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-500">Verification</div>
              <div className="text-slate-700 capitalize">{company.status}</div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === "jobs" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={jobTitleQuery}
                onChange={(e) => setJobTitleQuery(e.target.value)}
                placeholder="Search by title"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={jobLocationQuery}
                onChange={(e) => setJobLocationQuery(e.target.value)}
                placeholder="Search by location"
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm"
              />
            </div>
          </div>

          {filteredJobs.length ? (
            <div className="space-y-3">
              {filteredJobs.map((job) => (
                <div key={job._id} className="rounded-xl border border-slate-200 p-4">
                  <div className="font-semibold text-slate-800">{job.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{job.location || "Location not specified"}</div>
                  <div className="mt-2 text-sm text-slate-700">{job.description}</div>
                  <div className="mt-3 text-xs text-slate-500">
                    Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">No job posts found.</div>
          )}
        </div>
      ) : null}

      {tab === "create" && canPost ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <AppInput
            label="Job Title"
            name="title"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Job title"
          />
          <AppInput
            label="Location"
            name="location"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="Location"
          />
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700">Description</div>
            <Textarea
              name="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Job description"
              className="min-h-[120px]"
            />
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={onCreateJob}
              disabled={saving}
              className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
            >
              {saving ? "Creating..." : "Create Job Post"}
            </Button>
          </div>
        </div>
      ) : null}

      {tab === "team" && canManageTeam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Users className="h-4 w-4 text-[color:var(--brand-orange)]" /> Manage Team
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_130px_130px_auto] gap-3 items-end">
            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Role</div>
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
              <div className="mb-1 text-sm font-medium text-slate-700">Expiry (days)</div>
              <input
                type="number"
                min="1"
                value={inviteExpiry}
                onChange={(e) => setInviteExpiry(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"
              />
            </div>
            <div>
              <div className="mb-1 text-sm font-medium text-slate-700">Usage limit</div>
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
            <div className="space-y-2">
              <div className="text-xs text-slate-500">Invite link</div>
              <div className="flex items-center gap-2">
                <input readOnly value={inviteLink} className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                <Button type="button" variant="outline" className="h-10" onClick={() => navigator.clipboard.writeText(inviteLink)}>
                  Copy
                </Button>
              </div>
            </div>
          ) : null}

          <div className="border-t border-slate-200 pt-4">
            <div className="mb-3 text-sm font-semibold text-slate-800">Members</div>
            {membersLoading ? (
              <div className="text-sm text-slate-500">Loading members...</div>
            ) : members.length ? (
              <div className="space-y-3">
                {members.map((member) => {
                  const userObj = member.user || {};
                  const memberId = userObj._id || userObj.id || "";
                  const displayName =
                    userObj.name ||
                    [userObj.firstName, userObj.lastName].filter(Boolean).join(" ").trim() ||
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
                            await updateCompanyMemberRole(company._id, memberId, e.target.value);
                            await loadMembers();
                          }}
                          className="h-9 rounded-md border border-slate-200 px-2 text-sm"
                        >
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

      {tab === "team" && !canManageTeam ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
          You do not have permission to manage team members.
        </div>
      ) : null}
    </div>
  );
}

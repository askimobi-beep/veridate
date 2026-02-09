import React, { useEffect, useState } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import {
  UploadCloud,
  Building2,
  ExternalLink,
  Phone,
  Globe,
  MapPin,
  Briefcase,
  PlusCircle,
} from "lucide-react";
import {
  createCompanyProfile,
  fetchMyCompanies,
} from "@/services/companyService";
import { useSnackbar } from "notistack";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const roleOptions = ["Founder", "Co-founder", "HR", "Recruiter", "Employee"];

export default function CompanyProfilesSection({
  createOpen: createOpenProp,
  setCreateOpen: setCreateOpenProp,
  hideCreateButton = false,
  onCompanyCountChange,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isControlled = typeof createOpenProp !== "undefined";
  const createOpen = isControlled ? createOpenProp : internalCreateOpen;
  const setCreateOpen = isControlled ? setCreateOpenProp : setInternalCreateOpen;
  const [docFile, setDocFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    website: "",
    address: "",
    role: "",
  });

  const load = async () => {
    setLoading(true);
    try {
      const rows = await fetchMyCompanies();
      setCompanies(rows);
      if (typeof onCompanyCountChange === "function") {
        onCompanyCountChange(rows?.length || 0);
      }
    } catch (e) {
      enqueueSnackbar("Failed to load companies", { variant: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.phone || !form.website || !form.address || !form.role) {
      enqueueSnackbar("Please fill all required fields", { variant: "warning" });
      return;
    }
    if (!docFile) {
      enqueueSnackbar("Please upload a verification document", { variant: "warning" });
      return;
    }

    const body = new FormData();
    body.append("name", form.name);
    body.append("phone", form.phone);
    body.append("website", form.website);
    body.append("address", form.address);
    body.append("role", form.role);
    body.append("companyDocs", docFile);

    setSubmitting(true);
    try {
      const res = await createCompanyProfile(body);
      enqueueSnackbar(
        res?.message ||
          "Your submission has been received. Verification will take up to 5 business days.",
        { variant: "success" }
      );
      setForm({ name: "", phone: "", website: "", address: "", role: "" });
      setDocFile(null);
      await load();
      setCreateOpen(false);
    } catch (e) {
      enqueueSnackbar(
        e?.response?.data?.message || "Failed to create company profile",
        { variant: "error" }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {!hideCreateButton ? (
        <div className="flex items-center justify-end">
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="rounded-xl bg-[color:var(--brand-orange)] text-white hover:brightness-110"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Company Profile
          </Button>
        </div>
      ) : null}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <Building2 className="h-5 w-5 text-[color:var(--brand-orange)]" />
              Company Profile
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AppInput
                label="Company Name"
                name="name"
                value={form.name}
                onChange={onChange}
                placeholder="Company name"
              />
              <AppInput
                label="Company Phone Number"
                name="phone"
                value={form.phone}
                onChange={onChange}
                placeholder="Company phone"
              />
              <AppInput
                label="Company Website"
                name="website"
                value={form.website}
                onChange={onChange}
                placeholder="https://company.com"
              />
              <AppInput
                label="Company Address"
                name="address"
                value={form.address}
                onChange={onChange}
                placeholder="Company address"
              />
              <AppSelect
                label="Your Role"
                name="role"
                value={form.role}
                onChange={onChange}
                options={roleOptions}
                placeholder="Select role"
              />
              <div>
                <div className="mb-2 text-sm font-medium text-slate-700">
                  Verification Document
                </div>
                <FileUploader
                  name="companyDocs"
                  accept="application/pdf,image/*"
                  icon={UploadCloud}
                  onChange={(file) => setDocFile(file)}
                  onClear={() => setDocFile(null)}
                  className="w-full"
                  dropzoneClassName="h-10 px-3 py-2 border border-dotted border-slate-200 rounded-lg"
                  defaultFileName={docFile?.name || ""}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
              >
                {submitting ? "Submitting..." : "Submit Company Profile"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-slate-800 mb-3 text-left">
          Your Companies
        </div>
        {loading ? (
          <div className="text-sm text-slate-500">Loading...</div>
        ) : companies.length ? (
          <div className="space-y-4">
            {companies.map((c) => (
              <div
                key={c._id}
                className="rounded-xl border border-slate-200 p-4 flex flex-col gap-2 text-left"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="font-semibold text-slate-800">{c.name}</div>
                  <span
                    className={`text-xs font-semibold ${
                      c.status === "approved"
                        ? "text-green-600"
                        : c.status === "rejected"
                        ? "text-red-600"
                        : "text-amber-600"
                    }`}
                  >
                    {String(c.status || "pending").toUpperCase()}
                  </span>
                </div>
                <div className="text-sm text-slate-600 flex flex-wrap items-center gap-2">
                  <Globe className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  <span>{c.website}</span>
                  <span className="text-slate-300">|</span>
                  <Phone className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  <span>{c.phone}</span>
                </div>
                <div className="text-sm text-slate-600 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[color:var(--brand-orange)]" />
                  <span>{c.address}</span>
                </div>
                {c.status === "approved" ? (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to={`/dashboard/companies/${c._id}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--brand-orange)]"
                    >
                      <Building2 className="h-4 w-4" />
                      View Company Profile
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                    <Link
                      to={`/dashboard/companies/${c._id}?tab=jobs`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
                    >
                      <Briefcase className="h-4 w-4" />
                      View Job Posts
                    </Link>
                    <Link
                      to={`/dashboard/companies/${c._id}?tab=create`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Create Job Post
                    </Link>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-slate-500">
                    Your submission has been received. Verification will take up
                    to 5 business days.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No company profiles yet.</div>
        )}
      </div>
    </div>
  );
}

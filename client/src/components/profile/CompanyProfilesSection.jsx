import React, { useEffect, useState } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, UploadCloud } from "lucide-react";
import { createCompanyProfile, fetchMyCompanies } from "@/services/companyService";
import { useSnackbar } from "notistack";
import CompanyProfile from "@/pages/company/CompanyProfile";

const roleOptions = ["Founder", "Co-founder", "HR", "Recruiter", "Employee"];
const documentTypeOptions = [
  "Certificate of Incorporation",
  "Articles of Organization (USA LLC)",
  "Business Registration Certificate",
  "Tax Registration Certificate (EIN / NTN)",
  "Sales Tax Certificate",
  "Trade License",
  "Certificate of Good Standing",
  "Other Government-Issued Document",
];

export default function CompanyProfilesSection({
  createOpen: createOpenProp,
  setCreateOpen: setCreateOpenProp,
  selectedCompanyId = "",
  selectedCompanyTab = "overview",
  onCompanyCountChange,
  onCompaniesLoaded,
}) {
  const { enqueueSnackbar } = useSnackbar();
  const [submitting, setSubmitting] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const isControlled = typeof createOpenProp !== "undefined";
  const createOpen = isControlled ? createOpenProp : internalCreateOpen;
  const setCreateOpen = isControlled ? setCreateOpenProp : setInternalCreateOpen;

  const [form, setForm] = useState({
    name: "",
    about: "",
    phone: "",
    website: "",
    address: "",
    role: "",
    documentType: "",
  });

  const loadCompanies = async () => {
    try {
      const rows = await fetchMyCompanies();
      if (typeof onCompanyCountChange === "function") onCompanyCountChange(rows?.length || 0);
      if (typeof onCompaniesLoaded === "function") onCompaniesLoaded(rows || []);
    } catch {
      if (typeof onCompaniesLoaded === "function") onCompaniesLoaded([]);
    }
  };

  useEffect(() => {
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.about ||
      !form.phone ||
      !form.website ||
      !form.address ||
      !form.role ||
      !form.documentType
    ) {
      enqueueSnackbar("Please fill all required fields", { variant: "warning" });
      return;
    }
    if (!docFile) {
      enqueueSnackbar("Please upload a verification document", { variant: "warning" });
      return;
    }
    if (!termsAccepted) {
      enqueueSnackbar("Please confirm authorization terms.", { variant: "warning" });
      return;
    }

    const body = new FormData();
    body.append("name", form.name);
    body.append("about", form.about);
    body.append("phone", form.phone);
    body.append("website", form.website);
    body.append("address", form.address);
    body.append("role", form.role);
    body.append("documentType", form.documentType);
    body.append("companyDocs", docFile);
    if (logoFile) body.append("companyLogo", logoFile);

    setSubmitting(true);
    try {
      const res = await createCompanyProfile(body);
      enqueueSnackbar(
        res?.message || "Your submission has been received. Verification will take up to 5 business days.",
        { variant: "success" }
      );
      setForm({
        name: "",
        about: "",
        phone: "",
        website: "",
        address: "",
        role: "",
        documentType: "",
      });
      setDocFile(null);
      setLogoFile(null);
      setTermsAccepted(false);
      setCreateOpen(false);
      await loadCompanies();
    } catch (e) {
      enqueueSnackbar(e?.response?.data?.message || "Failed to create company profile", {
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (createOpen) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Building2 className="h-5 w-5 text-[color:var(--brand-orange)]" />
          Create a Company Page
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <AppInput label="Company Name *" name="name" value={form.name} onChange={onChange} placeholder="Company name" />
            <AppInput label="Company Phone Number" name="phone" value={form.phone} onChange={onChange} placeholder="Company phone" />
            <AppInput label="Company Website *" name="website" value={form.website} onChange={onChange} placeholder="https://company.com" />
            <AppInput label="Company Address" name="address" value={form.address} onChange={onChange} placeholder="Company address" />

            <div className="text-left md:col-span-2">
              <div className="mb-1 block w-full text-left text-sm font-medium text-slate-700">Tagline</div>
              <Textarea
                name="about"
                value={form.about}
                onChange={onChange}
                placeholder="ex: An information services firm helping small businesses succeed."
                className="min-h-[72px]"
              />
            </div>

            <AppSelect label="Your Role *" name="role" value={form.role} onChange={onChange} options={roleOptions} placeholder="Select role" />

            <div className="text-left">
              <div className="mb-2 block w-full text-left text-sm font-medium text-slate-700">Company Logo</div>
              <FileUploader
                name="companyLogo"
                accept="image/*"
                icon={UploadCloud}
                onChange={(file) => setLogoFile(file)}
                onClear={() => setLogoFile(null)}
                className="w-full"
                contentAlign="left"
                showImagePreview={false}
                dropzoneClassName="h-10 px-3 py-2 border border-dotted border-slate-200 rounded-lg"
                defaultFileName={logoFile?.name || ""}
              />
            </div>

            <AppSelect
              label="Select Document Type *"
              name="documentType"
              value={form.documentType}
              onChange={onChange}
              options={documentTypeOptions}
              placeholder="Select document type"
            />

            <div className="text-left">
              <div className="mb-2 text-sm font-medium text-slate-700">Verification Document *</div>
              <FileUploader
                name="companyDocs"
                accept="application/pdf,image/*"
                icon={UploadCloud}
                onChange={(file) => setDocFile(file)}
                onClear={() => setDocFile(null)}
                className="w-full space-y-1"
                contentAlign="left"
                dropzoneClassName="h-10 w-full px-3 py-2 border border-slate-200 rounded-lg bg-white shadow-sm"
                defaultFileName={docFile?.name || ""}
              />
              <p className="mt-1 text-left text-xs text-slate-500">Accepted formats: PDF, JPG, PNG</p>
            </div>
          </div>

          <label className="mt-4 flex w-full items-start justify-start gap-2 text-left text-sm text-slate-600">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[color:var(--brand-orange)]"
            />
            <span className="text-left leading-6">
              I verify that I am an authorized representative of this company and have the right
              to act on its behalf in the creation and management of this page. The company and
              I agree to the additional terms for Pages.
            </span>
          </label>

          <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !termsAccepted}
                className="bg-[color:var(--brand-orange)] text-white hover:brightness-110"
              >
              {submitting ? "Submitting..." : "Submit for Verification"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-900">
        <Building2 className="h-5 w-5 text-[color:var(--brand-orange)]" />
        Company Page
      </div>
      {selectedCompanyId ? (
        <CompanyProfile companyId={selectedCompanyId} embedded initialTab={selectedCompanyTab || "overview"} />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Select a company from the sidebar to view its page.
        </div>
      )}
    </div>
  );
}

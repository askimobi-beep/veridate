// components/profile/ExperienceForm.jsx
import React, { useEffect, useRef, useState } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import { Save, UploadCloud } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BlockSwitch from "@/components/form/Switch";
import CreditText from "../creditshow/CreditBadge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosInstance from "@/utils/axiosInstance";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ------ dropdown options ------
const jobTitles = [
  "Software Engineer",
  "Senior Software Engineer",
  "Team Lead",
  "Project Manager",
  "Data Analyst",
  "Designer",
  "Other",
];

const industries = [
  "Software",
  "Finance",
  "Healthcare",
  "E-commerce",
  "Education",
  "Other",
];

const jobFunctionOptions = [
  "Software Development",
  "Data Analysis",
  "Project Management",
  "Marketing",
  "Sales",
  "Human Resources",
  "Finance",
  "Operations",
  "Other",
];

const skillOptions = [
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Python",
  "Django",
  "Java",
  "Spring",
  "SQL",
  "MongoDB",
  "AWS",
  "Azure",
  "Docker",
  "Kubernetes",
  "CI/CD",
  "UI/UX",
  "Data Analysis",
];

// fields editable even when row is locked
const EXPERIENCE_UNLOCKED = new Set([
  "endDate",
  "companyWebsite",
  "experienceLetterFile",
  "jobFunctions",
  "skills",
  "hiddenFields",
  "lineManagers",
]);

const isExpDisabled = (rowLocked, field) =>
  rowLocked && !EXPERIENCE_UNLOCKED.has(field);

// helpers for privacy toggles
const hasHidden = (row, key) =>
  Array.isArray(row.hiddenFields) && row.hiddenFields.includes(key);

const toggleHidden = (row, key, onUpdate) => {
  const curr = Array.isArray(row.hiddenFields) ? row.hiddenFields : [];
  const next = hasHidden(row, key)
    ? curr.filter((k) => k !== key)
    : [...curr, key];
  onUpdate("hiddenFields", next);
};

const companyWebsiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function ExperienceForm({
  experienceList,
  updateExperience,
  addExperience,
  removeExperience,
  locked, // section-level lock
  letterRefs, // refs array for per-row uploader
  expCreditByKey, // optional Map for credits
  companyOptions = [],
  saveExperience, // (index, row) -> row-wise save
  onAskConfirm, // (value, title, actionFn)
  isRowSaving, // (index) => boolean
}) {
  const [jobTitleQuery, setJobTitleQuery] = useState("");
  const [jobTitleOptions, setJobTitleOptions] = useState(jobTitles);
  const [jobTitleLoading, setJobTitleLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchTitles = async () => {
      try {
        setJobTitleLoading(true);
        const res = await axiosInstance.get("/job-titles", {
          params: { q: jobTitleQuery, limit: 100 },
        });
        const data = Array.isArray(res?.data?.data) ? res.data.data : [];
        if (active && data.length) {
          setJobTitleOptions(data);
        } else if (active && !jobTitleQuery) {
          setJobTitleOptions(jobTitles);
        }
      } catch {
        if (active) setJobTitleOptions(jobTitles);
      } finally {
        if (active) setJobTitleLoading(false);
      }
    };

    fetchTitles();
    return () => {
      active = false;
    };
  }, [jobTitleQuery]);

  const SearchableMultiSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
    showSelectedBox = false,
    triggerText,
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const selected = Array.isArray(value) ? value : [];
    const filtered = (options || []).filter((opt) =>
      String(opt).toLowerCase().includes(query.trim().toLowerCase())
    );

    const toggle = (opt) => {
      if (disabled) return;
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange(next);
    };

    const remove = (opt) => {
      if (disabled) return;
      onChange(selected.filter((v) => v !== opt));
    };

    const displayText =
      typeof triggerText === "string"
        ? triggerText
        : selected.length
        ? selected.join(", ")
        : placeholder;

    return (
      <div className="space-y-1 w-full">
        {label ? (
          <Label className="text-sm font-medium text-slate-700 text-left w-full inline-flex items-center gap-2">
            {label}
          </Label>
        ) : null}
        <Popover modal={false} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm ${
                disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
              }`}
            >
              {displayText}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] bg-white p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-10"
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {filtered.length ? (
                filtered.map((opt) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle(opt)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        active ? "brand-orange-soft brand-orange" : "text-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                          active
                            ? "border-[color:var(--brand-orange)] bg-[color:var(--brand-orange)] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500">
                  No matches
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {showSelectedBox && (
          <div className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            {selected.length ? (
              <div className="flex flex-wrap gap-2">
                {selected.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                  >
                    {item}
                    <button
                      type="button"
                      className="ml-1 text-slate-400 hover:text-slate-700"
                      onClick={() => remove(item)}
                      aria-label={`Remove ${item}`}
                      disabled={disabled}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-slate-400">No skills selected</span>
            )}
          </div>
        )}
      </div>
    );
  };

  const SearchableSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
    onSearch,
    loading,
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef(null);
    const filtered = (options || []).filter((opt) =>
      String(opt).toLowerCase().includes(query.trim().toLowerCase())
    );

    useEffect(() => {
      onSearch?.(query);
    }, [query, onSearch]);

    useEffect(() => {
      if (open && inputRef.current) {
        setTimeout(() => {
          inputRef.current?.focus?.();
        }, 0);
      }
    }, [open]);

    return (
      <div className="space-y-1 w-full">
        {label ? (
          <Label className="text-sm font-medium text-slate-700 text-left w-full inline-flex items-center gap-2">
            {label}
          </Label>
        ) : null}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm ${
                disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
              }`}
            >
              {value || placeholder}
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-[--radix-popover-trigger-width] bg-white p-2"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if (e.target && e.currentTarget.contains(e.target)) {
                e.preventDefault();
              }
            }}
          >
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-10"
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="px-2 py-2 text-xs text-gray-500">
                  Loading...
                </div>
              ) : null}
              {filtered.length ? (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                      value === opt
                        ? "brand-orange-soft brand-orange"
                        : "text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!query.trim()) return;
                    onChange(query.trim());
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-slate-700"
                >
                  Use "{query.trim()}"
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };
  // ---- Line Manager multi-select with API fetch ----
  const LineManagerSelect = ({ company, startDate, endDate, isPresent, value, onChange, disabled }) => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");

    useEffect(() => {
      if (!company || !startDate) {
        setCandidates([]);
        return;
      }
      let active = true;
      const fetchCandidates = async () => {
        setLoading(true);
        try {
          const params = { company, startDate };
          if (endDate && !isPresent) params.endDate = endDate;
          const res = await axiosInstance.get("/profile/line-manager-candidates", { params });
          if (active) setCandidates(res.data?.candidates || []);
        } catch {
          if (active) setCandidates([]);
        } finally {
          if (active) setLoading(false);
        }
      };
      fetchCandidates();
      return () => { active = false; };
    }, [company, startDate, endDate, isPresent]);

    const selected = Array.isArray(value) ? value : [];
    const filtered = candidates.filter((c) => {
      const label = `${c.name} ${c.jobTitle}`.toLowerCase();
      return label.includes(query.trim().toLowerCase());
    });

    const toggle = (userId) => {
      if (disabled) return;
      const next = selected.includes(userId)
        ? selected.filter((id) => id !== userId)
        : [...selected, userId];
      onChange(next);
    };

    const remove = (userId) => {
      if (disabled) return;
      onChange(selected.filter((id) => id !== userId));
    };

    const selectedNames = selected
      .map((id) => candidates.find((c) => c.userId === id))
      .filter(Boolean);

    return (
      <div className="space-y-1 w-full">
        <Label className="text-sm font-medium text-slate-700 text-left w-full inline-flex items-center gap-2">
          Reporting Line Manager
        </Label>
        <Popover modal={false} open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled || (!company || !startDate)}
              className={`h-12 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm ${
                disabled || !company || !startDate
                  ? "bg-slate-100 text-slate-500 cursor-not-allowed"
                  : ""
              }`}
            >
              {!company || !startDate
                ? "Set company & start date first"
                : selected.length
                ? `${selected.length} manager${selected.length > 1 ? "s" : ""} selected`
                : "Select line manager(s)"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] bg-white p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search managers..."
              className="h-10"
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {loading ? (
                <div className="px-2 py-2 text-xs text-gray-500">Loading...</div>
              ) : filtered.length ? (
                filtered.map((c) => {
                  const active = selected.includes(c.userId);
                  return (
                    <button
                      key={c.userId}
                      type="button"
                      onClick={() => toggle(c.userId)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        active ? "brand-orange-soft brand-orange" : "text-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                          active
                            ? "border-[color:var(--brand-orange)] bg-[color:var(--brand-orange)] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span>
                        {c.name}{c.jobTitle ? ` - ${c.jobTitle}` : ""}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500">
                  {candidates.length === 0 && !loading
                    ? "No eligible managers found for this company & date range"
                    : "No matches"}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        {selectedNames.length > 0 && (
          <div className="mt-2 min-h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm">
            <div className="flex flex-wrap gap-2">
              {selectedNames.map((c) => (
                <span
                  key={c.userId}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
                >
                  {c.name}{c.jobTitle ? ` - ${c.jobTitle}` : ""}
                  <button
                    type="button"
                    className="ml-1 text-slate-400 hover:text-slate-700"
                    onClick={() => remove(c.userId)}
                    aria-label={`Remove ${c.name}`}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const [creditInfoOpen, setCreditInfoOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  // derive "Other" mode for selects

  return (
    <>
      <Dialog open={creditInfoOpen} onOpenChange={setCreditInfoOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Credits guide</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-700">
            A short walkthrough on how experience verification credits work is
            coming soon.
          </p>
        </DialogContent>
      </Dialog>

      <AnimatePresence initial={false}>
        {experienceList.map((exp, index) => {
          // ✅ instant row lock (local) OR section lock when server-locked
          const rowLocked = !!exp?.rowLocked || (!!exp?._id && locked);
          const allowEdit = rowLocked && editingRow === index;
          const savingThis =
            typeof isRowSaving === "function" ? isRowSaving(index) : false;

          // dropdown glue for "Other"
          const baseCompanies = Array.isArray(companyOptions)
            ? companyOptions
            : [];
          const companyChoices =
            exp.company && !baseCompanies.includes(exp.company)
              ? [...baseCompanies, exp.company]
              : baseCompanies;

          const isCompanyWebsiteValid = companyWebsiteRegex.test(
            (exp.companyWebsite || "").trim()
          );

          const key = exp.companyKey || norm(exp.company);
          const bucket =
            key && expCreditByKey?.get ? expCreditByKey.get(key) : null;

          // compute credits for simple text line
          const available = bucket?.available ?? 0;
          const used = bucket?.used ?? 0;
          const total =
            typeof bucket?.total === "number" ? bucket.total : available + used;
          const creditLabelCandidate = [
            bucket?.company,
            bucket?.companyName,
            exp.company,
          ].find((val) => typeof val === "string" && val.trim().length > 0);
          const creditLabel = creditLabelCandidate
            ? creditLabelCandidate.trim()
            : "";

          const verifications = Array.isArray(exp?.verifications)
            ? exp.verifications
            : [];
          const verifiedBy = Array.isArray(exp?.verifiedBy)
            ? exp.verifiedBy
            : [];
          const uniqueVerifierIds = new Set(
            [
              ...verifications.map((entry) =>
                typeof entry?.user === "string"
                  ? entry.user
                  : entry?.user?._id || entry?.user?.id
              ),
              ...verifiedBy.map((val) =>
                typeof val === "string" ? val : val?._id || val?.id
              ),
            ].filter(Boolean)
          );
          const verifyCount =
            typeof exp?.verifyCount === "number" ? exp.verifyCount : 0;
          const totalVerifiers = Math.max(
            verifyCount,
            uniqueVerifierIds.size,
            verifications.length,
            verifiedBy.length
          );

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header */}
              <div className="mb-1 text-left">
                <div className="text-lg font-bold text-slate-900">
                  {exp?._id && (exp.jobTitle || "").trim()
                    ? exp.jobTitle
                    : `Experience ${index + 1}`}
                </div>
              </div>

              <div className="text-sm text-gray-600 text-start">
                {totalVerifiers > 0
                  ? `${totalVerifiers} ${
                      totalVerifiers === 1 ? "user has" : "users have"
                    } verified this experience.`
                  : "No users have verified this experience yet."}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="flex flex-col gap-2">
                  <SearchableSelect
                    label="Job Title"
                    options={jobTitleOptions}
                    value={exp.jobTitle}
                    onChange={(val) => updateExperience(index, "jobTitle", val)}
                    placeholder="Select job title"
                    disabled={rowLocked}
                    onSearch={(q) => setJobTitleQuery(q)}
                    loading={jobTitleLoading}
                  />
                </div>

                {/* Company (dropdown + optional "Other" input) */}
                <div className="flex flex-col gap-2">
                  <AppSelect
                    name={`company-${index}`}
                    label="Company"
                    value={exp.company || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateExperience(index, "company", val);
                    }}
                    options={companyChoices}
                    disabled={rowLocked}
                  />
                </div>

                <AppInput
                  name={`startDate-${index}`}
                  label="Start Date"
                  type="date"
                  value={exp.startDate}
                  onChange={(e) =>
                    updateExperience(index, "startDate", e.target.value)
                  }
                  placeholder="Start date"
                  disabled={rowLocked}
                />

                <AppInput
                  name={`endDate-${index}`}
                  label={
                    <div className="flex items-center justify-between w-full">
                      <span>End Date</span>
                      <span className="inline-flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!exp.isPresent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateExperience(index, "isPresent", checked);
                              if (checked) updateExperience(index, "endDate", "");
                            }}
                            disabled={rowLocked && !allowEdit}
                            className="h-4 w-4 rounded-md border border-gray-300 appearance-none transition-colors duration-200 shrink-0 bg-white checked:bg-gray-800 checked:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                          />
                          {exp.isPresent ? (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white">
                              ✓
                            </span>
                          ) : null}
                        </label>
                        <span
                          className={`select-none text-xs ${
                            exp.isPresent ? "text-gray-800 font-medium" : "text-gray-500"
                          }`}
                        >
                          Currently working
                        </span>
                      </span>
                    </div>
                  }
                  type="date"
                  value={exp.endDate}
                  onChange={(e) =>
                    updateExperience(index, "endDate", e.target.value)
                  }
                  placeholder="End date"
                  disabled={(rowLocked && !allowEdit) || !!exp.isPresent}
                />

                <AppInput
                  name={`companyWebsite-${index}`}
                  label="Company Website"
                  type="url"
                  value={exp.companyWebsite}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    updateExperience(index, "companyWebsite", val);
                    updateExperience(
                      index,
                      "error_companyWebsite",
                      val && !companyWebsiteRegex.test(val)
                        ? "Only valid website URLs allowed (e.g. https://company.com/)"
                        : ""
                    );
                  }}
                  placeholder="https://company.com"
                  disabled={rowLocked && !allowEdit}
                  error={exp.error_companyWebsite}
                />

                <AppSelect
                  name={`industry-${index}`}
                  label="Industry"
                  value={exp.industry}
                  onChange={(e) =>
                    updateExperience(index, "industry", e.target.value)
                  }
                  options={industries}
                  disabled={rowLocked}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:col-span-2">
                  <SearchableMultiSelect
                    label="Job Functions"
                    options={jobFunctionOptions}
                    value={exp.jobFunctions || []}
                    onChange={(updated) =>
                      updateExperience(index, "jobFunctions", updated)
                    }
                    placeholder="Select job functions"
                    triggerText="Select job functions"
                    showSelectedBox
                    disabled={rowLocked && !allowEdit}
                  />

                  <SearchableMultiSelect
                    label="Skills"
                    options={skillOptions}
                    value={exp.skills || []}
                    onChange={(updated) => updateExperience(index, "skills", updated)}
                    placeholder="Select skills"
                    triggerText="Select skills"
                    showSelectedBox
                    disabled={rowLocked && !allowEdit}
                  />
                </div>

                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                    <label className="text-sm font-medium text-slate-700">
                      Upload Experience Letter
                    </label>
                    <div className="flex items-center gap-2">
                      <BlockSwitch
                        checked={hasHidden(exp, "experienceLetterFile")}
                        onChange={() =>
                          toggleHidden(
                            exp,
                            "experienceLetterFile",
                            (field, val) => updateExperience(index, field, val)
                          )
                        }
                        className={
                          rowLocked && !EXPERIENCE_UNLOCKED.has("hiddenFields")
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <FileUploader
                    ref={(el) => {
                      if (letterRefs?.current) letterRefs.current[index] = el;
                    }}
                    name={`experienceLetterFile-${index}`}
                    accept="application/pdf"
                    icon={UploadCloud}
                    onChange={(file) =>
                      updateExperience(index, "experienceLetterFile", file)
                    }
                    onClear={() => updateExperience(index, "experienceLetterFile", "")}
                    disabled={rowLocked && !allowEdit}
                    className="w-full"
                    dropzoneClassName="h-10 px-3 py-2 border border-dotted border-slate-200 rounded-lg"
                    defaultFileName={
                      typeof exp?.experienceLetterFile === "string"
                        ? exp.experienceLetterFile
                        : ""
                    }
                  />
                </div>

                {/* Reporting Line Manager */}
                <div className="md:col-span-2">
                  <LineManagerSelect
                    company={exp.company}
                    startDate={exp.startDate}
                    endDate={exp.endDate}
                    isPresent={exp.isPresent}
                    value={exp.lineManagers || []}
                    onChange={(updated) => updateExperience(index, "lineManagers", updated)}
                    disabled={rowLocked && !allowEdit}
                  />
                </div>

              </div>

              <div className="rounded-xl p-0">
                <div className="mb-3 h-px w-full bg-slate-200/80" />
                <div className="flex w-full flex-wrap items-start justify-start gap-3">
                  {bucket ? (
                    <CreditText
                      label={creditLabel}
                      context="experience"
                      available={available}
                      used={used}
                      total={total}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      No verification credits recorded yet for this experience.
                    </span>
                  )}
                </div>
              </div>

              {/* Row actions */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {!rowLocked && (
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation(); // don't toggle accordion
                        removeExperience(index);
                      }}
                    >
                      Remove
                    </Button>
                  )}

                  {rowLocked && !allowEdit ? (
                    <>
                      <Button type="button" disabled>
                        Saved
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingRow(index);
                        }}
                      >
                        Edit
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      disabled={savingThis || !isCompanyWebsiteValid}
                      onClick={(e) => {
                        e.stopPropagation(); // don't toggle accordion

                        const val = (exp.companyWebsite || "").trim();
                        if (!companyWebsiteRegex.test(val)) {
                          updateExperience(
                            index,
                            "error_companyWebsite",
                            "Only valid website URLs allowed (e.g. https://company.com/)"
                          );
                          return;
                        }
                        updateExperience(index, "error_companyWebsite", "");

                        onAskConfirm?.(
                          `experience:${index}`,
                          `Experience ${index + 1}`,
                          () => saveExperience(index, experienceList[index])
                        );
                        setEditingRow(null);
                      }}
                      className="inline-flex items-center gap-2 bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] text-white"
                    >
                      <Save className="h-4 w-4" />
                      {savingThis ? "Saving..." : "Save"}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div layout>
        <Button
          type="button"
          className="brand-orange-soft text-[color:var(--brand-orange)] hover:brand-orange-soft-strong"
          onClick={(e) => {
            e.stopPropagation();
            addExperience();
          }}
        >
          + Add Experience
        </Button>
      </motion.div>
    </>
  );
}


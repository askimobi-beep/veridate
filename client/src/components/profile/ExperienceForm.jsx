// components/profile/ExperienceForm.jsx
import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BlockSwitch from "@/components/form/Switch";
import CreditText from "../creditshow/CreditBadge";

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

const companies = ["Google", "Microsoft", "Amazon", "Meta", "Apple", "Other"];

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
];

// fields editable even when row is locked
const EXPERIENCE_UNLOCKED = new Set([
  "endDate",
  "companyWebsite",
  "experienceLetterFile",
  "jobFunctions",
  "hiddenFields",
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
  saveExperience, // (index, row) -> row-wise save
  onAskConfirm, // (value, title, actionFn)
  isRowSaving, // (index) => boolean
}) {
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");

  // derive "Other" mode for selects
  const isOtherSelected = (list, value) => !!value && !list.includes(value);

  return (
    <>
      <AnimatePresence initial={false}>
        {experienceList.map((exp, index) => {
          // ✅ instant row lock (local) OR section lock when server-locked
          const rowLocked = !!exp?.rowLocked || (!!exp?._id && locked);
          const savingThis =
            typeof isRowSaving === "function" ? isRowSaving(index) : false;

          // dropdown glue for "Other"
          const jobTitleOther = isOtherSelected(jobTitles, exp.jobTitle);
          const companyOther = isOtherSelected(companies, exp.company);

          const jobTitleSelectValue = jobTitleOther
            ? "Other"
            : exp.jobTitle || "";
          const companySelectValue = companyOther ? "Other" : exp.company || "";

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

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
             
              {/* Row header */}
              <div className="mb-1 text-left">
                <div className="text-lg font-bold text-gray-900">
                  {exp?._id && (exp.jobTitle || "").trim()
                    ? exp.jobTitle
                    : `Experience ${index + 1}`}
                </div>

                {/* Plain text credits under the heading */}
                {bucket ? (
                  <div className="mt-0.5 text-left">
                    <CreditText
                      available={available}
                      used={used}
                      total={total}
                    />
                  </div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Job Title (dropdown + optional "Other" input) */}
                <div className="flex flex-col gap-2">
                  <AppSelect
                    name={`jobTitle-${index}`}
                    label="Job Title"
                    value={jobTitleSelectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        if (!jobTitleOther) {
                          updateExperience(index, "jobTitle", "");
                        }
                      } else {
                        updateExperience(index, "jobTitle", val);
                      }
                    }}
                    options={jobTitles}
                    disabled={isExpDisabled(rowLocked, "jobTitle")}
                  />
                  {jobTitleOther && (
                    <AppInput
                      name={`jobTitleOther-${index}`}
                      label="Custom Job Title"
                      value={exp.jobTitle || ""}
                      onChange={(e) =>
                        updateExperience(index, "jobTitle", e.target.value)
                      }
                      placeholder="Type your job title"
                      disabled={isExpDisabled(rowLocked, "jobTitle")}
                    />
                  )}
                </div>

                {/* Company (dropdown + optional "Other" input) */}
                <div className="flex flex-col gap-2">
                  <AppSelect
                    name={`company-${index}`}
                    label="Company"
                    value={companySelectValue}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "Other") {
                        if (!companyOther) {
                          updateExperience(index, "company", "");
                        }
                      } else {
                        updateExperience(index, "company", val);
                      }
                    }}
                    options={companies}
                    disabled={isExpDisabled(rowLocked, "company")}
                  />
                  {companyOther && (
                    <AppInput
                      name={`companyOther-${index}`}
                      label="Custom Company"
                      value={exp.company || ""}
                      onChange={(e) =>
                        updateExperience(index, "company", e.target.value)
                      }
                      placeholder="Type your company"
                      disabled={isExpDisabled(rowLocked, "company")}
                    />
                  )}
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
                  label="End Date"
                  type="date"
                  value={exp.endDate}
                  onChange={(e) =>
                    updateExperience(index, "endDate", e.target.value)
                  }
                  placeholder="End date"
                  disabled={isExpDisabled(rowLocked, "endDate")}
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
                  disabled={isExpDisabled(rowLocked, "companyWebsite")}
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
                  disabled={isExpDisabled(rowLocked, "industry")}
                />

                <div className="md:col-span-2">
                  <CheckboxGroup
                    title="Job Functions"
                    options={jobFunctionOptions}
                    selected={exp.jobFunctions || []}
                    onChange={(updated) =>
                      updateExperience(index, "jobFunctions", updated)
                    }
                    disabled={isExpDisabled(rowLocked, "jobFunctions")}
                  />
                </div>

                {/* Full-width experience letter uploader with switch header */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Upload Experience Letter (PDF / Image)
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 select-none">
                        {hasHidden(exp, "experienceLetterFile")
                          ? "Hidden"
                          : "Visible"}
                      </span>
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
                    accept="application/pdf,image/*"
                    icon={FileText}
                    onChange={(file) =>
                      updateExperience(index, "experienceLetterFile", file)
                    }
                    disabled={isExpDisabled(rowLocked, "experienceLetterFile")}
                    className="w-full"
                  />
                </div>
              </div>
              {/* Row actions */}
              <div className="flex justify-end gap-3 pt-1">
                {!rowLocked && (
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation(); // don’t toggle accordion
                      removeExperience(index);
                    }}
                  >
                    Remove
                  </Button>
                )}

                <Button
                  type="button"
                  disabled={savingThis || !isCompanyWebsiteValid}
                  onClick={(e) => {
                    e.stopPropagation(); // don’t toggle accordion

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
                  }}
                  className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Save className="h-4 w-4" />
                  {savingThis ? "Saving..." : "Save"}
                </Button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div layout>
        <Button
          type="button"
          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
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

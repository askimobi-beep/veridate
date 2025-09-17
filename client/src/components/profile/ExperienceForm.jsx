import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Button } from "@/components/ui/button";
import { FileText, Building2, BriefcaseBusiness, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// change this import if your switch lives elsewhere
import BlockSwitch from "@/components/form/Switch";
import CreditBadges from "../creditshow/CreditBadge";

// demo options — replace with your actual lists if you have them
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

// enforce the whitelist you allowed on backend
const EXPERIENCE_UNLOCKED = new Set([
  "endDate",
  "companyWebsite",
  "experienceLetterFile",
  "jobFunctions",
  "hiddenFields",
]);
const isDisabled = (rowLocked, field) =>
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

const companyWebsiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/$/;

export default function ExperienceForm({
  experienceList,
  updateExperience,
  addExperience,
  removeExperience,
  locked,
  letterRefs,
  expCreditByKey,
  saveExperience, // 👈 NEW
  onAskConfirm, // 👈 NEW
  saving, // 👈 NEW
}) {
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  return (
    <>
      <AnimatePresence initial={false}>
        {experienceList.map((exp, index) => {
          const rowLocked = !!exp._id && locked;
          const key = exp.companyKey || norm(exp.company);
          const bucket =
            key && expCreditByKey?.get ? expCreditByKey.get(key) : null;
          const isCompanyWebsiteValid = companyWebsiteRegex.test(
            (exp.companyWebsite || "").trim()
          );

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header (title only) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    Experience {index + 1}
                  </span>
                  {bucket ? (
                    <CreditBadges
                      label={bucket.company || "—"}
                      available={bucket.available ?? 0}
                      used={bucket.used ?? 0}
                      total={bucket.total}
                    />
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppSelect
                  name={`jobTitle`}
                  label="Job Title"
                  icon={BriefcaseBusiness}
                  value={exp.jobTitle}
                  onChange={(e) =>
                    updateExperience(index, "jobTitle", e.target.value)
                  }
                  options={jobTitles}
                  disabled={isDisabled(rowLocked, "jobTitle")}
                />

                <AppSelect
                  name={`company`}
                  label="Company"
                  icon={Building2}
                  value={exp.company}
                  onChange={(e) =>
                    updateExperience(index, "company", e.target.value)
                  }
                  options={companies}
                  disabled={isDisabled(rowLocked, "company")}
                />

                <AppInput
                  name={`startDate`}
                  label="Start Date"
                  type="date"
                  value={exp.startDate}
                  onChange={(e) =>
                    updateExperience(index, "startDate", e.target.value)
                  }
                  placeholder="Select date"
                  disabled={isDisabled(rowLocked, "startDate")}
                />

                <AppInput
                  name={`endDate`}
                  label="End Date"
                  type="date"
                  value={exp.endDate}
                  onChange={(e) =>
                    updateExperience(index, "endDate", e.target.value)
                  }
                  placeholder="Select date"
                  disabled={isDisabled(rowLocked, "endDate")}
                />
                <AppInput
                  name={`companyWebsite`}
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
                  placeholder="https://company.com/"
                  disabled={isDisabled(rowLocked, "companyWebsite")}
                  error={exp.error_companyWebsite}
                  pattern="^https:\/\/[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,}\/$"
                />

                <AppSelect
                  name={`industry`}
                  label="Industry"
                  value={exp.industry}
                  onChange={(e) =>
                    updateExperience(index, "industry", e.target.value)
                  }
                  options={industries}
                  disabled={isDisabled(rowLocked, "industry")}
                />

                <div className="md:col-span-2">
                  <CheckboxGroup
                    title="Job Functions"
                    options={jobFunctionOptions}
                    selected={exp.jobFunctions || []}
                    onChange={(updated) =>
                      updateExperience(index, "jobFunctions", updated)
                    }
                    disabled={isDisabled(rowLocked, "jobFunctions")}
                  />
                </div>

                {/* Full-width experience letter uploader with switch header */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Upload Experience Letter (PDF / PNG / JPG)
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
                    ref={(el) => (letterRefs.current[index] = el)}
                    // omit label here to avoid duplicate header; if FileUploader *requires* label, pass it
                    // label="Upload Experience Letter (PDF / PNG / JPG)"
                    name={`experienceLetterFile-${index}`}
                    accept="application/pdf,image/*"
                    icon={FileText}
                    onChange={(file) =>
                      updateExperience(index, "experienceLetterFile", file)
                    }
                    disabled={isDisabled(rowLocked, "experienceLetterFile")}
                    className="w-full"
                  />
                </div>
              </div>

              {!rowLocked && (
                <div className="flex justify-end gap-3 pt-1">
                  {!rowLocked && (
                    <>
                      <Button
                        variant="destructive"
                        type="button"
                        onClick={() => removeExperience(index)}
                      >
                        Remove
                      </Button>

                      <Button
                        type="button"
                        disabled={saving || !isCompanyWebsiteValid}
                        onClick={() => {
                          const val = (exp.companyWebsite || "").trim();
                          if (!companyWebsiteRegex.test(val)) {
                            updateExperience(
                              index,
                              "error_companyWebsite",
                              "Only valid website URLs allowed (e.g. https://company.com/)"
                            );
                            return; // ⛔ block save + confirm
                          }

                          // clear any stale error
                          updateExperience(index, "error_companyWebsite", "");

                          onAskConfirm?.("experience", "Experience", () =>
                            saveExperience(index, experienceList[index])
                          );
                        }}
                        className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        <Save className="h-4 w-4" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* always visible */}
      <motion.div layout>
        <Button
          type="button"
          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
          onClick={addExperience}
        >
          + Add Experience
        </Button>
      </motion.div>
    </>
  );
}

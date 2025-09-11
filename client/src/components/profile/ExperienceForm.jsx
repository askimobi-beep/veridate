import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Button } from "@/components/ui/button";
import { FileText, Building2, BriefcaseBusiness } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// change this import if your switch lives elsewhere
import BlockSwitch from "@/components/form/Switch";

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

export default function ExperienceForm({
  experienceList,
  updateExperience,
  addExperience,
  removeExperience,
  locked,
  letterRefs,
}) {
  return (
    <>
      <AnimatePresence initial={false}>
        {experienceList.map((exp, index) => {
          const rowLocked = !!exp._id && locked;

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header (title only) */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">
                  Experience {index + 1}
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
                  pattern="https?://.*"
                  title="URL must start with http:// or https://"
                  value={exp.companyWebsite}
                  onChange={(e) =>
                    updateExperience(index, "companyWebsite", e.target.value)
                  }
                  onBlur={(e) => {
                    let v = e.target.value.trim();
                    if (!v) {
                      e.target.setCustomValidity("");
                      return;
                    }
                    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
                    let ok = true;
                    try {
                      new URL(v);
                    } catch {
                      ok = false;
                    }
                    if (!ok) {
                      e.target.setCustomValidity(
                        "Enter a valid URL starting with http:// or https://"
                      );
                      e.target.reportValidity();
                      return;
                    }
                    e.target.setCustomValidity("");
                    updateExperience(index, "companyWebsite", v);
                  }}
                  onInvalid={(e) => {
                    e.target.setCustomValidity(
                      "Enter a valid URL starting with http:// or https://"
                    );
                  }}
                  onInput={(e) => e.target.setCustomValidity("")}
                  placeholder="https://company.com"
                  disabled={isDisabled(rowLocked, "companyWebsite")}
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
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    type="button"
                    onClick={() => removeExperience(index)}
                  >
                    Remove Experience
                  </Button>
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

import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Button } from "@/components/ui/button";
import { FileText, Building2, BriefcaseBusiness, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
const isDisabled = (rowLocked, field) => rowLocked && !EXPERIENCE_UNLOCKED.has(field);

// helpers for privacy toggles
const hasHidden = (row, key) =>
  Array.isArray(row.hiddenFields) && row.hiddenFields.includes(key);

const toggleHidden = (row, key, onUpdate) => {
  const curr = Array.isArray(row.hiddenFields) ? row.hiddenFields : [];
  const next = hasHidden(row, key) ? curr.filter((k) => k !== key) : [...curr, key];
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
              {/* Row header with privacy toggle */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">Experience {index + 1}</div>

                <button
                  type="button"
                  className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition
                    ${hasHidden(exp, "experienceLetterFile")
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                  onClick={() =>
                    toggleHidden(exp, "experienceLetterFile", (field, val) =>
                      updateExperience(index, field, val)
                    )
                  }
                  disabled={rowLocked && !EXPERIENCE_UNLOCKED.has("hiddenFields")}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {hasHidden(exp, "experienceLetterFile") ? "Letter hidden" : "Hide experience letter"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppSelect
                  name={`jobTitle`}
                  label="Job Title"
                  icon={BriefcaseBusiness}
                  value={exp.jobTitle}
                  onChange={(e) => updateExperience(index, "jobTitle", e.target.value)}
                  options={jobTitles}
                  disabled={isDisabled(rowLocked, "jobTitle")}
                />
                <AppSelect
                  name={`company`}
                  label="Company"
                  icon={Building2}
                  value={exp.company}
                  onChange={(e) => updateExperience(index, "company", e.target.value)}
                  options={companies}
                  disabled={isDisabled(rowLocked, "company")}
                />

                <AppInput
                  name={`startDate`}
                  label="Start Date"
                  type="date"
                  value={exp.startDate}
                  onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                  placeholder="Select date"
                  disabled={isDisabled(rowLocked, "startDate")}
                />

                <AppInput
                  // name={`endDate-${index}`}
                  name={`endDate`}
                  label="End Date"
                  type="date"
                  value={exp.endDate}
                  onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                  placeholder="Select date"
                  disabled={isDisabled(rowLocked, "endDate")}
                />

                <AppInput
                  name={`companyWebsite`}
                  label="Company Website"
                  value={exp.companyWebsite}
                  onChange={(e) => updateExperience(index, "companyWebsite", e.target.value)}
                  placeholder="https://company.com"
                  disabled={isDisabled(rowLocked, "companyWebsite")}
                />

                <FileUploader
                  ref={(el) => (letterRefs.current[index] = el)}
                  label="Upload Experience Letter (PDF / PNG / JPG)"
                  name={`experienceLetterFile-${index}`}
                  accept="application/pdf,image/*"
                  icon={FileText}
                  onChange={(file) => updateExperience(index, "experienceLetterFile", file)}
                  disabled={isDisabled(rowLocked, "experienceLetterFile")}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CheckboxGroup
                  title="Job Functions"
                  options={jobFunctionOptions}
                  selected={exp.jobFunctions || []}
                  onChange={(updated) => updateExperience(index, "jobFunctions", updated)}
                  disabled={isDisabled(rowLocked, "jobFunctions")}
                />

                <AppSelect
                  name={`industry`}
                  label="Industry"
                  value={exp.industry}
                  onChange={(e) => updateExperience(index, "industry", e.target.value)}
                  options={industries}
                  disabled={isDisabled(rowLocked, "industry")}
                />
              </div>

              {!rowLocked && (
                <div className="flex justify-end">
                  <Button variant="destructive" type="button" onClick={() => removeExperience(index)}>
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

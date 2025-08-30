// components/profile/EducationForm.jsx
// FULL component (only button label text changed)

import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import { FileText, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const degreeOptions = [
  "Bachelor of Science",
  "Bachelor of Arts",
  "Master of Science",
  "Master of Arts",
  "PhD",
  "Associate Degree",
  "Diploma",
  "Other",
];

const instituteOptions = [
  "University of Punjab",
  "Lahore University of Management Sciences (LUMS)",
  "University of Karachi",
  "Quaid-i-Azam University",
  "Aga Khan University",
  "COMSATS University",
  "University of Engineering and Technology",
  "Other",
];

// keep these
const EDUCATION_UNLOCKED = new Set(["endDate", "instituteWebsite", "degreeFile", "hiddenFields"]);
const isEduDisabled = (rowLocked, field) => rowLocked && !EDUCATION_UNLOCKED.has(field);

// helpers for privacy toggles
const hasHidden = (row, key) =>
  Array.isArray(row.hiddenFields) && row.hiddenFields.includes(key);

const toggleHidden = (row, key, onUpdate) => {
  const curr = Array.isArray(row.hiddenFields) ? row.hiddenFields : [];
  const next = hasHidden(row, key) ? curr.filter((k) => k !== key) : [...curr, key];
  onUpdate("hiddenFields", next);
};

export default function EducationForm({
  educationList,
  updateEducation,
  addEducation,
  removeEducation,
  locked,
  degreeRefs,
}) {
  return (
    <>
      <AnimatePresence initial={false}>
        {educationList.map((edu, index) => {
          const rowLocked = !!edu._id && locked;

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header with privacy toggle */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">Education {index + 1}</div>

                <button
                  type="button"
                  className={`inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border transition
                    ${hasHidden(edu, "degreeFile")
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                  onClick={() =>
                    toggleHidden(edu, "degreeFile", (field, val) =>
                      updateEducation(index, field, val)
                    )
                  }
                  disabled={rowLocked && !EDUCATION_UNLOCKED.has("hiddenFields")}
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  {/* CHANGED: label reflects the actual hidden key */}
                  {hasHidden(edu, "degreeFile") ? "Degree file hidden" : "Hide degree file"}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppSelect
                  name={`degreeTitle-${index}`}
                  label="Degree Title"
                  labelText="Degree"
                  value={edu.degreeTitle}
                  onChange={(e) => updateEducation(index, "degreeTitle", e.target.value)}
                  options={degreeOptions}
                  disabled={isEduDisabled(rowLocked, "degreeTitle")}
                />

                <AppSelect
                  name={`institute-${index}`}
                  label="Institute"
                  labelText="Institute"
                  value={edu.institute}
                  onChange={(e) => updateEducation(index, "institute", e.target.value)}
                  options={instituteOptions}
                  disabled={isEduDisabled(rowLocked, "institute")}
                />

                <AppInput
                  name={`startDate-${index}`}
                  label="Start Date"
                  type="date"
                  value={edu.startDate}
                  onChange={(e) => updateEducation(index, "startDate", e.target.value)}
                  placeholder="Start date"
                  disabled={rowLocked}
                />

                <AppInput
                  name={`endDate-${index}`}
                  label="End Date"
                  type="date"
                  value={edu.endDate}
                  onChange={(e) => updateEducation(index, "endDate", e.target.value)}
                  placeholder="End date"
                  disabled={isEduDisabled(rowLocked, "endDate")}
                />

                <AppInput
                  name={`instituteWebsite-${index}`}
                  label="Institute Website"
                  value={edu.instituteWebsite}
                  onChange={(e) => updateEducation(index, "instituteWebsite", e.target.value)}
                  placeholder="https://www.institute.edu"
                  disabled={isEduDisabled(rowLocked, "instituteWebsite")}
                />

                <FileUploader
                  ref={(el) => (degreeRefs.current[index] = el)}
                  label="Degree File (PDF / Image)"
                  name={`degreeFile-${index}`}
                  accept="application/pdf,image/*"
                  icon={FileText}
                  onChange={(file) => updateEducation(index, "degreeFile", file)}
                  disabled={isEduDisabled(rowLocked, "degreeFile")}
                />
              </div>

              {!rowLocked && (
                <div className="flex justify-end">
                  <Button variant="destructive" type="button" onClick={() => removeEducation(index)}>
                    Remove
                  </Button>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div layout>
        <Button
          type="button"
          className="bg-purple-100 text-purple-700 hover:bg-purple-200"
          onClick={addEducation}
        >
          + Add Education
        </Button>
      </motion.div>
    </>
  );
}

// components/profile/EducationForm.jsx
// FULL component — FileUploader full row + Hide toggle as a switch above it
import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
// ⬇️ update this path to wherever you placed BlockSwitch
import BlockSwitch from "@/components/form/Switch";

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
  // optional: parent save handler
  saveEducation,
}) {
  const handleSave = (index) => {
    if (typeof saveEducation === "function") {
      saveEducation(index, educationList[index]);
    } else {
      console.warn("saveEducation prop not provided. Provide saveEducation(index, data).");
    }
  };

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
              {/* Row header */}
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-700">Education {index + 1}</div>
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

                {/* Full-width uploader with a switch row above it */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Degree File (PDF / Image)
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 select-none">
                        {hasHidden(edu, "degreeFile") ? "Hidden" : "Visible"}
                      </span>
                      <BlockSwitch
                        checked={hasHidden(edu, "degreeFile")}
                        onChange={() =>
                          toggleHidden(edu, "degreeFile", (field, val) =>
                            updateEducation(index, field, val)
                          )
                        }
                        className={rowLocked && !EDUCATION_UNLOCKED.has("hiddenFields") ? "opacity-50 pointer-events-none" : ""}
                      />
                    </div>
                  </div>

                  <FileUploader
                    ref={(el) => (degreeRefs?.current ? (degreeRefs.current[index] = el) : null)}
                    name={`degreeFile-${index}`}
                    accept="application/pdf,image/*"
                    icon={FileText}
                    onChange={(file) => updateEducation(index, "degreeFile", file)}
                    disabled={isEduDisabled(rowLocked, "degreeFile")}
                    className="w-full"
                    // if your FileUploader **requires** a label prop and renders it,
                    // pass label="Degree File (PDF / Image)" and add a prop to hide it,
                    // or keep as-is to avoid double labels.
                  />
                </div>
              </div>

              {/* Row actions */}
              <div className="flex justify-end gap-3 pt-1">
                {!rowLocked && (
                  <Button variant="destructive" type="button" onClick={() => removeEducation(index)}>
                    Remove
                  </Button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <motion.div layout>
        <Button
          type="button"
          className="bg-orange-100 text-orange-700 hover:bg-orange-200"
          onClick={addEducation}
        >
          + Add Education
        </Button>
      </motion.div>
    </>
  );
}

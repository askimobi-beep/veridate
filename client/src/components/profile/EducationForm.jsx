// components/profile/EducationForm.jsx
// FULL component — FileUploader full row + Hide toggle as a switch above it
import React from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BlockSwitch from "@/components/form/Switch";
import CreditBadge from "../creditshow/CreditBadge";

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
const EDUCATION_UNLOCKED = new Set([
  "endDate",
  "instituteWebsite",
  "degreeFile",
  "hiddenFields",
]);
const isEduDisabled = (rowLocked, field) =>
  rowLocked && !EDUCATION_UNLOCKED.has(field);

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

export default function EducationForm({
  educationList,
  updateEducation,
  addEducation,
  removeEducation,
  locked,
  degreeRefs,
  eduCreditByKey,
  saveEducation, // 👈 now required here
  onAskConfirm, // 👈 confirm gateway from parent
  saving, // 👈 to disable button
}) {
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const handleSave = (index) => {
    if (typeof saveEducation === "function") {
      saveEducation(index, educationList[index]);
    } else {
      console.warn(
        "saveEducation prop not provided. Provide saveEducation(index, data)."
      );
    }
  };

  const websiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\/$/;

  return (
    <>
      <AnimatePresence initial={false}>
        {educationList.map((edu, index) => {
          const rowLocked = !!edu._id && locked;

          const key = edu.instituteKey || norm(edu.institute);
          const bucket =
            key && eduCreditByKey?.get ? eduCreditByKey.get(key) : null;
          const isWebsiteValid = websiteRegex.test(
            (edu.instituteWebsite || "").trim()
          ); // 👈 per-row

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-800">
                    Education {index + 1}
                  </span>

                  {bucket ? (
                    <CreditBadge
                      label={bucket.institute || "—"}
                      available={bucket.available ?? 0}
                      used={bucket.used ?? 0}
                      total={bucket.total}
                    />
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AppSelect
                  name={`degreeTitle-${index}`}
                  label="Degree Title"
                  labelText="Degree"
                  value={edu.degreeTitle}
                  onChange={(e) =>
                    updateEducation(index, "degreeTitle", e.target.value)
                  }
                  options={degreeOptions}
                  disabled={isEduDisabled(rowLocked, "degreeTitle")}
                />

                <AppSelect
                  name={`institute-${index}`}
                  label="Institute"
                  labelText="Institute"
                  value={edu.institute}
                  onChange={(e) =>
                    updateEducation(index, "institute", e.target.value)
                  }
                  options={instituteOptions}
                  disabled={isEduDisabled(rowLocked, "institute")}
                />

                <AppInput
                  name={`startDate-${index}`}
                  label="Start Date"
                  type="date"
                  value={edu.startDate}
                  onChange={(e) =>
                    updateEducation(index, "startDate", e.target.value)
                  }
                  placeholder="Start date"
                  disabled={rowLocked}
                />

                <AppInput
                  name={`endDate-${index}`}
                  label="End Date"
                  type="date"
                  value={edu.endDate}
                  onChange={(e) =>
                    updateEducation(index, "endDate", e.target.value)
                  }
                  placeholder="End date"
                  disabled={isEduDisabled(rowLocked, "endDate")}
                />

                <AppInput
                  name={`instituteWebsite-${index}`}
                  label="Institute Website"
                  type="url"
                  value={edu.instituteWebsite}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    updateEducation(index, "instituteWebsite", val);
                    updateEducation(
                      index,
                      "error_instituteWebsite",
                      val && !websiteRegex.test(val)
                        ? "Only valid website URLs allowed (e.g. https://university.com/)"
                        : ""
                    );
                  }}
                  placeholder="https://ucp.edu.pk/"
                  disabled={isEduDisabled(rowLocked, "instituteWebsite")}
                  error={edu.error_instituteWebsite}
                  pattern="^https:\/\/[a-zA-Z0-9\.-]+\.[a-zA-Z]{2,}\/$"
                />

                {/* Full-width uploader with a switch row above it */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                       Upload Degree  (PDF / Image)
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
                        className={
                          rowLocked && !EDUCATION_UNLOCKED.has("hiddenFields")
                            ? "opacity-50 pointer-events-none"
                            : ""
                        }
                      />
                    </div>
                  </div>

                  <FileUploader
                    ref={(el) =>
                      degreeRefs?.current
                        ? (degreeRefs.current[index] = el)
                        : null
                    }
                    name={`degreeFile-${index}`}
                    accept="application/pdf,image/*"
                    icon={FileText}
                    onChange={(file) =>
                      updateEducation(index, "degreeFile", file)
                    }
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
                  <>
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={() => removeEducation(index)}
                    >
                      Remove
                    </Button>

                    <Button
                      type="button"
                      disabled={saving || !isWebsiteValid}
                      onClick={() => {
                        const val = (edu.instituteWebsite || "").trim();
                        if (!websiteRegex.test(val)) {
                          updateEducation(
                            index,
                            "error_instituteWebsite",
                            "Only valid website URLs allowed (e.g. https://ucp.edu.pk/)"
                          );
                          return; // ⛔ stop — do not open confirm, do not save
                        }

                        // clear error (in case they fixed it)
                        updateEducation(index, "error_instituteWebsite", "");

                        onAskConfirm?.("education", "Education", () =>
                          saveEducation(index, educationList[index])
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

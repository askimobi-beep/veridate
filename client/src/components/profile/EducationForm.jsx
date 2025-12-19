// components/profile/EducationForm.jsx
import React, { useState } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import { Button } from "@/components/ui/button";
import { FileText, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BlockSwitch from "@/components/form/Switch";
import CreditBadge from "../creditshow/CreditBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

// fields editable even when row is locked
const EDUCATION_UNLOCKED = new Set([
  "endDate",
  "instituteWebsite",
  "degreeFile",
  "hiddenFields",
  "projects",
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
  locked, // section-level lock
  degreeRefs,
  eduCreditByKey,
  saveEducation, // (index, row)
  onAskConfirm, // (sectionValue, sectionTitle, actionFn)
  isRowSaving, // (index) => boolean
}) {
  const norm = (s) => (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  const websiteRegex = /^https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const [creditInfoOpen, setCreditInfoOpen] = useState(false);

  return (
    <>
      <Dialog open={creditInfoOpen} onOpenChange={setCreditInfoOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Credits guide</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            A short walkthrough on how education verification credits work is
            coming soon.
          </p>
        </DialogContent>
      </Dialog>

      <AnimatePresence initial={false}>
        {educationList.map((edu, index) => {
          const rowLocked = !!edu?.rowLocked || (!!edu?._id && locked);
          const savingThis =
            typeof isRowSaving === "function" ? isRowSaving(index) : false;

          const key = edu.instituteKey || norm(edu.institute);
          const bucket =
            key && eduCreditByKey?.get ? eduCreditByKey.get(key) : null;

          const verifications = Array.isArray(edu?.verifications)
            ? edu.verifications
            : [];
          const verifiedBy = Array.isArray(edu?.verifiedBy)
            ? edu.verifiedBy
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
            typeof edu?.verifyCount === "number" ? edu.verifyCount : 0;
          const totalVerifiers = Math.max(
            verifyCount,
            uniqueVerifierIds.size,
            verifications.length,
            verifiedBy.length
          );

          const isWebsiteValid = websiteRegex.test(
            (edu.instituteWebsite || "").trim()
          );

          return (
            <motion.div
              key={index}
              layout
              className="origin-top mb-6 p-5 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4"
            >
              {/* Row header */}
              <div className="mb-1 text-left">
                <div className="text-lg font-bold text-gray-900">
                  {edu?._id && (edu.degreeTitle || "").trim()
                    ? edu.degreeTitle
                    : `Education ${index + 1}`}
                </div>
              </div>

              <div className="text-sm text-gray-600 text-start">
                {totalVerifiers > 0
                  ? `${totalVerifiers} ${
                      totalVerifiers === 1 ? "user has" : "users have"
                    } verified this education.`
                  : "No users have verified this education yet."}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                        ? "Only valid website URLs allowed (e.g. https://university.com)"
                        : ""
                    );
                  }}
                  placeholder="https://university.com"
                  disabled={isEduDisabled(rowLocked, "instituteWebsite")}
                  error={edu.error_instituteWebsite}
                  pattern={websiteRegex}
                />

                {/* Full-width uploader with a switch row above it */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-orange-600" />
                      Upload Degree (PDF)
                    </label>

                    <div className="flex items-center gap-2">
                      {/* <span className="text-xs text-gray-500 select-none">
                        {hasHidden(edu, "degreeFile") ? "Hidden" : "Visible"}
                      </span> */}
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

                  {/* Projects (Education) */}
                  <div className="md:col-span-2 space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Projects
                      </span>
                      <button
                        type="button"
                        className="text-sm text-orange-700 hover:underline"
                        onClick={() => {
                          const list = Array.isArray(edu.projects)
                            ? edu.projects
                            : [];
                          updateEducation(index, "projects", [
                            ...list,
                            { projectTitle: "", projectDescription: "" },
                          ]);
                        }}
                        disabled={isEduDisabled(rowLocked, "projects")}
                      >
                        + Add Project
                      </button>
                    </div>

                    {(edu.projects || []).map((p, pi) => (
                      <div
                        key={pi}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 border rounded-xl p-3 bg-gray-50"
                      >
                        <AppInput
                          label="Project Title"
                          value={p.projectTitle || ""}
                          onChange={(e) => {
                            const list = [...(edu.projects || [])];
                            list[pi] = {
                              ...list[pi],
                              projectTitle: e.target.value,
                            };
                            updateEducation(index, "projects", list);
                          }}
                          placeholder="e.g. Final Year Thesis"
                          disabled={isEduDisabled(rowLocked, "projects")}
                        />
                        <AppInput
                          label="Project Description"
                          value={p.projectDescription || ""}
                          onChange={(e) => {
                            const list = [...(edu.projects || [])];
                            list[pi] = {
                              ...list[pi],
                              projectDescription: e.target.value,
                            };
                            updateEducation(index, "projects", list);
                          }}
                          placeholder="What did you build / learn?"
                          disabled={isEduDisabled(rowLocked, "projects")}
                        />
                        <div className="md:col-span-2 flex justify-end">
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => {
                              const list = [...(edu.projects || [])];
                              list.splice(pi, 1);
                              updateEducation(index, "projects", list);
                            }}
                            disabled={isEduDisabled(rowLocked, "projects")}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <FileUploader
                    ref={(el) =>
                      degreeRefs?.current
                        ? (degreeRefs.current[index] = el)
                        : null
                    }
                    name={`degreeFile-${index}`}
                    accept="Application/Pdf"
                    icon={FileText}
                    onChange={(file) =>
                      updateEducation(index, "degreeFile", file)
                    }
                    disabled={isEduDisabled(rowLocked, "degreeFile")}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="flex flex-wrap items-center gap-3">
                  {bucket ? (
                    <CreditBadge
                      label={bucket?.institute || edu.institute || ""}
                      available={bucket.available ?? 0}
                      used={bucket.used ?? 0}
                      total={bucket.total}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      No verification credits recorded yet for this education.
                    </span>
                  )}
                </div>
              </div>

              {/* Row actions */}
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <Button
                    variant="link"
                    type="button"
                    className="px-0 text-orange-700"
                    onClick={() => setCreditInfoOpen(true)}
                  >
                    See how these credits work
                  </Button>

                  {!rowLocked && (
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEducation(index);
                      }}
                    >
                      Remove
                    </Button>
                  )}

                  <Button
                    type="button"
                    disabled={savingThis || !isWebsiteValid}
                    onClick={(e) => {
                      e.stopPropagation();
                      const val = (edu.instituteWebsite || "").trim();
                      if (!websiteRegex.test(val)) {
                        updateEducation(
                          index,
                          "error_instituteWebsite",
                          "Only valid website URLs allowed (e.g. https://ucp.edu.pk/)"
                        );
                        return;
                      }
                      updateEducation(index, "error_instituteWebsite", "");
                      onAskConfirm?.(
                        `education:${index}`,
                        `Education ${index + 1}`,
                        () => saveEducation(index, educationList[index])
                      );
                    }}
                    className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    {savingThis ? "Saving..." : "Save"}
                  </Button>
                </div>
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
            addEducation();
          }}
        >
          + Add Education
        </Button>
      </motion.div>
    </>
  );
}

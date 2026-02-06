// components/profile/ProjectForm.jsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import CreditBadge from "../creditshow/CreditBadge";
import { cn } from "@/lib/utils";

const PROJECT_UNLOCKED = new Set([
  "projectTitle",
  "projectUrl",
  "endDate",
  "department",
  "projectMember",
  "role",
  "description",
]);

const isProjectDisabled = (rowLocked, field) =>
  rowLocked && !PROJECT_UNLOCKED.has(field);

export default function ProjectForm({
  projectList,
  addProject,
  removeProject,
  updateProject,
  locked,
  projectCreditByKey,
  companyOptions = [],
  saveProject,
  isRowSaving,
  onAskConfirm,
}) {
  const [creditInfoOpen, setCreditInfoOpen] = useState(false);
  const [editingRow, setEditingRow] = useState(null);

  return (
    <>
      <Dialog open={creditInfoOpen} onOpenChange={setCreditInfoOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Credits guide</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-700">
            A short walkthrough on how project verification credits work is
            coming soon.
          </p>
        </DialogContent>
      </Dialog>

      <AnimatePresence initial={false}>
        {(Array.isArray(projectList) ? projectList : []).map((project, index) => {
          const rowLocked = !!project?.rowLocked || (!!project?._id && locked);
          const allowEdit = rowLocked && editingRow === index;
          const savingThis =
            typeof isRowSaving === "function" ? isRowSaving(index) : false;

          const baseCompanies = Array.isArray(companyOptions)
            ? companyOptions
            : [];
          const companyChoices =
            project.company && !baseCompanies.includes(project.company)
              ? [...baseCompanies, project.company]
              : baseCompanies;

          const key = project?._id ? String(project._id) : "";
          const bucket =
            key && projectCreditByKey?.get ? projectCreditByKey.get(key) : null;
          const available = bucket?.available ?? 0;
          const used = bucket?.used ?? 0;

          const verifications = Array.isArray(project?.verifications)
            ? project.verifications
            : [];
          const verifiedBy = Array.isArray(project?.verifiedBy)
            ? project.verifiedBy
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
            typeof project?.verifyCount === "number" ? project.verifyCount : 0;
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
              <div className="mb-1 text-left">
                <div className="text-lg font-bold text-gray-900">
                  {project?._id && (project.projectTitle || "").trim()
                    ? project.projectTitle
                    : `Project ${index + 1}`}
                </div>
              </div>

              <div className="text-sm text-gray-600 text-start">
                {totalVerifiers > 0
                  ? `${totalVerifiers} ${
                      totalVerifiers === 1 ? "user has" : "users have"
                    } verified this project.`
                  : "No users have verified this project yet."}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <AppInput
                  name={`projectTitle-${index}`}
                  label="Project Title"
                  value={project.projectTitle}
                  onChange={(e) =>
                    updateProject(index, "projectTitle", e.target.value)
                  }
                  placeholder="Project title"
                  disabled={rowLocked && !allowEdit}
                />

                <AppSelect
                  name={`company-${index}`}
                  label="Work Experience"
                  value={project.company || ""}
                  onChange={(e) =>
                    updateProject(index, "company", e.target.value)
                  }
                  options={companyChoices}
                  disabled={rowLocked}
                />

                <AppInput
                  name={`projectUrl-${index}`}
                  label="Project URL"
                  type="url"
                  value={project.projectUrl || ""}
                  onChange={(e) =>
                    updateProject(index, "projectUrl", e.target.value)
                  }
                  placeholder="https://project.example.com"
                  disabled={rowLocked && !allowEdit}
                />

                <AppInput
                  name={`startDate-${index}`}
                  label="Start Date"
                  type="date"
                  value={project.startDate}
                  onChange={(e) =>
                    updateProject(index, "startDate", e.target.value)
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
                            checked={!!project.isPresent}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              updateProject(index, "isPresent", checked);
                              if (checked) updateProject(index, "endDate", "");
                            }}
                            disabled={rowLocked && !allowEdit}
                            className="h-4 w-4 rounded-md border border-gray-300 appearance-none transition-colors duration-200 shrink-0 bg-white checked:bg-gray-800 checked:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
                          />
                          {project.isPresent ? (
                            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-white">
                              ✓
                            </span>
                          ) : null}
                        </label>
                        <span
                          className={`select-none text-xs ${
                            project.isPresent ? "text-gray-800 font-medium" : "text-gray-500"
                          }`}
                        >
                          Present
                        </span>
                      </span>
                    </div>
                  }
                  type="date"
                  value={project.endDate}
                  onChange={(e) =>
                    updateProject(index, "endDate", e.target.value)
                  }
                  placeholder="End date"
                  disabled={(rowLocked && !allowEdit) || !!project.isPresent}
                />

                <AppInput
                  name={`department-${index}`}
                  label="Department"
                  value={project.department}
                  onChange={(e) =>
                    updateProject(index, "department", e.target.value)
                  }
                  placeholder="Department"
                  disabled={rowLocked && !allowEdit}
                />

                <AppInput
                  name={`projectMember-${index}`}
                  label="Project members"
                  value={
                    Array.isArray(project.projectMember)
                      ? project.projectMember.join(", ")
                      : project.projectMember || ""
                  }
                  onChange={(e) =>
                    updateProject(
                      index,
                      "projectMember",
                      e.target.value
                        .split(",")
                        .map((member) => member.trim())
                        .filter((member) => member.length > 0)
                    )
                  }
                  placeholder="e.g. Alice, Bob"
                  disabled={rowLocked && !allowEdit}
                />

                <AppInput
                  name={`role-${index}`}
                  label="Role"
                  value={project.role}
                  onChange={(e) => updateProject(index, "role", e.target.value)}
                  placeholder="Role"
                  disabled={rowLocked && !allowEdit}
                />

                <div className="md:col-span-2 space-y-1">
                  <Label
                    htmlFor={`description-${index}`}
                    className="text-sm font-medium text-gray-700 text-left w-full inline-flex items-center gap-2"
                  >
                    Description
                  </Label>
                  <Textarea
                    id={`description-${index}`}
                    value={project.description || ""}
                    onChange={(e) =>
                      updateProject(index, "description", e.target.value)
                    }
                    placeholder="Project description"
                    rows={4}
                    disabled={rowLocked && !allowEdit}
                    className={cn(
                      "bg-white/90 border border-gray-200 text-gray-900 placeholder:text-gray-400",
                      "focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0",
                      rowLocked && !allowEdit &&
                        "bg-gray-100 text-gray-500 cursor-not-allowed"
                    )}
                  />
                </div>
              </div>

              <div className="rounded-xl p-0">
                <div className="flex w-full flex-wrap items-start justify-start gap-3">
                  {bucket ? (
                    <CreditBadge
                      context="project"
                      available={available}
                      used={used}
                      total={bucket?.total}
                    />
                  ) : (
                    <span className="text-sm text-gray-500">
                      No verification credits recorded yet for this project.
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:justify-end">
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  {!rowLocked && (
                    <Button
                      variant="destructive"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeProject(index);
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
                      disabled={savingThis}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskConfirm?.(
                          `projects:${index}`,
                          `Project ${index + 1}`,
                          () => saveProject(index, project)
                        );
                        setEditingRow(null);
                      }}
                      className="inline-flex items-center gap-2 bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] text-white"
                    >
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
            addProject();
          }}
        >
          + Add Project
        </Button>
      </motion.div>
    </>
  );
}

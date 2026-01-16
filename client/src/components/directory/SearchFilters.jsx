import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-slate-600">
      <span>{label}</span>
      {children}
    </label>
  );
}

const jobTitleOptions = [
  "Software Engineer",
  "Senior Software Engineer",
  "Team Lead",
  "Project Manager",
  "Data Analyst",
  "Designer",
  "Other",
];

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

const industryOptions = [
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

const experienceDurationOptions = ["0", "1", "2", "3", "5", "8", "10+"];

const fallbackCompanyOptions = [];
const fallbackInstituteOptions = [];
const fallbackLocationOptions = [];

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
  allowCustom = false,
  customLabel = "Custom",
  customPlaceholder,
}) {
  const normalizedOptions = options.map((opt) =>
    typeof opt === "string" ? { label: opt, value: opt } : opt
  );
  const optionValues = new Set(normalizedOptions.map((opt) => opt.value));
  const isCustom = allowCustom && value && !optionValues.has(value);
  const selectValue = isCustom ? "__custom__" : value || "";

  return (
    <div className="space-y-2">
      <Select
        value={selectValue}
        onValueChange={(next) => {
          if (next === "__any__") return onChange("");
          if (next === "__custom__") return onChange(value || "");
          onChange(next);
        }}
      >
      <SelectTrigger className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md focus:ring-orange-200">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
        <SelectContent className="rounded-xl border-white/70 bg-white/95 backdrop-blur-md">
          <SelectItem value="__any__">Any</SelectItem>
          {normalizedOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
          {allowCustom ? <SelectItem value="__custom__">{customLabel}</SelectItem> : null}
        </SelectContent>
      </Select>

      {allowCustom && selectValue === "__custom__" ? (
        <Input
          placeholder={customPlaceholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
        />
      ) : null}
    </div>
  );
}

export default function SearchFilters({
  q,
  setQ,
  email,
  setEmail,
  mobile,
  setMobile,
  userId,
  setUserId,
  jobTitle,
  setJobTitle,
  degreeTitle,
  setDegreeTitle,
  company,
  setCompany,
  industry,
  setIndustry,
  institute,
  setInstitute,
  jobFunctions,
  setJobFunctions,
  skillset,
  setSkillset,
  location,
  setLocation,
  companyOptions = fallbackCompanyOptions,
  instituteOptions = fallbackInstituteOptions,
  locationOptions = fallbackLocationOptions,
  experienceDuration,
  setExperienceDuration,
  onSearch,
  onReset,
}) {
  return (
    <form onSubmit={onSearch} className="space-y-3 text-left">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FilterField label="Name">
          <Input
            placeholder="Candidate name"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
          />
        </FilterField>

        <FilterField label="Email">
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
          />
        </FilterField>

        <FilterField label="Mobile">
          <Input
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
          />
        </FilterField>

        <FilterField label="User ID">
          <Input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
          />
        </FilterField>

        <FilterField label="Job Title">
          <FilterSelect
            value={jobTitle}
            onChange={setJobTitle}
            placeholder="Job title"
            options={jobTitleOptions}
          />
        </FilterField>

        <FilterField label="Degree Title">
          <FilterSelect
            value={degreeTitle}
            onChange={setDegreeTitle}
            placeholder="Degree title"
            options={degreeOptions}
          />
        </FilterField>

        <FilterField label="Company">
          <FilterSelect
            value={company}
            onChange={setCompany}
            placeholder="Company"
            options={companyOptions}
            allowCustom
            customPlaceholder="Company"
          />
        </FilterField>

        <FilterField label="Industry">
          <FilterSelect
            value={industry}
            onChange={setIndustry}
            placeholder="Industry"
            options={industryOptions}
          />
        </FilterField>

        <FilterField label="Institute">
          <FilterSelect
            value={institute}
            onChange={setInstitute}
            placeholder="Institute"
            options={instituteOptions}
            allowCustom
            customPlaceholder="Institute"
          />
        </FilterField>

        <FilterField label="Job Functions">
          <FilterSelect
            value={jobFunctions}
            onChange={setJobFunctions}
            placeholder="Job functions"
            options={jobFunctionOptions}
          />
        </FilterField>

        <FilterField label="Skillset">
          <Input
            placeholder="Skillset"
            value={skillset}
            onChange={(e) => setSkillset(e.target.value)}
            className="h-9 rounded-xl border border-slate-200/80 bg-white/70 text-left text-slate-700 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.55)] backdrop-blur-md"
          />
        </FilterField>

        <FilterField label="Location">
          <FilterSelect
            value={location}
            onChange={setLocation}
            placeholder="City or country"
            options={locationOptions}
            allowCustom
            customPlaceholder="City or country"
          />
        </FilterField>

        <FilterField label="Experience (years)">
          <FilterSelect
            value={experienceDuration}
            onChange={setExperienceDuration}
            placeholder="Minimum years"
            options={experienceDurationOptions}
          />
        </FilterField>
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          className="flex-1 h-9 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
        >
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="flex-1 h-9 rounded-xl border-white/70 bg-white/70 text-slate-700 hover:bg-white/90"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

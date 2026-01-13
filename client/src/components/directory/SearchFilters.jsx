import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function FilterField({ label, children }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      <span>{label}</span>
      {children}
    </label>
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
  experienceDuration,
  setExperienceDuration,
  onSearch,
  onReset,
}) {
  return (
    <form onSubmit={onSearch} className="space-y-3">
      <FilterField label="Name">
        <Input
          placeholder="Candidate name"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </FilterField>

      <FilterField label="Email">
        <Input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FilterField>

      <FilterField label="Mobile">
        <Input
          placeholder="Mobile"
          value={mobile}
          onChange={(e) => setMobile(e.target.value)}
        />
      </FilterField>

      <FilterField label="User ID">
        <Input
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </FilterField>

      <FilterField label="Job Title">
        <Input
          placeholder="Job title"
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
        />
      </FilterField>

      <FilterField label="Degree Title">
        <Input
          placeholder="Degree title"
          value={degreeTitle}
          onChange={(e) => setDegreeTitle(e.target.value)}
        />
      </FilterField>

      <FilterField label="Company">
        <Input
          placeholder="Company"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
        />
      </FilterField>

      <FilterField label="Industry">
        <Input
          placeholder="Industry"
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
        />
      </FilterField>

      <FilterField label="Institute">
        <Input
          placeholder="Institute"
          value={institute}
          onChange={(e) => setInstitute(e.target.value)}
        />
      </FilterField>

      <FilterField label="Job Functions">
        <Input
          placeholder="Job functions"
          value={jobFunctions}
          onChange={(e) => setJobFunctions(e.target.value)}
        />
      </FilterField>

      <FilterField label="Skillset">
        <Input
          placeholder="Skillset"
          value={skillset}
          onChange={(e) => setSkillset(e.target.value)}
        />
      </FilterField>

      <FilterField label="Location">
        <Input
          placeholder="City or country"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </FilterField>

      <FilterField label="Experience Duration (years)">
        <Input
          type="number"
          min="0"
          step="0.5"
          placeholder="Minimum years"
          value={experienceDuration}
          onChange={(e) => setExperienceDuration(e.target.value)}
        />
      </FilterField>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onReset}
          className="flex-1"
        >
          Reset
        </Button>
      </div>
    </form>
  );
}

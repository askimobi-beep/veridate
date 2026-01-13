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

export default function SearchFilters({
  q,
  setQ,
  experience,
  setExperience,
  university,
  setUniversity,
  gender,
  setGender,
  country,
  setCountry,
  onSearch,
  onReset,
}) {
  return (
    <form onSubmit={onSearch} className="space-y-3">
      <Input
        placeholder="Search candidate name"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <Input
        placeholder="Experience (company or job title)"
        value={experience}
        onChange={(e) => setExperience(e.target.value)}
      />

      <Input
        placeholder="University"
        value={university}
        onChange={(e) => setUniversity(e.target.value)}
      />

      <Select value={gender} onValueChange={setGender}>
        <SelectTrigger>
          <SelectValue placeholder="Gender" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Male">Male</SelectItem>
          <SelectItem value="Female">Female</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
      />

      <div className="flex gap-2 pt-1">
        <Button type="submit" className="flex-1">Search</Button>
        <Button type="button" variant="outline" onClick={onReset} className="flex-1">
          Reset
        </Button>
      </div>
    </form>
  );
}

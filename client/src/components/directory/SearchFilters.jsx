import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function SearchFilters({
  q, setQ, gender, setGender, country, setCountry, onSearch, onReset,
}) {
  return (
    <form onSubmit={onSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Input
        placeholder="Search name, email, city..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="md:col-span-2"
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

      <div className="flex gap-2 md:col-span-4">
        <Button type="submit">Search</Button>
        <Button type="button" variant="outline" onClick={onReset}>Reset</Button>
      </div>
    </form>
  );
}

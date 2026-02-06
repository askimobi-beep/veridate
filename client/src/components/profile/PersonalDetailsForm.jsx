import React, { useMemo, useState, useEffect } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import { CircleCheck, CircleHelp, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  genders,
  residentStatuses,
  shiftOptions,
  workAuthorizationOptions,
} from "@/components/form/Dropdowndata";

const PERSONAL_UNLOCKED = new Set([
  "email",
  "mobile",
  "resume",
  "profilePic",
  "dob",
  "street",
  "city",
  "country",
  "zip",
  "residentStatus",
  "nationality",
  "shiftPreferences",
  "workAuthorization",
]);

const isDisabled = (locked, field) => locked && !PERSONAL_UNLOCKED.has(field);

// keep your list small or wire a proper lib later
const callingCodes = [
  "+1",
  "+7",
  "+20",
  "+27",
  "+30",
  "+33",
  "+34",
  "+39",
  "+44",
  "+49",
  "+52",
  "+55",
  "+61",
  "+62",
  "+63",
  "+64",
  "+65",
  "+81",
  "+82",
  "+86",
  "+90",
  "+92",
  "+94",
  "+966",
  "+971",
  "+972",
];

export default function PersonalDetailsForm({
  formData,
  handleChange,
  handleCustomChange,
  locked,
  onAskConfirm,
  savePersonalInfo,
  saving,
}) {
  const [dobFocused, setDobFocused] = useState(false);

  const [countriesList, setCountriesList] = useState([]);

  const emailValid =
    !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  const preferenceOptions = useMemo(
    () => (Array.isArray(shiftOptions) ? shiftOptions : []),
    []
  );
  const workAuthOptions = useMemo(
    () => (Array.isArray(workAuthorizationOptions) ? workAuthorizationOptions : []),
    []
  );

  // fetch country list (names only)
  useEffect(() => {
    let cancelled = false;
    const loadCountries = async () => {
      try {
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name"
        );
        const data = await res.json();
        const names = data
          .map((c) => c?.name?.common)
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        if (!cancelled) setCountriesList(names);
      } catch (e) {
        console.error("Failed to fetch countries", e);
      }
    };
    loadCountries();
    return () => {
      cancelled = true;
    };
  }, []);

  const MultiSelectDropdown = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const selected = Array.isArray(value) ? value : [];
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return (options || []).filter((opt) =>
        String(opt).toLowerCase().includes(q)
      );
    }, [options, query]);

    const toggle = (opt) => {
      if (disabled) return;
      const next = selected.includes(opt)
        ? selected.filter((v) => v !== opt)
        : [...selected, opt];
      onChange(next);
    };

    const labelText = selected.length ? selected.join(", ") : placeholder;

    return (
      <div className="space-y-1 w-full">
        {label ? (
          <Label className="text-sm font-medium text-slate-700 text-left w-full inline-flex items-center gap-2">
            {label}
          </Label>
        ) : null}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm ${
                disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
              }`}
            >
              {labelText || "Select options"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] bg-white p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-10"
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {filtered.length ? (
                filtered.map((opt) => {
                  const active = selected.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggle(opt)}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        active ? "brand-orange-soft brand-orange" : "text-slate-700"
                      }`}
                    >
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded border ${
                          active
                            ? "border-[color:var(--brand-orange)] bg-[color:var(--brand-orange)] text-white"
                            : "border-gray-300"
                        }`}
                      >
                        {active ? "✓" : ""}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500">
                  No matches
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  const SearchableSelect = ({
    label,
    options,
    value,
    onChange,
    placeholder,
    disabled,
  }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const filtered = useMemo(() => {
      const q = query.trim().toLowerCase();
      return (options || []).filter((opt) =>
        String(opt).toLowerCase().includes(q)
      );
    }, [options, query]);

    return (
      <div className="space-y-1 w-full">
        {label ? (
          <Label className="text-sm font-medium text-slate-700 text-left w-full inline-flex items-center gap-2">
            {label}
          </Label>
        ) : null}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={`h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-left text-sm text-slate-900 shadow-sm ${
                disabled ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""
              }`}
            >
              {value || placeholder || "Select option"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] bg-white p-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="h-10"
            />
            <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
              {filtered.length ? (
                filtered.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                      value === opt
                        ? "brand-orange-soft brand-orange"
                        : "text-slate-700"
                    }`}
                  >
                    {opt}
                  </button>
                ))
              ) : (
                <div className="px-2 py-2 text-xs text-gray-500">
                  No matches
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <>

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
        <AppInput
          label={<span>Full Name</span>}
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          disabled
        />

        {/* Email: tick in label + in field */}
        <AppInput
          label={
            <div className="flex items-center gap-2">
              <span>Email</span>
              {emailValid && (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center w-5 h-5 rounded-full cursor-pointer">
                        <CircleCheck className="h-4 w-4 text-green-600" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      align="center"
                      className="max-w-sm rounded-xl border border-gray-200 shadow-lg p-3 bg-white"
                    >
                      <div className="text-sm font-semibold text-slate-900 mb-1">
                        Verified
                      </div>
                     
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          }
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          disabled
        />

        {/* Mobile: country code SELECT embedded inside the same field */}
        <AppInput
          name="mobile"
          label={
            <div className="flex items-center gap-2">
              <span>Mobile Number</span>
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      aria-label="Mobile number help"
                      className="rounded-md p-1.5  text-gray-500 hover:text-slate-700"
                    >
                      <CircleHelp className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="left"
                    align="center"
                    className="max-w-sm rounded-xl border border-gray-200 shadow-lg p-3 bg-white"
                  >
                    <div className="text-sm font-semibold text-slate-900 mb-1">
                      Unverified
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          }
          type="tel"
          value={formData.mobile || ""}
          onChange={handleChange}
          placeholder="300 1234567"
          disabled={locked}
          startAdornment={
            <div className="flex items-center">
              <select
                className="h-8 rounded-md text-gray-800 border px-2 pr-6 border-none"
                value={formData.mobileCountryCode || "+92"}
                onChange={(e) =>
                  handleCustomChange("mobileCountryCode", e.target.value)
                }
                disabled={locked}
              >
                {callingCodes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <span className="mx-2 h-5 w-px bg-gray-300" />
            </div>
          }
          startPaddingClass="pl-28" // 👈 give the input enough left space for the select
        />

        <AppSelect
          label="Gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          options={genders}
          placeholder="Select gender"
          disabled={isDisabled(locked, "gender")}
        />


        <AppInput
          label="Date of Birth"
          type={dobFocused ? "month" : "text"}
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          placeholder="MM / YYYY"
          disabled={isDisabled(locked, "dob")}
          onFocus={() => setDobFocused(true)}
          onBlur={() => setDobFocused(false)}
        />

        <MultiSelectDropdown
          label="Shift Preference"
          options={preferenceOptions}
          value={formData.shiftPreferences}
          onChange={(updated) => handleCustomChange("shiftPreferences", updated)}
          placeholder="Select preferences"
          disabled={isDisabled(locked, "shiftPreferences")}
        />
      </div>

      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            Complete Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AppInput
              label="Street"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder=""
              disabled={isDisabled(locked, "street")}
            />

            <AppInput
              label="City"
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder=""
              disabled={isDisabled(locked, "city")}
            />

            <AppInput
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              placeholder=""
              disabled={isDisabled(locked, "country")}
            />

            <AppInput
              label="Zip Code"
              name="zip"
              value={formData.zip || ""}
              onChange={handleChange}
              placeholder=""
              disabled={isDisabled(locked, "zip")}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <SearchableSelect
              label="Nationality"
              options={countriesList}
              value={formData.nationality}
              onChange={(val) => handleCustomChange("nationality", val)}
              placeholder="Select your Nationality"
              disabled={isDisabled(locked, "nationality")}
            />
          </div>

          <MultiSelectDropdown
            label="Work Authorization"
            options={workAuthOptions}
            value={formData.workAuthorization}
            onChange={(updated) =>
              handleCustomChange("workAuthorization", updated)
            }
            placeholder="Select work authorization"
            disabled={isDisabled(locked, "workAuthorization")}
          />

          <AppSelect
            label="Resident Status"
            name="residentStatus"
            value={formData.residentStatus}
            onChange={handleChange}
            options={residentStatuses}
            placeholder="Select Resident Status"
            disabled={isDisabled(locked, "residentStatus")}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-center">
        <button
          type="button"
          onClick={() => {
            if (
              !formData.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
            ) {
              return;
            }
            onAskConfirm?.("pi", "Personal Details", () => savePersonalInfo());
          }}
          disabled={!!saving}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </>
  );
}



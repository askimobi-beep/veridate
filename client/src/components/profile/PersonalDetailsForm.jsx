import React, { useMemo, useState, useEffect } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Loader2, CircleCheck, CircleHelp, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  genders,
  maritalStatuses,
  residentStatuses,
  shiftOptions,
  workAuthorizationOptions,
} from "@/components/form/Dropdowndata";
import BlockSwitch from "../form/Switch";

const PERSONAL_UNLOCKED = new Set([
  "email",
  "mobile",
  "maritalStatus",
  "resume",
  "profilePic",
  "city",
  "country",
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
 

  const [countriesList, setCountriesList] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);

  const emailValid =
    !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // ----- privacy helpers -----
  const hiddenSet = new Set(formData.personalHiddenFields || []);
  const isHidden = (field) => hiddenSet.has(field);

  const setVisibility = (field, visible) => {
    let updated = [...(formData.personalHiddenFields || [])];
    const idx = updated.indexOf(field);
    if (visible) {
      if (idx !== -1) updated.splice(idx, 1);
    } else {
      if (idx === -1) updated.push(field);
    }
    handleCustomChange("personalHiddenFields", updated);
  };

  const withPrivacy = (labelText, fieldKey, leftExtra = null) => (
    <div className="flex items-center justify-between gap-3 w-full">
      <span className="flex items-center gap-2">
        {leftExtra}
        {labelText}
      </span>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="min-w-[44px] text-right">
          {isHidden(fieldKey) ? "Hidden" : "Visible"}
        </span>
        <BlockSwitch
          checked={!isHidden(fieldKey)}
          onChange={(checked) => setVisibility(fieldKey, checked)}
        />
      </div>
    </div>
  );
  // ----------------------------

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

  // fetch cities when country changes
  useEffect(() => {
    const selected = (formData.country || "").trim();
    if (!selected) {
      setCityOptions([]);
      setCityLoading(false);
      return;
    }

    let cancelled = false;
    const loadCities = async () => {
      try {
        setCityLoading(true);
        const res = await fetch(
          "https://countriesnow.space/api/v0.1/countries/cities",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ country: selected }),
          }
        );
        const json = await res.json();
        const cities = Array.isArray(json?.data) ? json.data : [];
        cities.sort((a, b) => a.localeCompare(b));
        if (!cancelled) {
          setCityOptions(cities);
          if (formData.city && !cities.includes(formData.city)) {
            handleCustomChange("city", "");
          }
        }
      } catch (e) {
        console.error("Failed to fetch cities", e);
        if (!cancelled) setCityOptions([]);
      } finally {
        if (!cancelled) setCityLoading(false);
      }
    };

    loadCities();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.country]);



  return (
    <>
      <div className="mt-4 flex justify-end">
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

      {/* Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
        <AppInput
          label={<span>Legal Name</span>}
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
                      <div className="text-sm font-semibold text-gray-900 mb-1">
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

        <AppInput
          label={withPrivacy("Father Name", "fatherName")}
          name="fatherName"
          value={formData.fatherName}
          onChange={handleChange}
          placeholder="Enter father's full name"
          disabled={isDisabled(locked, "fatherName")}
        />

        {/* Mobile: country code SELECT embedded inside the same field */}
        <AppInput
          name="mobile"
          label={
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <span>Mobile Number</span>
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        aria-label="Mobile number help"
                        className="rounded-md p-1.5  text-gray-500 hover:text-gray-700"
                      >
                        <CircleHelp className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent
                      side="left"
                      align="center"
                      className="max-w-sm rounded-xl border border-gray-200 shadow-lg p-3 bg-white"
                    >
                      <div className="text-sm font-semibold text-gray-900 mb-1">
                        Unverified – Get Verified
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="min-w-[44px] text-right">
                  {isHidden("mobile") ? "Hidden" : "Visible"}
                </span>
                <BlockSwitch
                  checked={!isHidden("mobile")}
                  onChange={(checked) => setVisibility("mobile", checked)}
                />
              </div>
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

        <AppInput
          label={withPrivacy("CNIC", "cnic")}
          name="cnic"
          value={formData.cnic}
          onChange={handleChange}
          placeholder="35201-XXXXXXX-X"
          disabled={isDisabled(locked, "cnic")}
        />

        <AppSelect
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          options={cityOptions}
          placeholder={
            !formData.country
              ? "Select country first"
              : cityLoading
              ? "Loading cities…"
              : cityOptions.length
              ? "Select city"
              : "No cities found"
          }
          disabled={
            isDisabled(locked, "city") || !formData.country || cityLoading
          }
          endAdornment={
            cityLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : null
          }
        />

        <AppSelect
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          options={countriesList}
          placeholder="Select your country"
          disabled={isDisabled(locked, "country")}
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

        <AppSelect
          label={withPrivacy("Marital Status", "maritalStatus")}
          name="maritalStatus"
          value={formData.maritalStatus}
          onChange={handleChange}
          options={maritalStatuses}
          placeholder="Select Marital Status"
          disabled={isDisabled(locked, "maritalStatus")}
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

        <AppSelect
          label="Nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          options={countriesList}
          placeholder="Select your Nationality"
          disabled={isDisabled(locked, "nationality")}
        />

        <AppInput
          label={withPrivacy("Date of Birth", "dob")}
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          placeholder="Enter your date of birth"
          disabled={isDisabled(locked, "dob")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-1 gap-4">
        <CheckboxGroup
          title="Shift Preferences"
          options={shiftOptions}
          selected={formData.shiftPreferences}
          onChange={(updated) =>
            handleCustomChange("shiftPreferences", updated)
          }
          disabled={isDisabled(locked, "shiftPreferences")}
        />

        <CheckboxGroup
          title="Work Authorization"
          options={workAuthorizationOptions}
          selected={formData.workAuthorization}
          onChange={(updated) =>
            handleCustomChange("workAuthorization", updated)
          }
          disabled={isDisabled(locked, "workAuthorization")}
        />
      </div>

      <div className="mt-4 flex justify-end">
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

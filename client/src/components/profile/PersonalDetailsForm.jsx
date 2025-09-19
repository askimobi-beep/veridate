import React, { useMemo, useState, useEffect } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Loader2, Check, CircleHelp, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  countries,
  genders,
  maritalStatuses,
  residentStatuses,
  shiftOptions,
  workAuthorizationOptions,
} from "@/components/form/Dropdowndata";

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

// --- replace your PRIVACY_OPTIONS with this ---
const PRIVACY_ITEMS = [
  { label: "Marital Status", value: "maritalStatus" },
  { label: "CNIC", value: "cnic" },
  { label: "Father Name", value: "fatherName" },
  { label: "Date of Birth", value: "dob" },
  { label: "Phone Number", value: "mobile" },
  { label: "Email", value: "email" },
];

// helpers: label <-> value maps
const LABEL_TO_VALUE = Object.fromEntries(
  PRIVACY_ITEMS.map((i) => [i.label, i.value])
);
const VALUE_TO_LABEL = Object.fromEntries(
  PRIVACY_ITEMS.map((i) => [i.value, i.label])
);

export default function PersonalDetailsForm({
  formData,
  handleChange,
  handleCustomChange,
  locked,
  onAskConfirm,
  savePersonalInfo,
  saving,
  userId,
}) {
  const baseUrl =
    import.meta.env.VITE_PROFILE_BASE_URL ||
    (typeof window !== "undefined" && window.location?.origin) ||
    "http://localhost:5173";

  const shareUrl = useMemo(() => {
    const id = userId || formData?.id || "UNKNOWN_ID";
    return `${baseUrl}/dashboard/profiles/${id}`;
  }, [baseUrl, userId, formData?.id]);

  const [copied, setCopied] = useState(false);
  const [countriesList, setCountriesList] = useState([]);
  const [nationalityOptions, setNationalityOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [cityLoading, setCityLoading] = useState(false); // 👈 NEW
  const [countryDemonyms, setCountryDemonyms] = useState(new Map());

  const emailValid =
    !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  // fetch country list (names only — keep it simple)
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
        setCityLoading(true); // 👈 start
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
          // keep user value if valid; otherwise clear
          if (formData.city && !cities.includes(formData.city)) {
            handleCustomChange("city", "");
          }
        }
      } catch (e) {
        console.error("Failed to fetch cities", e);
        if (!cancelled) setCityOptions([]);
      } finally {
        if (!cancelled) setCityLoading(false); // 👈 stop
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
            // basic guard example: email must be valid if present
            if (
              !formData.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
            ) {
              // if you use a snackbar, you can show an error; otherwise noop
              // enqueueSnackbar?.("Please enter a valid email", { variant: "error" });
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
      {/* The rest of your form exactly as you had it */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppInput
          label={
            <>
              {/* <UserRound className="h-4 w-4 text-orange-600" /> */}
              <span>Legal Name</span>
            </>
          }
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your full name"
          disabled
        />

        <AppInput
          label={
            <>
              <span>Email</span>
            </>
          }
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          autoComplete="email"
          disabled
          endAdornment={
            emailValid ? <Check className="h-4 w-4 text-green-600" /> : null
          }
        />

        <AppInput
          label="Father Name"
          name="fatherName"
          value={formData.fatherName}
          onChange={handleChange}
          placeholder="Enter father's full name"
          disabled={isDisabled(locked, "fatherName")}
        />

        <AppInput
          name="mobile"
          label="Mobile Number"
          type="tel"
          value={formData.mobile || ""}
          onChange={handleChange}
          disabled={locked}
          endAdornment={
            <TooltipProvider delayDuration={150}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Mobile number help"
                    className="rounded-md p-1.5 border border-gray-200 hover:bg-gray-50 text-gray-500 hover:text-gray-700 shadow-sm"
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
                    Why we ask for this
                  </div>
                  <div className="text-xs text-gray-600">
                    Add your primary contact number (with country code). This
                    stays private unless you mark it visible in your privacy
                    settings.
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Example: +92 300 1234567
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          }
        />

        <AppInput
          label="CNIC"
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
          // disable while loading or until a country is chosen
          disabled={
            isDisabled(locked, "city") || !formData.country || cityLoading
          }
          // OPTIONAL: if AppSelect supports endAdornment, show spinner
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
          label="Martial Status"
          name="maritalStatus"
          value={formData.maritalStatus}
          onChange={handleChange}
          options={maritalStatuses}
          placeholder="Select Martial Status"
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

        <AppInput
          label="Nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          placeholder="e.g. Pakistani"
          disabled={isDisabled(locked, "nationality")}
        />

        <AppInput
          label="Date of Birth"
          type="date"
          name="dob"
          value={formData.dob}
          onChange={handleChange}
          placeholder="Enter your date of birth"
          disabled={isDisabled(locked, "dob")}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-1 gap-4">
        {/* <FileUploader
          ref={resumeRef}
          label="Resume (PDF)"
          name="resume"
          accept="application/pdf"
          icon={FileText}
          onChange={(file) => handleCustomChange("resume", file)}
          disabled={isDisabled(locked, "resume")}
        />
         */}

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

      {/* Privacy prefs */}
      <div className="mt-8 mb-10 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-2">
          <span className="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
          Privacy Preferences
        </h3>
        <p className="text-sm text-gray-500 mb-5">
          Control what details are visible to others in the directory & your
          public profile.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {PRIVACY_ITEMS.map((item) => {
            const checked = (formData.personalHiddenFields || []).includes(
              item.value
            );
            return (
              <label
                key={item.value}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition 
                  ${
                    checked
                      ? "bg-orange-50 border border-orange-300"
                      : "border border-gray-200 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-orange-600 cursor-pointer"
                  checked={checked}
                  onChange={(e) => {
                    let updated = [...(formData.personalHiddenFields || [])];
                    if (e.target.checked) {
                      updated.push(item.value);
                    } else {
                      updated = updated.filter((v) => v !== item.value);
                    }
                    handleCustomChange("personalHiddenFields", updated);
                  }}
                />
                <span className="text-sm text-gray-700">{item.label}</span>
              </label>
            );
          })}
        </div>
      </div>
      {/* Actions */}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            // basic guard example: email must be valid if present
            if (
              !formData.email ||
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
            ) {
              // if you use a snackbar, you can show an error; otherwise noop
              // enqueueSnackbar?.("Please enter a valid email", { variant: "error" });
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

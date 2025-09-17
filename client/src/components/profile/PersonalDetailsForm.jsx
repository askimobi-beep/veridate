import React, { useMemo, useState, useEffect } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import { Check, CircleHelp, Save } from "lucide-react";
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
  const [countryDemonyms, setCountryDemonyms] = useState(new Map());

  // const handleShare = async () => {
  //   try {
  //     if (navigator.share) {
  //       await navigator.share({
  //         title: "My Profile",
  //         text: "Check out my profile",
  //         url: shareUrl,
  //       });
  //       return;
  //     }
  //     await navigator.clipboard.writeText(shareUrl);
  //     setCopied(true);
  //     setTimeout(() => setCopied(false), 1200);
  //   } catch (err) {
  //     // fallback of fallback — just show prompt
  //     window.prompt("Copy this URL:", shareUrl);
  //   }
  // };

  const emailValid =
    !!formData.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  useEffect(() => {
    let cancelled = false;

    const loadCountries = async () => {
      try {
        // name + demonyms are all we need
        const res = await fetch(
          "https://restcountries.com/v3.1/all?fields=name,demonyms"
        );
        const data = await res.json();

        // build sorted list + demonym map
        const names = [];
        const demMap = new Map();

        for (const c of data) {
          const name = c?.name?.common;
          if (!name) continue;
          names.push(name);

          // demonyms.eng.m / demonyms.eng.f (not always present)
          const m = c?.demonyms?.eng?.m;
          const f = c?.demonyms?.eng?.f;
          const opts = Array.from(new Set([m, f].filter(Boolean)));
          demMap.set(name, opts);
        }

        names.sort((a, b) => a.localeCompare(b));
        if (!cancelled) {
          setCountriesList(names);
          setCountryDemonyms(demMap);
        }
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
      setNationalityOptions([]);
      setCityOptions([]);
      return;
    }

    // 1) nationality from cached demonyms
    const dem = countryDemonyms.get(selected) || [];
    if (dem.length) {
      setNationalityOptions(dem);
      // if current nationality is empty or not in options, default to first
      if (!formData.nationality || !dem.includes(formData.nationality)) {
        handleCustomChange("nationality", dem[0]);
      }
    } else {
      // fallback: "<Country> national"
      const fallback = `${selected} national`;
      setNationalityOptions([fallback]);
      if (!formData.nationality) handleCustomChange("nationality", fallback);
    }

    // 2) cities by country
    let cancelled = false;
    const loadCities = async () => {
      try {
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
        if (!cancelled) setCityOptions(cities);
        // if current city not in list, clear it
        if (formData.city && !cities.includes(formData.city)) {
          handleCustomChange("city", "");
        }
      } catch (e) {
        console.error("Failed to fetch cities", e);
        if (!cancelled) setCityOptions([]);
      }
    };

    loadCities();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.country, countryDemonyms]);

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
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label="Mobile number help"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <CircleHelp className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-sm">
                  Add your primary contact number (with country code). This
                  isn’t shown unless you mark it visible.
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
          options={cityOptions} // 👈 dynamic
          placeholder={
            formData.country ? "Select city" : "Select country first"
          }
          disabled={isDisabled(locked, "city") || !formData.country}
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
          label="Marital Status"
          name="maritalStatus"
          value={formData.maritalStatus}
          onChange={handleChange}
          options={maritalStatuses}
          placeholder="Martial Status"
          disabled={isDisabled(locked, "maritalStatus")}
        />

        <AppSelect
          label="Resident Status"
          name="residentStatus"
          value={formData.residentStatus}
          onChange={handleChange}
          options={residentStatuses}
          placeholder="Resident Status"
          disabled={isDisabled(locked, "residentStatus")}
        />

        <AppSelect
          label="Nationality"
          name="nationality"
          value={formData.nationality}
          onChange={handleChange}
          options={nationalityOptions} // 👈 dynamic
          placeholder={
            formData.country ? "Select nationality" : "Select country first"
          }
          disabled={isDisabled(locked, "nationality") || !formData.country}
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

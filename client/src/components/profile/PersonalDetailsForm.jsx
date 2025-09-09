import React, { useMemo, useState } from "react";
import AppInput from "@/components/form/AppInput";
import AppSelect from "@/components/form/AppSelect";
import FileUploader from "@/components/form/FileUploader";
import CheckboxGroup from "@/components/form/CheckboxGroup";
import {
  UserRound,
  Mail,
  FileText,
  Image as ImageIcon,
  Share2,
  Copy,
  Check,
} from "lucide-react";
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
  resumeRef, // ref from parent for reset()
  profilePicRef, // ref from parent for reset()
  userId, // <-- pass the current user's id down to this component
}) {
  // Prefer env base, else current origin, else fallback to localhost:5173
  // Prefer env base, else current origin, else fallback
  const baseUrl =
    import.meta.env.VITE_PROFILE_BASE_URL ||
    (typeof window !== "undefined" && window.location?.origin) ||
    "http://localhost:5173";

  const shareUrl = useMemo(() => {
    const id = userId || formData?.id || "UNKNOWN_ID";
    return `${baseUrl}/dashboard/profiles/${id}`;
  }, [baseUrl, userId, formData?.id]);

  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: "My Profile",
          text: "Check out my profile",
          url: shareUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      // fallback of fallback — just show prompt
      window.prompt("Copy this URL:", shareUrl);
    }
  };

  return (
    <>
      {/* Share block */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
              Share your profile
            </h3>
            <p className="text-sm text-gray-500">
              One tap to share, fallback copies the link.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="w-[320px] max-w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
            />
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition"
              aria-label="Share profile link"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
              {copied ? "Copied!" : "Share"}
            </button>
            {!navigator.share && (
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }}
                className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                aria-label="Copy profile link"
                title="Copy link"
              >
                <Copy className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* The rest of your form exactly as you had it */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AppInput
          label={
            <>
              <UserRound className="h-4 w-4 text-orange-600" />
              <span>Name</span>
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
              <Mail className="h-4 w-4 text-orange-600" />
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
          label="Mobile"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          placeholder="03XXXXXXXXX"
          disabled={isDisabled(locked, "mobile")}
        />

        <AppInput
          label="CNIC"
          name="cnic"
          value={formData.cnic}
          onChange={handleChange}
          placeholder="35201-XXXXXXX-X"
          disabled={isDisabled(locked, "cnic")}
        />

        <AppInput
          label="City"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="Enter your city"
          disabled={isDisabled(locked, "city")}
        />

        <AppSelect
          label="Country"
          name="country"
          value={formData.country}
          onChange={handleChange}
          options={countries}
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
          placeholder="Select marital status"
          disabled={isDisabled(locked, "maritalStatus")}
        />

        <AppSelect
          label="Resident Status"
          name="residentStatus"
          value={formData.residentStatus}
          onChange={handleChange}
          options={residentStatuses}
          placeholder="Select resident status"
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
        <FileUploader
          ref={resumeRef}
          label="Resume (PDF)"
          name="resume"
          accept="application/pdf"
          icon={FileText}
          onChange={(file) => handleCustomChange("resume", file)}
          disabled={isDisabled(locked, "resume")}
        />
        {/* <FileUploader
          ref={profilePicRef}
          label="Profile Picture (Image)"
          name="profilePic"
          accept="image/*"
          icon={ImageIcon}
          onChange={(file) => handleCustomChange("profilePic", file)}
          disabled={isDisabled(locked, "profilePic")}
        /> */}

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
    </>
  );
}

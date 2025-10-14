import React from "react";
import { cn } from "@/lib/utils";

/**
 * Renders a checkbox-based privacy toggle with associated text label.
 *
 * It is called BlockSwitch in other files, but renamed to PrivacyToggle internally for clarity.
 * @param {object} props
 * @param {boolean} props.checked - If true, the field is considered "Hidden" (i.e., checkbox is checked).
 * @param {function} props.onChange - Handler that receives the new checked state (boolean).
 * @param {string} props.className - Optional className for the wrapper div.
 */
export default function PrivacyToggle({ checked, onChange, className = "" }) {
  const isHidden = checked;

  return (
    <div className={cn("inline-flex items-center gap-2 text-xs", className)}>
      {/* Custom Checkbox */}
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isHidden}
          onChange={(e) => onChange(e.target.checked)}
          className={cn(
            "h-4 w-4 rounded-md border border-gray-300 appearance-none transition-colors duration-200 shrink-0", 
            // Set checked state to use black/gray colors
            "checked:bg-gray-800 checked:border-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1",
            "bg-white",
            // Custom checkmark (use white text on black background)
            isHidden ? 
              "after:content-['✓'] after:block after:text-white after:text-xs after:leading-4 after:text-center" : 
              ""
          )}
        />
      </label>
      
      {/* Permanent Label/Text */}
      <span
        className={cn(
          "select-none transition-colors duration-200",
          // Use near-black/gray for text, bold when hidden
          isHidden ? "text-gray-800 font-medium" : "text-gray-500" 
        )}
      >
        Hide from others
      </span>
    </div>
  );
}

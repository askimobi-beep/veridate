import React from "react";
import { cn } from "@/lib/utils";

export default function CheckboxGroup({
  title,
  options,
  selected,
  onChange,
  disabled = false,
  gridClassName = "",
  extraAfter,
  extraItem,
  extraItemClassName = "",
}) {
  const handleToggle = (value) => {
    if (disabled) return;
    const updated = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      {title && (
        <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
           {title}
        </h3>
      )}
      <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-2", gridClassName)}>
        {options.map((opt) => (
          <React.Fragment key={opt}>
            <label
              className={cn(
                "flex items-center gap-2 rounded border px-3 py-2 text-gray-800",
                disabled
                  ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-60"
                  : "bg-white border-gray-300 cursor-pointer hover:border-[color:var(--brand-orange)]"
              )}
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => handleToggle(opt)}
                disabled={disabled}
                className="accent-[color:var(--brand-orange)]"
              />
              <span>{opt}</span>
            </label>
            {extraAfter === opt && extraItem ? (
              <div className={cn("w-full", extraItemClassName)}>{extraItem}</div>
            ) : null}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

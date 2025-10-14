import React from "react";
import { Gauge, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Renders a stylish credit summary badge.
 * Note: `label` is currently only used by EducationForm (optional heading).
 */
export default function CreditText({ label, available = 0, used = 0, total }) {
  const _available = Number(available || 0);
  const _used = Number(used || 0);
  // Compute total if not explicitly passed (using computed value from mongoose lean call)
  const _total = typeof total === "number" ? total : _available + _used;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Optional Label (used for Institute/Company name in forms) */}
      Verfication Credits


      {/* Total Credits (Blue) */}
      <BadgePill
        icon={Gauge}
        label="Total"
        value={_total}
        className="bg-blue-600/10 text-blue-700"
      />

      {/* Used Credits (Red) */}
      <BadgePill
        icon={Clock}
        label="Used"
        value={_used}
        className="bg-red-600/10 text-red-700"
      />

      {/* Available Credits (Green) */}
      <BadgePill
        icon={CheckCircle}
        label="Available"
        value={_available}
        className="bg-green-600/10 text-green-700"
      />
    </div>
  );
}

/**
 * Helper component for consistent pill styling
 */
const BadgePill = ({ icon: Icon, label, value, className }) => {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="opacity-80">{label}:</span>
      <span>{value}</span>
    </div>
  );
};

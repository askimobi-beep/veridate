import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AppInput({
  label,
  name,
  className,
  inputClassName,
  inputRef,
  disabled = false,
  endAdornment = null,
  startAdornment = null,          // 👈 NEW
  startPaddingClass = "pl-24",    // 👈 NEW: how much left padding when startAdornment exists
  error,
  ...props
}) {
  const hasEnd = !!endAdornment;
  const hasStart = !!startAdornment;

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <Label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 text-left w-full inline-flex items-center gap-2"
        >
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          id={name}
          name={name}
          ref={inputRef}
          disabled={disabled}
          className={cn(
            "bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm",
            "focus-visible:ring-2 focus-visible:ring-[color:var(--brand-orange)] focus-visible:ring-offset-0 focus-visible:border-[color:var(--brand-orange)]",
            disabled && "bg-slate-100 text-slate-500 cursor-not-allowed",
            hasEnd && "pr-10",
            hasStart && startPaddingClass, // 👈 add left padding when using startAdornment
            inputClassName
          )}
          {...props}
        />

        {/* left addon inside the field */}
        {hasStart && (
          <div className="absolute inset-y-0 left-2 flex items-center">
            {startAdornment}
          </div>
        )}

        {/* right addon inside the field */}
        {hasEnd && (
          <div className="absolute inset-y-0 right-2 flex items-center">
            {endAdornment}
          </div>
        )}
      </div>

      {error && <p className="text-xs text-start py-2 text-red-500">{error}</p>}
    </div>
  );
}

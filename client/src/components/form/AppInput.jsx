import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AppInput({
  label,
  name,
  className,
  inputClassName,
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
          disabled={disabled}
          className={cn(
            "bg-white/90 border border-gray-200 text-gray-900 placeholder:text-gray-400",
            "focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0",
            disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
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

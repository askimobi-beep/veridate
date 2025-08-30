import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function AppInput({
  label,
  name,
  className,
  inputClassName,
  disabled = false,
  ...props
}) {
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
      <Input
        id={name}
        name={name}
        disabled={disabled}
        className={cn(
          "bg-white/90 border border-gray-200 text-gray-900 placeholder:text-gray-400",
          "focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-0",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          inputClassName
        )}
        {...props}
      />
    </div>
  );
}

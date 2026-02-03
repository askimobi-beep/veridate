import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const AppSelect = ({
  label,
  labelText,
  placeholder,
  name,
  value,
  onChange,
  options,
  className,
  selectClassName,
  disabled = false,
}) => {
  return (
    <div className={cn("space-y-1 w-full", className)}>
      {label && (
        <Label
          htmlFor={name}
          className="text-sm font-medium text-gray-700 text-left w-full inline-flex items-center gap-2"
        >
          {label}
        </Label>
      )}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={cn(
          "h-10 w-full px-3 rounded-md border border-gray-200 bg-white/90 text-gray-900 placeholder:text-gray-400",
          "focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-0",
          disabled && "bg-gray-100 text-gray-500 cursor-not-allowed",
          selectClassName
        )}
      >
        <option value="">{`${placeholder || label}`}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
};

export default AppSelect;

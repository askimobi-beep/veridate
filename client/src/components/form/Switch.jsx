import React from "react";
import { Switch as ShadSwitch } from "@/components/ui/switch";

export default function BlockSwitch({ checked, onChange, className = "" }) {
  return (
    <ShadSwitch
      checked={checked}
      onCheckedChange={onChange}
      className={`
        relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full
        border border-gray-300 transition-colors duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1
        data-[state=checked]:bg-orange-500
        data-[state=unchecked]:bg-gray-200
        ${className}
      `}
    >
      <span
        className={`
          pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out
          data-[state=checked]:translate-x-4
          data-[state=unchecked]:translate-x-0
        `}
      />
    </ShadSwitch>
  );
}

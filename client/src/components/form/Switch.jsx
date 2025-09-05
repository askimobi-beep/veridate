import React from "react";
import { Switch as ShadSwitch } from "@/components/ui/switch";

// exact dark-track / white-knob look
export default function BlockSwitch({ checked, onChange, className = "" }) {
  return (
    <ShadSwitch
      checked={checked}
      onCheckedChange={onChange}
      className={`h-6 w-11 border-transparent data-[state=checked]:bg-neutral-900 data-[state=unchecked]:bg-neutral-900 ${className}`}
    />
  );
}

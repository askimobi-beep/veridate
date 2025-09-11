// components/common/InfoTip.jsx
import React from "react";
import { CircleHelp } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export default function InfoTip({
  children,
  className = "",
  side = "top",
  align = "center",
  label = "Help",
}) {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* tiny neutral round '?' button */}
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex h-6 w-6 items-center justify-center rounded-full",
              "bg-white/80 backdrop-blur-[1px] ring-1 ring-black/10 shadow-sm",
              "text-gray-600 hover:text-gray-800 hover:ring-black/20",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
              className
            )}
          >
            <CircleHelp className="h-4 w-4" />
          </button>
        </TooltipTrigger>

        {/* black bubble with white text + ARROW, like your screenshot */}
        <TooltipContent
          side={side}
          align={align}
          sideOffset={8}
          className={cn(
            "z-50 rounded-md bg-black text-white px-3 py-1.5 text-sm shadow-md",
            "border border-black/20"
          )}
        >
          {children}
          <TooltipPrimitive.Arrow className="fill-black" width={10} height={6} />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Coins } from "lucide-react";

export default function CreditBadges({ label, available = 0, used = 0, total }) {
  const _total = typeof total === "number" ? total : (available || 0) + (used || 0);

  const Item = ({ text, tone }) => (
    <Badge
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}
    >
      {text}
    </Badge>
  );

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1.5">
            <Badge className="rounded-full px-2.5 py-1 text-[11px] font-semibold bg-zinc-800 text-white">
              <Coins className="h-3.5 w-3.5 mr-1" />
              {label}
            </Badge>
            <Item text={`Available ${available}`} tone="bg-emerald-500 text-white" />
            <Item text={`Used ${used}`} tone="bg-blue-500 text-white" />
            <Item text={`Total ${_total}`} tone="bg-zinc-200 text-zinc-900" />
          </div>
        </TooltipTrigger>
        {/* <TooltipContent side="top" align="start" className="text-xs">
          <div className="font-medium">{label}</div>
          <div className="text-muted-foreground">
            Available: {available} • Used: {used} • Total: {_total}
          </div>
        </TooltipContent> */}
      </Tooltip>
    </TooltipProvider>
  );
}

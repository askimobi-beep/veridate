// src/components/profile/ProDetailBlocks.jsx
import React from "react";
import { Separator } from "@/components/ui/separator";
import { Link as LinkIcon } from "lucide-react";

/* Wrapper spacing that plays nice inside AccordionSection */
export function SectionWrapper({ children }) {
  return <div className="px-1 md:px-0">{children}</div>;
}

/* Fixed columns: 200px label, rest value. Stacks on mobile. */
export function DefinitionList({ children }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr] text-left">
      {children}
    </div>
  );
}

/* Each row = label + value. Always aligned. */
export function DLRow({ label, children }) {
  return (
    <>
      <div className="text-xs uppercase tracking-wide text-muted-foreground pt-2 text-left">{label}</div>
      <div className="text-base font-medium text-foreground text-left">{children ?? ""}</div>
    </>
  );
}

/* Subsection for items (education / experience) */
export function SubSection({ children, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-orange-400/70 bg-transparent text-card-foreground shadow-none ${className}`}
    >
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

export function Line() {
  return <Separator className="my-5" />;
}

export function LinkText({ href, children }) {
  if (!href) return <span className="text-foreground">{children}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="hover:underline hover:underline-offset-4 hover:opacity-80"
    >
      <span>{children}</span>
    </a>
  );
}

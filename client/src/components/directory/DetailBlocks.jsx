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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[200px_1fr]">
      {children}
    </div>
  );
}

/* Each row = label + value. Always aligned. */
export function DLRow({ label, children }) {
  return (
    <>
      <div className="text-xs uppercase tracking-wide text-muted-foreground pt-2">{label}</div>
      <div className="text-base font-medium text-foreground">{children ?? "—"}</div>
    </>
  );
}

/* Subsection for items (education / experience) */
export function SubSection({ children }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
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
      className="inline-flex items-center gap-1 underline underline-offset-4 hover:opacity-80"
    >
      <LinkIcon className="h-3.5 w-3.5" />
      <span>{children}</span>
    </a>
  );
}

// components/navbar/CreditsPill.jsx
import { GraduationCap, Briefcase } from "lucide-react";

export default function CreditsPill({ credit }) {
  const education = credit?.education ?? 0;
  const experience = credit?.experience ?? 0;

  return (
    <div className="hidden md:flex items-center gap-3 rounded-full px-3 py-1.5 bg-white/70 backdrop-blur ring-1 ring-black/5 shadow-sm">
      <div className="flex items-center gap-1.5 text-sm text-gray-800">
        <GraduationCap className="h-4 w-4 text-[color:var(--brand-orange)]" />
        <span className="font-medium">Edu</span>
        <span className="ml-1 inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full bg-[color:var(--brand-orange)]/10 text-[color:var(--brand-orange)] text-xs px-2 font-semibold">
          {education}
        </span>
      </div>

      <div className="h-4 w-px bg-gray-300/70" />

      <div className="flex items-center gap-1.5 text-sm text-gray-800">
        <Briefcase className="h-4 w-4 text-blue-600" />
        <span className="font-medium">Exp</span>
        <span className="ml-1 inline-flex h-5 min-w-[1.4rem] items-center justify-center rounded-full bg-blue-600/10 text-blue-700 text-xs px-2 font-semibold">
          {experience}
        </span>
      </div>
    </div>
  );
}

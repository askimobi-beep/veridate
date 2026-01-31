import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Download,
  MessageCircle,
  ArrowRight,
} from "lucide-react";
import { initials } from "@/utils/profileUtils";
import axiosInstance from "@/utils/axiosInstance";
import buildProfilePdf from "@/utils/buildProfilePdf";

async function toDataUrl(url) {
  try {
    if (!url) return "";
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result || "");
      r.onerror = () => resolve("");
      r.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

const yearOf = (value) => {
  if (!value) return "�";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "�";
  return String(dt.getFullYear());
};

const formatRange = (start, end) => `${yearOf(start)} - ${yearOf(end)}`;

const normalizeList = (value) => {\r\n  if (Array.isArray(value)) return value;\r\n  return value ? [value] : [];\r\n};\r\n\r\nconst sortLatest = (list = []) => {\r\n  const copy = [...normalizeList(list)];
  copy.sort((a, b) => {
    const ad = new Date(a?.endDate || a?.startDate || 0).getTime();
    const bd = new Date(b?.endDate || b?.startDate || 0).getTime();
    return bd - ad;
  });
  return copy.slice(0, 3);
};

export default function DirectoryCard({ profile }) {
  const [downloading, setDownloading] = useState(false);
  const location = [profile.city, profile.country].filter(Boolean).join(", ");
  const experiences = sortLatest(profile.experience);
  const projects = sortLatest(profile.projects);
  const educations = sortLatest(profile.education);

  const handleDownload = async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      const res = await axiosInstance.get(
        `/profile/getonid/${encodeURIComponent(profile.user)}`
      );
      const payload = res?.data;
      if (!payload) return;
      const photoSrc = await toDataUrl(payload.profilePicUrl);
      const profileUrl = `${window.location.origin}/dashboard/profiles/${profile.user}`;
      const pdf = await buildProfilePdf({
        data: payload,
        photoDataUrl: photoSrc,
        profileUrl,
      });
      pdf.save(`Profile_${payload?.name || profile.user}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="hover:shadow-xl transition rounded-2xl border border-gray-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12 ring-2 ring-orange-200">
              <AvatarImage src={profile.profilePicUrl || ""} alt={profile.name} />
              <AvatarFallback>{initials(profile.name)}</AvatarFallback>
            </Avatar>
            <div className="text-left">
              <div className="text-base font-semibold text-slate-800">
                {profile.name || "Unnamed"}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5" />
                <span>{location || "�"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              title="Save"
            >
              <Star className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              title="Download profile"
            >
              <Download className="mx-auto h-4 w-4" />
            </button>
            <button
              type="button"
              className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
              title="Message"
            >
              <MessageCircle className="mx-auto h-4 w-4" />
            </button>
            <Link to={`/dashboard/profiles/${profile.user}`}>
              <button
                type="button"
                className="h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-orange-300 hover:text-orange-600"
                title="View full profile"
              >
                <ArrowRight className="mx-auto h-4 w-4" />
              </button>
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <div>
            <div className="font-semibold text-slate-700">Experience</div>
            <div className="mt-1 space-y-1">
              {experiences.length ? (
                experiences.map((row, idx) => (
                  <div key={`exp-${idx}`}>
                    {row.jobTitle || "�"} | {row.company || "�"} |{" "}
                    {formatRange(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No experience added.</div>
              )}
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-700">Project</div>
            <div className="mt-1 space-y-1">
              {projects.length ? (
                projects.map((row, idx) => (
                  <div key={`proj-${idx}`}>
                    {row.projectTitle || "�"} | {row.company || "�"} |{" "}
                    {formatRange(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No projects added.</div>
              )}
            </div>
          </div>

          <div>
            <div className="font-semibold text-slate-700">Education</div>
            <div className="mt-1 space-y-1">
              {educations.length ? (
                educations.map((row, idx) => (
                  <div key={`edu-${idx}`}>
                    {row.degreeTitle || "�"} | {row.institute || "�"} |{" "}
                    {formatRange(row.startDate, row.endDate)}
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-400">No education added.</div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


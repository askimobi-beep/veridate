// src/pages/ProfilePdfDownload.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import buildProfilePdf from "@/utils/buildProfilePdf";

const toYMD = (d) => {
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, "0"),
    String(dt.getDate()).padStart(2, "0"),
  ].join("-");
};

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

export default function ProfilePdfDownload({
  userId: userIdProp,
  inline = false,
  label = "Download",
  className = "",
}) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null);
  const [photoSrc, setPhotoSrc] = useState("");

  const userId = useMemo(() => {
    if (userIdProp) return userIdProp;
    const parts =
      typeof window !== "undefined"
        ? window.location.pathname.split("/").filter(Boolean)
        : [];
    if (parts[0] === "profile" && parts[2] === "pdf") return parts[1];
    const u =
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search).get("userId")
        : "";
    return u || "";
  }, [userIdProp]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        if (!userId) throw new Error("No userId provided");
        const res = await axiosInstance.get(`/profile/getonid/${userId}`);
        const payload = res?.data;
        if (!payload || typeof payload !== "object")
          throw new Error("Invalid API response");
        if (cancelled) return;
        setData(payload);
        const img = await toDataUrl(payload.profilePicUrl);
        if (!cancelled) setPhotoSrc(img);
      } catch (e) {
        if (!cancelled)
          setErr(
            e?.response?.data?.error || e?.message || "Failed to fetch profile"
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleDownload = async () => {
    if (!data) return;
    try {
      setDownloading(true);
      const profileUrl = `http://localhost:5173/dashboard/profiles/${userId}`; // dynamic user id
      const pdf = await buildProfilePdf({
        data,
        photoDataUrl: photoSrc,
        profileUrl,
      });
      pdf.save(`Profile_${data?.name || userId}_${toYMD(new Date())}.pdf`);
    } catch (e) {
      console.error(e);
      alert(e?.message || "Failed to generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  const isDisabled = downloading || !data || loading || !!err;
  const buttonLabel = downloading ? "Building..." : label;
  const buttonClassName = [
    "inline-flex items-center gap-2 rounded-xl text-white bg-[color:var(--brand-orange)] hover:bg-[color:var(--brand-orange)] active:scale-[0.98] shadow-sm transition",
    inline ? "px-4 py-2 text-sm font-semibold" : "px-6 py-3",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const button = (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isDisabled}
      className={buttonClassName}
      title={err || undefined}
    >
      {buttonLabel}
    </button>
  );

  if (!inline && loading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <span>Loading...</span>
      </div>
    );
  }
  if (!inline && err) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div style={{ color: "crimson" }}>{err}</div>
      </div>
    );
  }

  if (inline) return button;

  // Minimal UI: single button; PDF contains all styling
  return <div className="flex items-end justify-end p-3">{button}</div>;
}

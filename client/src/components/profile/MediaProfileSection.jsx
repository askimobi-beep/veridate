import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Save, UploadCloud, X } from "lucide-react";

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function MediaProfileSection({
  kind,
  title,
  icon: Icon,
  formData,
  handleCustomChange,
  locked,
  allowWhenLocked = false,
  onAskConfirm,
  savePersonalInfo,
  saving,
}) {
  const field = kind === "video" ? "videoProfile" : "audioProfile";
  const folder = kind === "video" ? "video" : "audio";
  const accept = kind === "video" ? "video/*" : "audio/*";
  const baseUploads = import.meta.env.VITE_API_PIC_URL
    ? `${import.meta.env.VITE_API_PIC_URL}/uploads`
    : "/uploads";

  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const inputRef = useRef(null);
  const previewRef = useRef("");
  const [isEditing, setIsEditing] = useState(!locked);
  const [awaitingSave, setAwaitingSave] = useState(false);
  const [sawSaving, setSawSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const disabled = (!!locked && !allowWhenLocked && !isEditing) || !isEditing;

  useEffect(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = "";
    }

    const value = formData?.[field];
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      previewRef.current = url;
      setPreviewUrl(url);
      return;
    }
    if (typeof value === "string" && value) {
      setPreviewUrl(`${baseUploads}/${folder}/${value}`);
      return;
    }
    setPreviewUrl("");
  }, [baseUploads, field, folder, formData?.[field]]);

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    if (!locked) {
      setIsEditing(true);
    } else if (!allowWhenLocked) {
      setIsEditing(false);
    }
  }, [locked, allowWhenLocked]);

  useEffect(() => {
    if (awaitingSave && saving) {
      setSawSaving(true);
    }
    if (awaitingSave && sawSaving && !saving) {
      setSaved(true);
      setIsEditing(false);
      setAwaitingSave(false);
      setSawSaving(false);
    }
  }, [awaitingSave, saving, sawSaving]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MEDIA_BYTES) {
      setError(`${title} must be 50 MB or less.`);
      return;
    }
    setError("");
    handleCustomChange(field, file);
  };

  const clearFile = () => {
    setError("");
    handleCustomChange(field, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const fileLabel =
    formData?.[field] instanceof File
      ? `${formData[field].name} (${formatBytes(formData[field].size)})`
      : typeof formData?.[field] === "string" && formData?.[field]
      ? formData[field]
      : "";
  const hasSelection = !!fileLabel || !!previewUrl;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-700">
                Upload {title}
              </div>
              <div className="text-xs text-slate-500">
                Max 50 MB • {accept}
              </div>
            </div>
            <label
              className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition ${
                disabled
                  ? "opacity-60 cursor-not-allowed"
                  : "cursor-pointer hover:border-orange-200 hover:text-orange-600"
              }`}
            >
              <UploadCloud className="h-4 w-4" />
              Choose file
              <Input
                ref={inputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                disabled={disabled}
                className="hidden"
              />
            </label>
          </div>

          {hasSelection ? (
            <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-slate-700 break-all">
                  {fileLabel || `${title} selected`}
                </div>
                {previewUrl ? (
                  <a
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700"
                    href={previewUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open file
                  </a>
                ) : null}
              </div>
              {previewUrl && kind === "audio" ? (
                <audio controls className="mt-3 w-full" src={previewUrl} />
              ) : null}
              {previewUrl && kind === "video" ? (
                <video
                  controls
                  className="mt-3 w-full rounded-lg"
                  src={previewUrl}
                />
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/70 bg-white/80 p-4 text-sm text-slate-500">
              No {kind} uploaded yet.
            </div>
          )}

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          {hasSelection && !disabled ? (
            <button
              type="button"
              onClick={clearFile}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
              Clear selection
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSaved(false);
              setIsEditing(true);
            }}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
              isEditing
                ? "border-slate-200 text-slate-400 cursor-default"
                : "border-slate-300 text-slate-700 hover:border-orange-200 hover:text-orange-600"
            }`}
            disabled={isEditing}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setAwaitingSave(true);
              setSawSaving(false);
              onAskConfirm?.(`media:${kind}`, title, () => savePersonalInfo());
            }}
            disabled={disabled || !!saving || (saved && !isEditing)}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : saved && !isEditing ? "Saved" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

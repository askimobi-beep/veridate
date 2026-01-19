import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Save, UploadCloud, X } from "lucide-react";

const MAX_MEDIA_BYTES = 50 * 1024 * 1024;

export default function MediaProfileSection({
  kind,
  title,
  icon: Icon,
  formData,
  handleCustomChange,
  locked,
  allowWhenLocked = true,
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
  const disabled = !!locked && !allowWhenLocked;

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

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const clearFile = () => {
    setError("");
    handleCustomChange(field, null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatLabel = kind === "video" ? "mp4" : "mp3";
  const uploadNewLabel = kind === "video" ? "Upload New Video" : "Upload New Audio";

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <label
            className={`inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition ${
              disabled
                ? "opacity-60 cursor-not-allowed"
                : "cursor-pointer hover:border-orange-200 hover:text-orange-600"
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            {kind === "video" ? "Upload Video File" : "Upload Audio File"}
            <Input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              disabled={disabled}
              className="hidden"
            />
          </label>
          <div className="text-xs text-slate-500">
            Max Size: 50 MB, Format: {formatLabel}
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>

        {previewUrl && kind === "audio" ? (
          <audio controls className="mt-4 w-full" src={previewUrl} />
        ) : null}
        {previewUrl && kind === "video" ? (
          <video controls className="mt-4 w-full rounded-lg" src={previewUrl} />
        ) : null}
      </div>

      <div className="flex justify-center">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() =>
              onAskConfirm?.(`media:${kind}`, title, () => savePersonalInfo())
            }
            disabled={disabled || !!saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={clearFile}
            disabled={disabled || !previewUrl}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X className="h-4 w-4" />
            Delete
          </button>
          <button
            type="button"
            onClick={handlePick}
            disabled={disabled}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-orange-200 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloud className="h-4 w-4" />
            {uploadNewLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

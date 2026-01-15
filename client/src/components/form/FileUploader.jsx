"use client";

import React, {
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { UploadCloud, File as FileIcon, X } from "lucide-react";

const humanFileSize = (bytes = 0) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default forwardRef(function FileUploader(
  {
    label,
    name,
    icon,
    accept,
    onChange, // (file|null) => void
    className,
    error,
    disabled = false,
    defaultPreviewUrl, // optional: show an existing image url
  },
  ref
) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultPreviewUrl || "");
  const [isDragging, setIsDragging] = useState(false);
  const Icon = icon === null ? null : icon || UploadCloud;

  const isImage = (f) => !!f && /^image\//.test(f.type || "");

  const setFromFile = (f) => {
    if (!f) return;
    setFile(f);
    if (isImage(f)) {
      const url = URL.createObjectURL(f);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("");
    }
    onChange && onChange(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFromFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) setFromFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const clear = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
    onChange && onChange(null);
  };

  useImperativeHandle(ref, () => ({
    reset: clear,
    getFile: () => file,
  }));

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="inline-flex items-center gap-2 text-gray-700 text-sm font-medium">
          {Icon ? <Icon className="h-4 w-4 text-orange-600" /> : null}
          {label}
        </Label>
      )}

      {/* DROPZONE (the file input overlay only covers this box) */}
      <div
        className={cn(
          "relative border-2 border-dashed rounded-xl p-4 shadow-sm group transition",
          disabled
            ? "bg-gray-100 opacity-60 cursor-not-allowed"
            : "bg-white/90 hover:border-orange-500 border-gray-300",
          isDragging && !disabled
            ? "border-orange-500 ring-2 ring-orange-200"
            : ""
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Invisible overlay that opens the file picker – it only covers THIS box */}
        <Input
          ref={inputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleInputChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="flex items-center justify-center text-center pointer-events-none min-h-[70px]">
          {!file && !previewUrl && (
            <div className="flex flex-col items-center gap-1">
              {Icon ? <Icon className="w-6 h-6 text-orange-500" /> : null}
              <p className="text-xs text-gray-500 group-hover:text-orange-600 transition">
                {disabled
                  ? "Upload disabled"
                  : isDragging
                  ? "Drop it..."
                  : "Click or drag to upload"}
              </p>
              {accept && <p className="text-xs text-gray-400">{accept}</p>}
            </div>
          )}

          {(isImage(file) || (!!previewUrl && !file)) && (
            <div className="relative w-full pointer-events-none">
              <img
                src={previewUrl || ""}
                alt={file?.name || "Preview"}
                className="max-h-60 w-auto mx-auto rounded-lg object-contain"
              />
              {file && (
                <div className="mt-2 text-xs text-gray-600 text-center">
                  {file.name} · {humanFileSize(file.size)}
                </div>
              )}
            </div>
          )}

          {file && !isImage(file) && (
            <div className="flex flex-col items-center gap-2">
              <FileIcon className="w-8 h-8 text-orange-500" />
              <div className="text-sm text-gray-700">{file.name}</div>
              <div className="text-xs text-gray-500">
                {humanFileSize(file.size)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLEAR BUTTON OUTSIDE the dropzone (so the overlay can't catch the click) */}
      {(file || previewUrl) && !disabled && (
        <div className="flex justify-end">
          <button
            type="button"
            className="relative z-20 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              clear();
            }}
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
});

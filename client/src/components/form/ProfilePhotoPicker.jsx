"use client";

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
} from "react";
import { createPortal } from "react-dom";
import { X, Camera, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export default forwardRef(function ProfilePhotoPicker(
  {
    name = "profilePic",
    label = null, // hide label by default
    defaultPreviewUrl = "",
    disabled = false,
    accept = "image/*",
    onChange, // (file|null) => void
    className,
    avatarClassName = "h-14 w-14", // control avatar size from parent
    modalZ = 9999, // keep modal above your UI
    fallbackText = "", // initials or anything when no image
  },
  ref
) {
  const inputRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(defaultPreviewUrl || "");
  const [mounted, setMounted] = useState(false); // SSR-safe portal

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // sync external url (e.g. after fetch/save)
    setPreviewUrl(defaultPreviewUrl || "");
  }, [defaultPreviewUrl]);

  // lock body scroll when modal is open (LinkedIn vibe)
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const isImage = (f) => !!f && /^image\//.test(f.type || "");

  const setFromFile = (f) => {
    if (!f) return;
    setFile(f);
    if (isImage(f)) {
      const url = URL.createObjectURL(f);
      setPreviewUrl((prev) => {
        if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
        return url;
      });
    }
    onChange && onChange(f);
    setOpen(false); // close modal after picking for snappy UX
  };

  const handlePick = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFromFile(f);
  };

  const clear = () => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(null);
    setPreviewUrl("");
    if (inputRef.current) inputRef.current.value = "";
    onChange && onChange(null);
  };

  useImperativeHandle(ref, () => ({
    reset: clear,
    getFile: () => file,
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));

  const Modal = (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: modalZ }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-lg rounded-2xl bg-[#111] text-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h3 className="text-base font-semibold">Profile photo</h3>
          <button
            className="p-1 rounded hover:bg-white/10"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-4">
          <div className="h-44 w-44 rounded-full overflow-hidden border border-white/10">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full grid place-items-center bg-white/5 text-white/70">
                {fallbackText ? (
                  <span className="text-xl font-bold">{fallbackText}</span>
                ) : (
                  <Camera className="h-8 w-8" />
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-3 gap-3 w-full">
            <button
              type="button"
              onClick={handlePick} // placeholder for future cropper
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
            >
              <Pencil className="h-4 w-4" />
              Edit
            </button>

            <button
              type="button"
              onClick={handlePick}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-100"
            >
              <Camera className="h-4 w-4" />
              Upload
            </button>

            <button
              type="button"
              onClick={() => {
                clear();
                setOpen(false);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 text-red-400 px-4 py-2 text-sm hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>

          {/* Hidden input (kept inside portal so iOS pickers behave) */}
          <input
            ref={inputRef}
            type="file"
            name={name}
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <p className="text-sm font-medium text-gray-700">{label}</p>
      ) : null}

      {/* Avatar button in-page */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "relative rounded-full overflow-hidden border-2 border-white shadow-md",
          "ring-0 outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          "aspect-square object-cover",
          disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
          avatarClassName
        )}
        aria-label="Open profile photo options"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Profile"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full grid place-items-center bg-gray-100 text-gray-700">
            {fallbackText ? (
              <span className="text-sm font-bold">{fallbackText}</span>
            ) : (
              <Camera className="h-6 w-6" />
            )}
          </div>
        )}

        {!disabled && (
          <div className="absolute inset-0 bg-black/0 hover:bg-black/40 transition grid place-items-center">
            <span className="opacity-0 hover:opacity-100 text-white text-[11px] px-2 py-0.5 rounded-md">
              Update
            </span>
          </div>
        )}
      </button>

      {/* Portal renders modal at <body> level so it never gets clipped */}
      {mounted && open ? createPortal(Modal, document.body) : null}
    </div>
  );
});

  "use client";

  import React, {
    forwardRef,
    useImperativeHandle,
    useRef,
    useState,
    useEffect,
  } from "react";
  import { createPortal } from "react-dom";
  import Cropper from "react-easy-crop";
  import { X, Camera, Trash2, Pencil, Check, RotateCcw } from "lucide-react";
  import { cn } from "@/lib/utils";

  // util: turn cropped area into a File
  async function getCroppedFile(imageSrc, cropPixels, fileName = "avatar.jpg") {
    const image = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const { width, height, x, y } = cropPixels;
    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(image, x, y, width, height, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        // default to jpeg to keep size small
        const file = new File([blob], fileName, { type: "image/jpeg" });
        resolve(file);
      }, "image/jpeg", 0.92);
    });
  }

  export default forwardRef(function ProfilePhotoPicker(
    {
      name = "profilePic",
      label = null,
      defaultPreviewUrl = "",
      disabled = false,
      accept = "image/*",
      onChange,          // (file|null)
      onSave,            // () => Promise<void>
      className,
      avatarClassName = "h-24 w-24", // slightly bigger default
      modalZ = 9999,
      fallbackText = "",
    },
    ref
  ) {
    const inputRef = useRef(null);
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(defaultPreviewUrl || "");
    const [mounted, setMounted] = useState(false);
    const [saving, setSaving] = useState(false);

    // crop state
    const [isCropping, setIsCropping] = useState(false);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedPixels, setCroppedPixels] = useState(null);
    const [cropSourceUrl, setCropSourceUrl] = useState(""); // what we crop from

    useEffect(() => setMounted(true), []);
    useEffect(() => {
      setPreviewUrl(defaultPreviewUrl || "");
      setFile(null);
    }, [defaultPreviewUrl]);

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
        setCropSourceUrl(url);
      }
      onChange && onChange(f);
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
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
      setFile(null);
      setPreviewUrl("");
      setCropSourceUrl("");
      if (inputRef.current) inputRef.current.value = "";
      onChange && onChange(null);
    };

    useImperativeHandle(ref, () => ({
      reset: clear,
      getFile: () => file,
      open: () => setOpen(true),
      close: () => setOpen(false),
    }));

    const handleSave = async () => {
      if (disabled || !onSave) return;
      try {
        setSaving(true);
        await onSave();
        setOpen(false);
      } finally {
        setSaving(false);
      }
    };

    // start crop from current preview (existing or newly uploaded)
    const startCrop = () => {
      if (!previewUrl) return;
      setIsCropping(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
      setCroppedPixels(null);
      setCropSourceUrl(previewUrl);
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
      setCroppedPixels(croppedAreaPixels);
    };

    const applyCrop = async () => {
      if (!cropSourceUrl || !croppedPixels) return;
      const croppedFile = await getCroppedFile(cropSourceUrl, croppedPixels, "avatar.jpg");
      setFromFile(croppedFile); // updates preview + onChange
      setIsCropping(false);
    };

    const cancelCrop = () => {
      setIsCropping(false);
    };

    const Modal = (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: modalZ }}
        aria-modal="true"
        role="dialog"
      >
        <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />

        <div className="relative w-full max-w-xl rounded-2xl bg-[#0f0f0f] text-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="text-base font-semibold">
              {isCropping ? "Crop image" : "Profile photo"}
            </h3>
            <button
              className="p-1 rounded hover:bg-white/10"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-6 py-6 flex flex-col items-center gap-6">
            {/* Avatar + hover controls (outside) */}
            {!isCropping && (
              <div className="relative group">
                <div className="h-44 w-44 rounded-full overflow-hidden border border-white/10">
                  {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
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

                {/* OUTSIDE buttons that appear on hover (desktop) */}
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0",
                    "flex items-center justify-center"
                  )}
                >
                  {/* Right rail container */}
                  <div className="absolute -right-14 top-1/2 -translate-y-1/2 flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={startCrop}
                      className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full bg-white text-black shadow-md opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                      aria-label="Edit (crop)"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={clear}
                      className="pointer-events-auto inline-flex items-center justify-center h-10 w-10 rounded-full bg-red-500 text-white shadow-md opacity-0 group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Cropper */}
            {isCropping && (
              <div className="relative w-full h-80 rounded-xl overflow-hidden bg-black/40">
                <Cropper
                  image={cropSourceUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  restrictPosition={false}
                />
                {/* crop controls */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-white/10 backdrop-blur rounded-full px-3 py-2">
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.01}
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="w-52 accent-white"
                  />
                  <button
                    type="button"
                    onClick={() => { setZoom(1); setCrop({ x: 0, y: 0 }); }}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25"
                    title="Reset"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            {!isCropping ? (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={handlePick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                  disabled={disabled || saving}
                >
                  <Camera className="h-4 w-4" />
                  New upload
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-xl",
                    "bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-100",
                    saving && "opacity-80 cursor-wait"
                  )}
                  disabled={disabled || saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  type="button"
                  onClick={cancelCrop}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={applyCrop}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:bg-gray-100"
                >
                  <Check className="h-4 w-4" />
                  Apply
                </button>
              </div>
            )}

            {/* Hidden input */}
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
        {label ? <p className="text-sm font-medium text-gray-700">{label}</p> : null}

        {/* avatar trigger */}
        <div className="relative group inline-block">
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
              <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full grid place-items-center bg-gray-100 text-gray-700">
                {fallbackText ? <span className="text-sm font-bold">{fallbackText}</span> : <Camera className="h-6 w-6" />}
              </div>
            )}
          </button>

          {/* small hover hint */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition rounded-full pointer-events-none" />
          )}
        </div>

        {mounted && open ? createPortal(Modal, document.body) : null}
      </div>
    );
  });

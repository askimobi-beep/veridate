import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Save } from "lucide-react"; // Save added

const containerAnim = { duration: 0.45, ease: [0.25, 1, 0.5, 1] };
const chevronSpring = { type: "spring", stiffness: 200, damping: 20 };
const bodyAnim = { duration: 0.35, ease: [0.22, 1, 0.36, 1] };

export default function AccordionSection({
  title,
  icon: Icon,
  value,
  openValue,
  setOpenValue,
  locked = false,
  saving = false,
  onSave,
  onAskConfirm,
  children,
  contentClassName = "",
  headerClassName = "",
  className = "",
}) {
  const isOpen = openValue === value;

  return (
    <motion.div
      layout
      transition={containerAnim}
      className={`mb-6 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-500 ${
        isOpen
          ? "border-white/20 bg-white/60 text-gray-800"
          : "border-white/10 bg-orange-200 text-black"
      } ${locked ? "opacity-90" : ""} ${className}`}
    >
      {/* Accordion Header */}
      <motion.button
        type="button"
        layout
        onClick={() => setOpenValue(isOpen ? null : value)}
        className={`w-full flex items-center justify-between px-6 py-4 text-base md:text-lg font-semibold ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
      >
        <span className="flex items-center gap-2">
          <Icon
            className={`h-5 w-5 ${
              isOpen ? "text-orange-600" : "text-orange-600"
            }`}
          />
          {title}
          {/* Optional locked badge */}
          {/* {locked && (
            <span className="flex items-center gap-1 ml-2">
              <span className="rounded-full bg-red-500 text-white text-xs px-2 py-0.5">
                Locked
              </span>
              <Lock className="h-4 w-4 text-red-500" />
            </span>
          )} */}
        </span>

        <motion.span
          layout
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={chevronSpring}
          className={`text-xl font-bold ${
            isOpen ? "text-orange-700" : "text-orange-600"
          }`}
        >
          {isOpen ? "−" : "+"}
        </motion.span>
      </motion.button>

      {/* Accordion Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${value}`}
            key="content"
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={bodyAnim}
            className={`px-6 pb-6 origin-top ${contentClassName}`}
          >
            {/* Top Save button */}
            {onSave && (
              <div className="mb-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAskConfirm?.(value, title, onSave)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}

            {/* Children (form content etc.) */}
            {typeof children === "function"
              ? children({ disabled: locked })
              : children}

            {/* Bottom Save button */}
            {onSave && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => onAskConfirm?.(value, title, onSave)}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl border border-orange-600 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 active:scale-[0.98] transition"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

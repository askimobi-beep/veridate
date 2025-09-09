import React from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Lock } from "lucide-react";

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
  onSave,           // async fn
  onAskConfirm,     // (value, title, onSave) => void
  children,
  // 🔽 NEW:
  contentClassName = "", // classes applied to the content wrapper
  headerClassName = "",  // classes applied to the header row
  className = "",        // classes applied to outer container
}) {
  const isOpen = openValue === value;

  return (
    <motion.div
      layout
      transition={containerAnim}
      className={`mb-6 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-500 ${
        isOpen
          ? "border-white/20 bg-white/60 text-gray-800"
          : "border-white/10 bg-gradient-to-br from-[#1e1e2f] via-[#2c2c3a] to-[#1e1e2f] text-white"
      } ${locked ? "opacity-90" : ""} ${className}`}
    >
      <motion.button
        type="button"
        layout
        onClick={() => setOpenValue(isOpen ? null : value)}
        className={`w-full flex items-center justify-between px-6 py-4 text-base md:text-lg font-semibold ${headerClassName}`}
        // a11y niceties:
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
      >
        <span className="flex items-center gap-2">
          <Icon className={`h-5 w-5 ${isOpen ? "text-orange-600" : "text-orange-300"}`} />
          {title}
          {locked && (
            <span className="flex items-center gap-1 ml-2">
              <span className="rounded-full bg-red-500 text-white text-xs px-2 py-0.5">Locked</span>
              <Lock className="h-4 w-4 text-red-500" />
            </span>
          )}
        </span>

        <motion.span
          layout
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={chevronSpring}
          className={`text-xl font-bold ${isOpen ? "text-orange-700" : "text-orange-400"}`}
        >
          {isOpen ? "−" : "+"}
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`accordion-content-${value}`}
            key="content"
            initial={{ opacity: 0, scaleY: 0.95 }}
            animate={{ opacity: 1, scaleY: 1 }}
            exit={{ opacity: 0, scaleY: 0.95 }}
            transition={bodyAnim}
            className={`px-6 pb-6 origin-top ${contentClassName}`} // 🔽 use it here
          >
            {typeof children === "function" ? children({ disabled: locked }) : children}

            {onSave && (
              <div className="mt-4 flex justify-end">
                <Button
                  onClick={() => onAskConfirm?.(value, title, onSave)}
                  disabled={saving}
                  type="button"
                  className={`${saving ? "opacity-60 cursor-not-allowed" : ""}`}
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

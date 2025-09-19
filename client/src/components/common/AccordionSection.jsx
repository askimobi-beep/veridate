import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const CARD_TRANSITION = { type: "spring", stiffness: 300, damping: 28 };
const CHEVRON_SPRING = { type: "spring", stiffness: 220, damping: 18 };

export default function AccordionSection({
  title,
  icon: Icon,
  value,
  openValue,
  setOpenValue,
  locked = false,
  children,
  contentClassName = "",
  headerClassName = "",
  className = "",
}) {
  const isOpen = openValue === value;
  const prefersReducedMotion = useReducedMotion();

  // Variants for the collapsible body
  const bodyVariants = {
    open: {
      height: "auto",
      opacity: 1,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        height: { ...CARD_TRANSITION },
        opacity: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
        scale: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: 0.18 },
      },
    },
    collapsed: {
      height: 0,
      opacity: 0,
      scale: 0.98,
      filter: "blur(2px)",
      transition: {
        height: { ...CARD_TRANSITION },
        opacity: { duration: 0.14, ease: [0.4, 0, 1, 1] },
        scale: { duration: 0.14 },
        filter: { duration: 0.14 },
      },
    },
  };

  return (
    <motion.section
      layout="position"
      className={`mb-6 rounded-2xl border shadow-xl backdrop-blur-md transition-colors duration-300 ${
        isOpen
          ? "border-white/20 bg-white/60 text-gray-800"
          : "border-white/10 bg-orange-200 text-black"
      } ${locked ? "opacity-90" : ""} ${className}`}
      whileHover={!isOpen ? { scale: prefersReducedMotion ? 1 : 1.002 } : undefined}
      transition={CARD_TRANSITION}
    >
      {/* Header */}
      <motion.button
        type="button"
        className={`w-full flex items-center justify-between px-6 py-4 text-base md:text-lg font-semibold ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${value}`}
        onClick={() => setOpenValue(isOpen ? null : value)}
        initial={false}
        whileTap={{ scale: prefersReducedMotion ? 1 : 0.995 }}
      >
        <span className="flex items-center gap-2">
          {Icon ? (
            <Icon className={`h-5 w-5 ${isOpen ? "text-orange-600" : "text-orange-600"}`} />
          ) : null}
          {title}
        </span>

        <motion.span
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={CHEVRON_SPRING}
          className={`text-xl font-bold ${isOpen ? "text-orange-700" : "text-orange-600"}`}
        >
          {isOpen ? "−" : "+"}
        </motion.span>
      </motion.button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            id={`accordion-content-${value}`}
            role="region"
            aria-labelledby={`accordion-header-${value}`}
            className={`px-6 pb-6 origin-top ${contentClassName}`}
            style={{ overflow: "hidden" }}
            initial={prefersReducedMotion ? false : "collapsed"}
            animate={prefersReducedMotion ? { height: "auto", opacity: 1 } : "open"}
            exit={prefersReducedMotion ? { height: 0, opacity: 0 } : "collapsed"}
            variants={bodyVariants}
            layout
          >
            {typeof children === "function" ? children({ disabled: locked }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

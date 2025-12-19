import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const CARD_TRANSITION = { type: "spring", stiffness: 240, damping: 24, mass: 0.9 };
const CHEVRON_SPRING = { type: "spring", stiffness: 210, damping: 18 };
const SECTION_VARIANTS = {
  open: {
    boxShadow: "0 28px 65px -40px rgba(249, 115, 22, 0.55)",
    y: 0,
    scale: 1,
    transition: {
      boxShadow: { duration: 0.45 },
      y: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
      scale: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
    },
  },
  collapsed: {
    boxShadow: "0 18px 45px -38px rgba(249, 115, 22, 0.35)",
    y: 6,
    scale: 0.998,
    transition: {
      boxShadow: { duration: 0.35 },
      y: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
      scale: { duration: 0.28, ease: [0.4, 0, 0.2, 1] },
    },
  },
};

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
  const sectionAnimation = prefersReducedMotion
    ? {}
    : { animate: isOpen ? "open" : "collapsed", variants: SECTION_VARIANTS };
  const bodyMotionVariants = React.useMemo(
    () =>
      prefersReducedMotion
        ? undefined
        : {
            open: {
              height: "auto",
              opacity: 1,
              y: 0,
              scaleY: 1,
              filter: "blur(0px)",
              transition: {
                height: { ...CARD_TRANSITION, stiffness: 210 },
                opacity: { duration: 0.24, ease: [0.16, 1, 0.3, 1], delay: 0.04 },
                y: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
                scaleY: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
                filter: { duration: 0.24, ease: "linear" },
              },
            },
            collapsed: {
              height: 0,
              opacity: 0,
              y: -12,
              scaleY: 0.95,
              filter: "blur(6px)",
              transition: {
                height: { ...CARD_TRANSITION, stiffness: 260 },
                opacity: { duration: 0.18, ease: [0.4, 0, 0.2, 1] },
                y: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
                scaleY: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                filter: { duration: 0.18 },
              },
            },
          },
    [prefersReducedMotion]
  );
  const headerId = `accordion-header-${value}`;
  const contentId = `accordion-content-${value}`;

  return (
    <motion.section
      layout
      initial={false}
      {...sectionAnimation}
      className={`group relative mb-6 overflow-hidden rounded-3xl border backdrop-blur-xl transition-colors duration-300 ${
        isOpen
          ? "border-orange-200/60 bg-gradient-to-br from-white/80 via-white/70 to-orange-100/60 text-gray-800"
          : "border-white/15 bg-gradient-to-br from-orange-200/50 via-orange-100/40 to-white/35 text-gray-900/90"
      } ${locked ? "opacity-90" : ""} ${className}`}
      whileHover={
        !isOpen && !prefersReducedMotion
          ? { y: -2, scale: 1.004 }
          : undefined
      }
      transition={CARD_TRANSITION}
    >
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-orange-200/25 via-transparent to-orange-500/15"
        initial={false}
        animate={
          prefersReducedMotion
            ? { opacity: isOpen ? 1 : 0 }
            : { opacity: isOpen ? 1 : 0, scale: isOpen ? 1 : 1.05 }
        }
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Header */}
      <motion.button
        type="button"
        id={headerId}
        className={`relative flex w-full items-center justify-between px-6 py-5 text-base font-semibold transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white md:text-lg ${headerClassName}`}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => setOpenValue(isOpen ? null : value)}
        initial={false}
        whileTap={{ scale: prefersReducedMotion ? 1 : 0.995 }}
      >
        <span className="flex items-center gap-3">
          {Icon ? (
            <Icon
              className={`h-5 w-5 flex-shrink-0 transition-colors duration-300 ${
                isOpen
                  ? "text-orange-600 drop-shadow-[0_0_12px_rgba(249,115,22,0.45)]"
                  : "text-orange-600"
              }`}
            />
          ) : null}
          {title}
        </span>

        <motion.span
          initial={false}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={CHEVRON_SPRING}
          className={`text-xl font-bold ${isOpen ? "text-orange-700" : "text-orange-600"}`}
        >
          {isOpen ? "\u2212" : "+"}
        </motion.span>
      </motion.button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            className={`origin-top px-6 pb-6 ${contentClassName}`}
            style={{ overflow: "hidden", willChange: "transform, opacity, height" }}
            initial={prefersReducedMotion ? false : "collapsed"}
            animate={prefersReducedMotion ? { height: "auto", opacity: 1 } : "open"}
            exit={prefersReducedMotion ? { height: 0, opacity: 0 } : "collapsed"}
            variants={bodyMotionVariants}
            layout
          >
            {typeof children === "function" ? children({ disabled: locked }) : children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

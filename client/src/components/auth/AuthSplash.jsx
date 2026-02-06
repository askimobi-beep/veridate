// AuthSplash.jsx
// Splash screen: large professional circular loader with VERIDATE inside.
// Pure React + Tailwind (no images, no framer-motion).

import React from "react";

export default function AuthSplash() {
  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-white">
      <div className="relative flex items-center justify-center">
        {/* Word inside */}
        <span className="z-10 text-5xl md:text-3xl font-extrabold tracking-[0.35em] text-[color:var(--brand-orange)]">
          VERIDATE
        </span>

        {/* Professional SVG loader (track + rotating arc) */}
        <svg
          className="absolute h-56 w-56 md:h-96 md:w-96"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx="50"
            cy="50"
            r="35"
            fill="none"
            stroke="#fb773b"
            strokeOpacity="0.2"
            strokeWidth="2"
          />

          {/* Rotating arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#fb773b"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="70 220" /* arc length + gap */
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 50 50"
              to="360 50 50"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
  );
}

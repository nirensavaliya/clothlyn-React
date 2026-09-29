import React from "react";

/** Cloth vectors — 5% alpha; calculator straddles sticky header */
const ICONS = {
  hanger: (
    <path
      d="M4 20h16M12 4a2 2 0 0 1 2 2v1.4L20 14H4l6-6.6V6a2 2 0 0 1 2-2z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  shirt: (
    <>
      <path
        d="M8 4l-4 3v3.2l4-1.6V20h8V8.6L20 10.2V7l-4-3-2 2.2h-4L8 4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path
        d="M10 4c0 1.6 1 2.6 2 2.6S14 5.6 14 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
    </>
  ),
  calculator: (
    <>
      <rect
        x="5"
        y="2.5"
        width="14"
        height="19"
        rx="2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
      />
      <rect
        x="7.5"
        y="4.5"
        width="9"
        height="4"
        rx="0.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M8 12h1.5M11.25 12h1.5M14.5 12h1.5M8 15h1.5M11.25 15h1.5M14.5 15h1.5M8 18h1.5M11.25 18h1.5M14.5 18h1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </>
  ),
  scissors: (
    <>
      <circle cx="6" cy="6" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <circle cx="6" cy="18" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.35" />
      <path
        d="M8.2 7.8L20 18M8.2 16.2L20 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </>
  ),
};

/**
 * Positions relative to main (includes sticky header ~64px).
 * Calculator sits higher so top peeks into sticky header bar.
 */
const TOOLBAR_PLACEMENTS = [
  { icon: "hanger", top: "36px", left: "3%", size: 150, rotate: -16 },
  // Higher — top ~half in sticky header, bottom in page title area
  { icon: "calculator", top: "8px", left: "42%", size: 170, rotate: 6 },
  { icon: "shirt", top: "40px", left: "78%", size: 155, rotate: 12 },
];

const PAGE_PLACEMENTS = [
  { icon: "scissors", top: "auto", bottom: "-90px", left: "34%", size: 280, rotate: -28 },
];

const renderPlacements = (placements) =>
  placements.map((item, i) => (
    <svg
      key={`${item.icon}-${i}`}
      viewBox="0 0 24 24"
      width={item.size}
      height={item.size}
      className="absolute"
      style={{
        top: item.top === "auto" ? undefined : item.top,
        bottom: item.bottom,
        left: item.left,
        transform: `rotate(${item.rotate}deg)`,
      }}
    >
      {ICONS[item.icon]}
    </svg>
  ));

/**
 * @param {"toolbar"|"page"} variant
 */
const HeaderVectors = ({ variant = "toolbar" }) => (
  <div
    className="pointer-events-none absolute inset-0 overflow-hidden text-[#7D766C]"
    style={{ opacity: 0.05 }}
    aria-hidden
  >
    {renderPlacements(variant === "page" ? PAGE_PLACEMENTS : TOOLBAR_PLACEMENTS)}
  </div>
);

export default HeaderVectors;

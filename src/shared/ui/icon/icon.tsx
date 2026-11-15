import type { SVGProps } from "react";

const paths = {
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowLeft: "M19 12H5M11 6l-6 6 6 6",
  home: "M3 11l9-8 9 8M5 9.5V20h14V9.5M10 20v-6h4v6",
  chevronDown: "M6 9l6 6 6-6",
  flag: "M5 21V4M5 4h11l-2 4 2 4H5",
  calculator:
    "M6 3h12a1 1 0 011 1v16a1 1 0 01-1 1H6a1 1 0 01-1-1V4a1 1 0 011-1zM8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01",
  list: "M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01",
  x: "M6 6l12 12M18 6L6 18",
  sun: "M12 17a5 5 0 100-10 5 5 0 000 10zM12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4",
  moon: "M20 14.5A8.5 8.5 0 019.5 4 8.5 8.5 0 1020 14.5z",
  star: "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3z",
  lock: "M6 11h12v10H6zM8.5 11V7.5a3.5 3.5 0 017 0V11",
  cards: "M8 4h11a1 1 0 011 1v11M4 8h11a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z",
  database: "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6",
  medal: "M8 3h8l-2 6h-4L8 3zM12 21a6 6 0 100-12 6 6 0 000 12zM12 13v4M10.5 14.5L12 13",
  check: "M5 12.5l4.5 4.5L19 7.5",
  sparkles: "M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8L12 3zM19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9L19 15z",
  target: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01",
  calendar: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z",
  clock: "M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2",
  chart: "M4 20V10M10 20V4M16 20v-7M22 20H2",
  trending: "M3 17l6-6 4 4 8-8M15 7h6v6",
  book: "M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM19 19v2H6",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  compass: "M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5 5-2z",
  flame: "M12 22c4 0 7-2.7 7-6.8 0-3.2-2-5.7-4-7.7-.4 2-1.4 3.2-2.6 3.8C12.8 8.5 11.5 5 9 3c0 3.5-4 6.2-4 11.2C5 18.9 8 22 12 22z",
  shield: "M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
  user: "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0",
  brain: "M9 4a3 3 0 00-3 3v.5A3 3 0 004 10.5 3 3 0 005 13a3 3 0 001 5.5A3 3 0 009 21h0V4zM15 4a3 3 0 013 3v.5a3 3 0 012 3 3 3 0 01-1 2.5 3 3 0 01-1 5.5 3 3 0 01-3 2.5V4z",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  pencil: "M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4",
  refresh: "M4 4v6h6M20 20v-6h-6M5.5 15A7.5 7.5 0 0018 18M18.5 9A7.5 7.5 0 006 6",
  trash: "M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3",
  play: "M7 4.5v15l12-7.5-12-7.5z",
  trophy: "M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4zM17 6h3a3 3 0 01-3 4M7 6H4a3 3 0 003 4",
  monitor: "M3 5h18v11H3zM8 21h8M12 16v5",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    >
      <path d={paths[name]} />
    </svg>
  );
}

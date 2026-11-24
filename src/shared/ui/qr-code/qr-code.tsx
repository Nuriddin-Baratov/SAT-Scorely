import qrcode from "qrcode-generator";

/** Atrofdagi oq hoshiya (katak) — skanerlar uchun standart talab */
const QUIET = 4;

/** QR kod (SVG): chop etishda ham aniq. */
export function QrCode({ value, label, className }: { value: string; label: string; className?: string }) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const n = qr.getModuleCount();
  let d = "";
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.isDark(y, x)) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg viewBox={`${-QUIET} ${-QUIET} ${n + QUIET * 2} ${n + QUIET * 2}`} className={className} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect x={-QUIET} y={-QUIET} width={n + QUIET * 2} height={n + QUIET * 2} fill="#fff" />
      <path d={d} fill="#0b1c3d" />
    </svg>
  );
}

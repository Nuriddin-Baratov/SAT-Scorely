import { cn } from "@/shared/lib";
import type { Dictionary } from "@/shared/i18n";
import { Icon } from "@/shared/ui/icon";

const rowMeta = [
  { meta: "Math", done: true },
  { meta: "R&W", done: true },
  { meta: "Math", done: false, today: true },
  { meta: "Bluebook", done: false },
];

// Haftalik taxminiy ball (illyustratsiya)
const points = [1080, 1110, 1130, 1180, 1200, 1250, 1290, 1330, 1360, 1400, 1430, 1450];

function sparkline(w: number, h: number) {
  const min = 1050;
  const max = 1470;
  const xy = points.map((p, i) => [(i / (points.length - 1)) * w, h - ((p - min) / (max - min)) * h] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  return { line, area: `${line} L${w} ${h} L0 ${h} Z`, last: xy[xy.length - 1], now: xy[3] };
}

export function HeroPreview({ t }: { t: Dictionary["home"]["preview"] }) {
  const rows = t.rows.map((r, i) => ({ ...r, ...rowMeta[i] }));
  const { line, area, last, now } = sparkline(360, 90);
  return (
    <div className="relative mx-auto w-full max-w-[470px] animate-fade-up [animation-delay:150ms]" aria-hidden>
      {/* Asosiy karta */}
      <div className="glass relative rounded-[1.75rem] p-6 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.8)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#a99dff] to-[#5b4cf5] text-sm font-bold">A</span>
            <div>
              <p className="text-sm font-semibold">{t.student}</p>
              <p className="text-xs text-white/50">{t.week}</p>
            </div>
          </div>
          <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">{t.realistic}</span>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs text-white/50">{t.now}</p>
            <p className="font-display text-4xl font-bold">1180</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50">{t.target}</p>
            <p className="text-gradient-light font-display text-4xl font-bold">1450</p>
          </div>
        </div>

        <svg viewBox="0 0 360 100" className="mt-3 w-full overflow-visible">
          <defs>
            <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#8b7dff" stopOpacity="0.45" />
              <stop offset="1" stopColor="#8b7dff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="hero-line" x1="0" x2="1">
              <stop offset="0" stopColor="#8b7dff" />
              <stop offset="1" stopColor="#f1cf8b" />
            </linearGradient>
          </defs>
          {[0, 30, 60, 90].map((y) => (
            <line key={y} x1="0" x2="360" y1={y} y2={y} stroke="white" strokeOpacity="0.06" />
          ))}
          <path d={area} fill="url(#hero-area)" />
          <path d={line} fill="none" stroke="url(#hero-line)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 0" />
          <circle cx={now[0]} cy={now[1]} r="5" fill="#0b0a1d" stroke="#a99dff" strokeWidth="2.5" />
          <circle cx={last[0]} cy={last[1]} r="5" fill="#f1cf8b" />
        </svg>

        <ul className="mt-5 space-y-2">
          {rows.map((r) => (
            <li
              key={r.title}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 ring-1",
                r.today ? "bg-white/[0.09] ring-[#8b7dff]/50" : "bg-white/[0.03] ring-white/[0.06]",
              )}
            >
              <span
                className={cn(
                  "grid size-5 shrink-0 place-items-center rounded-full",
                  r.done ? "bg-emerald-400 text-[#0b0a1d]" : "ring-2 ring-white/25",
                )}
              >
                {r.done && <Icon name="check" className="size-3.5" strokeWidth={3} />}
              </span>
              <span className="w-5 text-[11px] font-medium text-white/45">{r.day}</span>
              <span className={cn("flex-1 truncate text-sm", r.done && "text-white/45 line-through")}>{r.title}</span>
              {r.today ? (
                <span className="rounded-full bg-[#8b7dff] px-2 py-0.5 text-[10px] font-semibold">{t.today}</span>
              ) : (
                <span className="text-[11px] text-white/40">{r.meta}</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Suzuvchi kartalar */}
      <div className="animate-float absolute -top-7 -left-4 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-[0_20px_40px_-15px_rgb(0_0_0/0.6)] sm:flex lg:-left-14">
        <span className="grid size-9 place-items-center rounded-xl bg-orange-100 text-orange-500">
          <Icon name="flame" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold">{t.streak}</p>
          <p className="text-[11px] text-zinc-500">{t.streakSub}</p>
        </div>
      </div>

      <div className="animate-float absolute -right-4 -bottom-8 hidden items-center gap-3 rounded-2xl bg-white px-4 py-3 text-ink shadow-[0_20px_40px_-15px_rgb(0_0_0/0.6)] [animation-delay:-3s] sm:flex lg:-right-10">
        <span className="grid size-9 place-items-center rounded-xl bg-[#eeecff] text-[#5b4cf5]">
          <Icon name="trending" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-bold">{t.gain}</p>
          <p className="text-[11px] text-zinc-500">{t.gainSub}</p>
        </div>
      </div>
    </div>
  );
}

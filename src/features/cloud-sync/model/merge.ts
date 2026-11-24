/**
 * Progressni yo'qotmasdan birlashtirish (3 tomonlama): `base` — oxirgi sinxronlangan holat,
 * `local` — shu qurilma, `remote` — bulut (boshqa qurilma yozgan bo'lishi mumkin).
 * Bir tomonda o'zgargan narsa olinadi; ikkala tomonda o'zgargani — turiga qarab qo'shiladi.
 */
export type Data = Record<string, unknown>;
type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);

/** Kalitlar tartibiga bog'liq bo'lmagan matn (Postgres jsonb kalitlar tartibini o'zgartiradi) */
export function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (isObj(v)) {
    return `{${Object.keys(v)
      .filter((k) => v[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v) ?? "null";
}

const same = (a: unknown, b: unknown) => canonical(a) === canonical(b);

type Resolve = (base: unknown, local: unknown, remote: unknown) => unknown;

/** Faqat bir tomon o'zgargan bo'lsa — o'sha; ikkalasi ham o'zgargan bo'lsa — `resolve` */
function pick(base: unknown, local: unknown, remote: unknown, hasBase: boolean, resolve: Resolve) {
  if (same(local, remote)) return local;
  if (hasBase && same(base, local)) return remote;
  if (hasBase && same(base, remote)) return local;
  // Solishtirish asosi yo'q: bir tomonda umuman bo'lmasa — bori olinadi
  if (!hasBase && local === undefined) return remote;
  if (!hasBase && remote === undefined) return local;
  return resolve(base, local, remote);
}

function mergeMap(base: unknown, local: unknown, remote: unknown, hasBase: boolean, resolve: Resolve): Obj {
  const b = isObj(base) ? base : {};
  const l = isObj(local) ? local : {};
  const r = isObj(remote) ? remote : {};
  const out: Obj = {};
  for (const key of new Set([...Object.keys(l), ...Object.keys(r)])) {
    const value = pick(b[key], l[key], r[key], hasBase, resolve);
    if (value !== undefined) out[key] = value;
  }
  return out;
}

const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Hisoblagich: ikkala qurilmada qo'shilgani qo'shiladi; asos bo'lmasa — kattasi (ikki marta sanalmasin) */
const addNum = (base: unknown, local: unknown, remote: unknown, hasBase: boolean) =>
  hasBase ? Math.max(0, num(local) + num(remote) - num(base)) : Math.max(num(local), num(remote));

function mergeSet(base: unknown, local: unknown, remote: unknown, hasBase: boolean): unknown[] {
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  const b = new Set(hasBase ? arr(base).map(canonical) : []);
  const l = new Set(arr(local).map(canonical));
  const r = new Set(arr(remote).map(canonical));
  const seen = new Set<string>();
  return [...arr(local), ...arr(remote)].filter((item) => {
    const key = canonical(item);
    if (seen.has(key)) return false;
    seen.add(key);
    // Avval bor edi, lekin bir tomonda o'chirilgan — o'chirilganicha qoladi
    return !(b.has(key) && (!l.has(key) || !r.has(key)));
  });
}

/** `id` li yozuvlar (testlar, sertifikatlar): birlashma, o'chirilganlarsiz, yangisi boshida */
function mergeRecords(base: unknown, local: unknown, remote: unknown, hasBase: boolean, dateKey: string, max: number) {
  const byId = (v: unknown) => {
    const out: Obj = {};
    for (const item of Array.isArray(v) ? v : []) if (isObj(item) && typeof item.id === "string") out[item.id] = item;
    return out;
  };
  const merged = mergeMap(byId(base), byId(local), byId(remote), hasBase, (_b, l, r) => l ?? r);
  return Object.values(merged)
    .sort((a, b) => String((b as Obj)[dateKey]).localeCompare(String((a as Obj)[dateKey])))
    .slice(0, max);
}

function mergeGame(base: unknown, local: unknown, remote: unknown, hasBase: boolean): Obj {
  const b = isObj(base) ? base : {};
  const l = isObj(local) ? local : {};
  const r = isObj(remote) ? remote : {};
  const numbers = (key: string) => {
    const bm = isObj(b[key]) ? (b[key] as Obj) : {};
    const lm = isObj(l[key]) ? (l[key] as Obj) : {};
    const rm = isObj(r[key]) ? (r[key] as Obj) : {};
    return Object.fromEntries([...new Set([...Object.keys(lm), ...Object.keys(rm)])].map((k) => [k, addNum(bm[k], lm[k], rm[k], hasBase)]));
  };
  const days = [...new Set([...(Array.isArray(l.activeDays) ? l.activeDays : []), ...(Array.isArray(r.activeDays) ? r.activeDays : [])])].sort();
  return {
    ...r,
    ...l,
    xp: addNum(b.xp, l.xp, r.xp, hasBase),
    activeDays: days,
    // Nishon qachon birinchi ochilgan bo'lsa — o'sha vaqt
    badges: mergeMap(b.badges, l.badges, r.badges, false, (_b, x, y) => (String(x) < String(y) ? x : y)),
    unseen: mergeSet(b.unseen, l.unseen, r.unseen, hasBase),
    counters: numbers("counters"),
    daily: mergeMap(b.daily, l.daily, r.daily, false, (_b, x) => x),
    ...(l.activity || r.activity ? { activity: numbers("activity") } : {}),
  };
}

/** Xato savol: ko'proq ishlangan (yoki keyinroqqa surilgan) holat */
const mistake: Resolve = (_b, l, r) => {
  // Bir qurilmada o'zlashtirilib o'chirilgan, boshqasida yana xato qilingan — takrorlashda qoladi
  if (!isObj(l) || !isObj(r)) return l ?? r;
  if (num(l.wrongCount) !== num(r.wrongCount)) return num(l.wrongCount) > num(r.wrongCount) ? l : r;
  return String(l.due) >= String(r.due) ? l : r;
};

export function mergeData(base: Data | null, local: Data, remote: Data): Data {
  const hasBase = base !== null;
  return Object.fromEntries(
    [...new Set([...Object.keys(local), ...Object.keys(remote)])].flatMap((key) => {
      const value = pick(base?.[key], local[key], remote[key], hasBase, (b, l, r) => {
        switch (key) {
          case "scorely.game.v1":
            return mergeGame(b, l, r, hasBase);
          case "scorely.attempts.v1":
            return mergeRecords(b, l, r, hasBase, "finishedAt", 100);
          case "scorely.certificates.v1":
            return mergeRecords(b, l, r, hasBase, "issuedAt", 100);
          case "scorely.mistakes.v1":
            return mergeMap(b, l, r, hasBase, mistake);
          case "scorely.vocab.v1":
            return mergeMap(b, l, r, hasBase, (_b, x, y) => (x === "known" || y === "known" ? "known" : (x ?? y)));
          case "scorely.progress.v1":
            return mergeSet(b, l, r, hasBase);
          default:
            // Profil, reja va h.k.: yangi qurilmada (asos yo'q) — bulutdagisi, aks holda — shu qurilmada hozir o'zgartirilgani
            return hasBase ? (l ?? r) : r;
        }
      });
      return value === undefined ? [] : [[key, value] as const];
    }),
  );
}

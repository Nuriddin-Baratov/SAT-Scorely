import { useSyncExternalStore } from "react";
import { toISODate } from "../date";

function subscribeNoop() {
  return () => {};
}

/** Bugungi sana (`YYYY-MM-DD`). Serverda `undefined`. */
export function useToday(): string | undefined {
  return useSyncExternalStore(subscribeNoop, () => toISODate(new Date()), () => undefined);
}

export type BadgeId =
  | "first-test"
  | "perfect"
  | "streak-3"
  | "streak-7"
  | "streak-30"
  | "daily-5"
  | "mistakes-10"
  | "words-50"
  | "hard-module"
  | "night-owl"
  | "xp-1000"
  | "explorer";

export interface DailyRecord {
  questionId: string;
  /** Variant indeksi yoki yozilgan javob (SPR) */
  choice: number | string;
  correct: boolean;
}

export interface GameState {
  xp: number;
  /** Faol kunlar (`YYYY-MM-DD`, o'sish tartibida, takrorsiz) */
  activeDays: string[];
  /** Ochilgan nishonlar va ochilgan vaqti */
  badges: Partial<Record<BadgeId, string>>;
  /** Hali bildirishnoma ko'rsatilmagan nishonlar */
  unseen: BadgeId[];
  counters: {
    tests: number;
    perfectTests: number;
    daily: number;
    practice: number;
    mastered: number;
    words: number;
    hardModules: number;
    nightOwl: number;
  };
  /** Kunlik savol javoblari: sana → javob */
  daily: Record<string, DailyRecord>;
}

export type GameEvent =
  | { type: "test"; correct: number; total: number; hardModule?: boolean }
  | { type: "daily"; date: string; questionId: string; choice: number | string; correct: boolean }
  | { type: "practice"; correct: boolean }
  | { type: "review"; correct: boolean; mastered: boolean }
  | { type: "word" };

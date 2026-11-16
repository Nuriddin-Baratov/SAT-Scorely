import type { EnglishLevel, Grade, Level, ScoreSource } from "./types";

export const levelOptions: { value: Level; label: string; description: string }[] = [
  { value: "beginner", label: "Boshlang'ich", description: "SAT bilan endi tanishyapman, asoslarni mustahkamlashim kerak." },
  { value: "intermediate", label: "O'rta", description: "Asosiy mavzularni bilaman, lekin barqarorlik va tezlik yetishmaydi." },
  { value: "advanced", label: "Yuqori", description: "1300+ atrofidaman, qiyin savollar va mukammallik ustida ishlayman." },
];

export const gradeOptions: { value: Grade; label: string }[] = [
  { value: "8", label: "8-sinf" },
  { value: "9", label: "9-sinf" },
  { value: "10", label: "10-sinf" },
  { value: "11", label: "11-sinf" },
  { value: "12", label: "12-sinf / litsey" },
  { value: "graduate", label: "Bitiruvchi" },
];

export const englishOptions: { value: EnglishLevel; label: string }[] = [
  { value: "A2", label: "A2" },
  { value: "B1", label: "B1" },
  { value: "B2", label: "B2" },
  { value: "C1", label: "C1" },
  { value: "C2", label: "C2" },
];

export const scoreSourceOptions: { value: ScoreSource; label: string }[] = [
  { value: "none", label: "Hali topshirmaganman" },
  { value: "sat", label: "Rasmiy SAT" },
  { value: "psat", label: "PSAT" },
  { value: "practice", label: "Bluebook amaliy test" },
];

export const sessionLengthOptions = [30, 45, 60, 90, 120] as const;


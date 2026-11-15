import type { SprQuestion } from "./types";

/**
 * Javobni o'zi yozadigan (SPR) matematika savollari — haqiqiy SAT'da Math bo'limining ≈25%.
 * Javob butun son, o'nli kasr yoki oddiy kasr ko'rinishida yoziladi.
 */
export const sprQuestions: SprQuestion[] = [
  {
    id: "spr-linear",
    format: "spr",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "easy",
    prompt: "If 4x + 9 = 37, what is the value of x?",
    accepted: ["7"],
    explanation: {
      uz: "4x = 37 − 9 = 28, demak x = 28 / 4 = 7.",
      ru: "4x = 37 − 9 = 28, значит x = 28 / 4 = 7.",
      en: "4x = 37 − 9 = 28, so x = 28 / 4 = 7.",
    },
  },
  {
    id: "spr-system",
    format: "spr",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "medium",
    prompt: "2a + b = 11\na − b = 1\n\nIf (a, b) is the solution to the system of equations above, what is the value of a?",
    accepted: ["4"],
    explanation: {
      uz: "Tenglamalarni qo'shamiz: 3a = 12, demak a = 4 (b = 3).",
      ru: "Сложим уравнения: 3a = 12, значит a = 4 (b = 3).",
      en: "Add the equations: 3a = 12, so a = 4 (and b = 3).",
    },
  },
  {
    id: "spr-slope-fraction",
    format: "spr",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "medium",
    prompt: "What is the slope of the line that passes through the points (0, 2) and (6, 5)?",
    accepted: ["1/2", "0.5", ".5"],
    explanation: {
      uz: "Qiyalik = (5 − 2) / (6 − 0) = 3/6 = 1/2. SPR'da 1/2 yoki 0.5 deb yozish mumkin.",
      ru: "Наклон = (5 − 2) / (6 − 0) = 3/6 = 1/2. В SPR можно ввести 1/2 или 0.5.",
      en: "Slope = (5 − 2) / (6 − 0) = 3/6 = 1/2. In SPR you can enter 1/2 or 0.5.",
    },
  },
  {
    id: "spr-fractions",
    format: "spr",
    sectionId: "math",
    domainId: "advanced-math",
    difficulty: "medium",
    prompt: "If x/3 + x/6 = 5, what is the value of x?",
    accepted: ["10"],
    explanation: {
      uz: "Umumiy maxraj 6: 2x/6 + x/6 = 3x/6 = x/2 = 5, demak x = 10.",
      ru: "Общий знаменатель 6: 2x/6 + x/6 = 3x/6 = x/2 = 5, значит x = 10.",
      en: "Common denominator 6: 2x/6 + x/6 = 3x/6 = x/2 = 5, so x = 10.",
    },
  },
  {
    id: "spr-exponent",
    format: "spr",
    sectionId: "math",
    domainId: "advanced-math",
    difficulty: "hard",
    prompt: "If 2^(x + 1) = 32, what is the value of x?",
    accepted: ["4"],
    explanation: {
      uz: "32 = 2⁵, demak x + 1 = 5 va x = 4.",
      ru: "32 = 2⁵, значит x + 1 = 5 и x = 4.",
      en: "32 = 2⁵, so x + 1 = 5 and x = 4.",
    },
  },
  {
    id: "spr-percent",
    format: "spr",
    sectionId: "math",
    domainId: "data-analysis",
    difficulty: "easy",
    prompt: "What is 15% of 240?",
    accepted: ["36"],
    explanation: {
      uz: "0,15 × 240 = 36. (10% = 24, 5% = 12, jami 36.)",
      ru: "0,15 × 240 = 36. (10% = 24, 5% = 12, итого 36.)",
      en: "0.15 × 240 = 36. (10% = 24, 5% = 12, so 36.)",
    },
  },
  {
    id: "spr-mean",
    format: "spr",
    sectionId: "math",
    domainId: "data-analysis",
    difficulty: "medium",
    prompt: "The mean of the three numbers 3, 8, and x is 7. What is the value of x?",
    accepted: ["10"],
    explanation: {
      uz: "Yig'indi 3 × 7 = 21. 21 − 3 − 8 = 10.",
      ru: "Сумма 3 × 7 = 21. 21 − 3 − 8 = 10.",
      en: "The sum is 3 × 7 = 21, so x = 21 − 3 − 8 = 10.",
    },
  },
  {
    id: "spr-rectangle",
    format: "spr",
    sectionId: "math",
    domainId: "geometry-trig",
    difficulty: "hard",
    prompt: "A rectangle has a perimeter of 30 units and a length of 9 units. What is the area of the rectangle, in square units?",
    accepted: ["54"],
    explanation: {
      uz: "2(9 + w) = 30 → w = 6. Yuza = 9 × 6 = 54. Tuzoq: perimetrdan yuzani to'g'ridan-to'g'ri hisoblashga urinish.",
      ru: "2(9 + w) = 30 → w = 6. Площадь = 9 × 6 = 54. Ловушка — сразу считать площадь по периметру.",
      en: "2(9 + w) = 30 gives w = 6, so the area is 9 × 6 = 54. Trap: jumping straight from perimeter to area.",
    },
  },
];

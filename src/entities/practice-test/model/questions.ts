import { extraQuestions } from "./questions-extra";
import { sprQuestions } from "./questions-spr";
import type { ChoiceQuestion, Question } from "./types";

/**
 * Savollar banki. Savollar Digital SAT uslubida yozilgan original mashqlar
 * (College Board materiallari emas). Matn va variantlar — ingliz tilida.
 */
const baseQuestions: ChoiceQuestion[] = [
  // ---------------- Reading and Writing ----------------
  {
    id: "rw-sva-exhibit",
    sectionId: "rw",
    domainId: "conventions",
    difficulty: "easy",
    prompt:
      "The museum's newest exhibit, which features ceramics from the Ming dynasty, ______ visitors from around the world.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["attract", "attracts", "are attracting", "have attracted"],
    answer: 1,
    explanation: {
      uz: "Ega — “exhibit” (birlik). “which features …” qo'shimcha izoh, egani o'zgartirmaydi. Birlikdagi ega bilan “attracts” keladi.",
      ru: "Подлежащее — «exhibit» (ед. ч.). Оборот «which features …» — вставка и не меняет подлежащее. С ед. ч. нужен глагол «attracts».",
      en: "The subject is “exhibit” (singular); the “which features …” clause is just extra information. A singular subject takes “attracts.”",
    },
  },
  {
    id: "rw-boundary-earle",
    sectionId: "rw",
    domainId: "conventions",
    difficulty: "medium",
    prompt:
      "Marine biologist Sylvia Earle has spent thousands of hours ______ her research has shaped how scientists think about ocean conservation.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["underwater, and", "underwater and", "underwater,", "underwater"],
    answer: 0,
    explanation: {
      uz: "Ikkita mustaqil gap bor. Ularni bog'lash uchun vergul + bog'lovchi (“, and”) kerak. Faqat vergul — “comma splice”, hech narsasiz — “run-on”.",
      ru: "Здесь два независимых предложения. Их соединяют запятой + союзом («, and»). Одна запятая — comma splice, без знаков — run-on.",
      en: "Two independent clauses need a comma plus a coordinating conjunction (“, and”). A comma alone is a comma splice; nothing at all is a run-on.",
    },
  },
  {
    id: "rw-transition-bicycles",
    sectionId: "rw",
    domainId: "expression-ideas",
    difficulty: "easy",
    prompt:
      "Early bicycles were heavy and difficult to steer. ______ by the 1890s, lighter frames and pneumatic tires had made cycling popular across Europe.\n\nWhich choice completes the text with the most logical transition?",
    choices: ["Similarly,", "However,", "For example,", "Therefore,"],
    answer: 1,
    explanation: {
      uz: "Birinchi gap muammoni, ikkinchisi esa unga qarama-qarshi o'zgarishni aytadi. Qarama-qarshilik — “However”.",
      ru: "Первое предложение описывает проблему, второе — противоположную перемену. Противопоставление выражает «However».",
      en: "The first sentence describes a problem; the second describes a contrasting change. Contrast calls for “However.”",
    },
  },
  {
    id: "rw-words-spare",
    sectionId: "rw",
    domainId: "craft-structure",
    difficulty: "medium",
    prompt:
      "Although the novelist's early stories were praised for their elaborate prose, her later work is notably ______, using short sentences and plain vocabulary.\n\nWhich choice completes the text with the most logical and precise word or phrase?",
    choices: ["ornate", "spare", "ambiguous", "sentimental"],
    answer: 1,
    explanation: {
      uz: "“Although” qarama-qarshilikni bildiradi: murakkab (elaborate) uslubning teskarisi kerak. “Short sentences and plain vocabulary” — “spare” (ixcham, oddiy).",
      ru: "«Although» задаёт контраст с «elaborate prose». Короткие предложения и простая лексика — это «spare» (скупой, лаконичный).",
      en: "“Although” sets up a contrast with “elaborate prose.” Short sentences and plain vocabulary describe a “spare” style.",
    },
  },
  {
    id: "rw-main-idea-bees",
    sectionId: "rw",
    domainId: "information-ideas",
    difficulty: "medium",
    passage:
      "Researchers studying honeybees found that colonies exposed to low levels of a common pesticide produced 30% fewer queens than unexposed colonies. Because a colony's long-term survival depends on producing new queens, the researchers concluded that even low pesticide exposure could threaten colony populations over time.",
    prompt: "Which choice best states the main idea of the text?",
    choices: [
      "Honeybee colonies produce more queens when pesticide levels are high.",
      "Low pesticide exposure may harm honeybee colonies by reducing queen production.",
      "Pesticides are the main reason honeybee populations have declined worldwide.",
      "Researchers are unsure how queens affect a colony's survival.",
    ],
    answer: 1,
    explanation: {
      uz: "Matn: past dozadagi pestitsid → kamroq qirolicha → koloniyaga xavf. B aynan shuni aytadi. C juda keng (“main reason … worldwide”), A va D matnga zid.",
      ru: "Логика текста: малые дозы пестицида → меньше маток → угроза колонии. Это вариант B. C слишком широк, A и D противоречат тексту.",
      en: "The text links low pesticide exposure → fewer queens → risk to colonies. That's B. C overgeneralizes; A and D contradict the text.",
    },
  },
  {
    id: "rw-function-desert",
    sectionId: "rw",
    domainId: "craft-structure",
    difficulty: "hard",
    passage:
      "Many people assume that deserts are lifeless. In fact, the Sonoran Desert is home to more than 2,000 species of plants, including the towering saguaro cactus.",
    prompt: "Which choice best describes the function of the second sentence in the overall structure of the text?",
    choices: [
      "It challenges an assumption presented in the first sentence.",
      "It provides an example that supports the first sentence.",
      "It introduces a counterargument to the author's main claim.",
      "It summarizes the scientific history of the Sonoran Desert.",
    ],
    answer: 0,
    explanation: {
      uz: "Birinchi gap keng tarqalgan fikrni (“cho'l jonsiz”) keltiradi, “In fact” bilan boshlangan ikkinchi gap esa uni rad etadi. B tuzoq: misol fikrni qo'llab-quvvatlamaydi, balki inkor qiladi.",
      ru: "Первое предложение приводит распространённое мнение, второе («In fact») опровергает его. B — ловушка: пример не поддерживает, а опровергает мнение.",
      en: "The first sentence states a common assumption; the second (“In fact…”) refutes it. B is a trap — the example disproves, not supports, the first sentence.",
    },
  },
  {
    id: "rw-tense-moon",
    sectionId: "rw",
    domainId: "conventions",
    difficulty: "easy",
    prompt:
      "In 1969, astronauts Neil Armstrong and Buzz Aldrin ______ the first humans to walk on the Moon.\n\nWhich choice completes the text so that it conforms to the conventions of Standard English?",
    choices: ["become", "becomes", "became", "becoming"],
    answer: 2,
    explanation: {
      uz: "“In 1969” — o'tgan zamondagi aniq vaqt. Gapga to'liq fe'l kerak: o'tgan zamon “became”. “Becoming” gapni to'liqsiz qoldiradi.",
      ru: "«In 1969» — конкретный момент в прошлом, нужен Past Simple «became». «Becoming» оставляет предложение без сказуемого.",
      en: "“In 1969” marks a specific past time, so the simple past “became” fits. “Becoming” would leave the sentence without a main verb.",
    },
  },
  {
    id: "rw-transition-city",
    sectionId: "rw",
    domainId: "expression-ideas",
    difficulty: "medium",
    prompt:
      "The city's population doubled between 1990 and 2010. ______ the number of public schools remained almost unchanged.\n\nWhich choice completes the text with the most logical transition?",
    choices: ["As a result,", "Likewise,", "Nevertheless,", "For instance,"],
    answer: 2,
    explanation: {
      uz: "Aholi ikki baravar oshdi, lekin maktablar soni deyarli o'zgarmadi — kutilganning aksi. Bunga “Nevertheless” (shunga qaramay) mos.",
      ru: "Население удвоилось, а число школ почти не изменилось — вопреки ожиданиям. Подходит «Nevertheless» (тем не менее).",
      en: "Population doubled, yet schools stayed flat — the opposite of what you'd expect. That calls for “Nevertheless.”",
    },
  },

  // ---------------- Math ----------------
  {
    id: "m-linear-solve",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "easy",
    prompt: "If 3x − 7 = 11, what is the value of x?",
    choices: ["4/3", "6", "18", "4"],
    answer: 1,
    explanation: {
      uz: "Ikkala tomonga 7 qo'shamiz: 3x = 18. Keyin 3 ga bo'lamiz: x = 6.",
      ru: "Прибавим 7 к обеим частям: 3x = 18. Разделим на 3: x = 6.",
      en: "Add 7 to both sides: 3x = 18. Divide by 3: x = 6.",
    },
  },
  {
    id: "m-linear-model-gym",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "easy",
    prompt:
      "A gym charges a one-time $40 sign-up fee and $25 per month. Which equation gives the total cost C, in dollars, for m months of membership?",
    choices: ["C = 40m + 25", "C = 25m + 40", "C = 65m", "C = 25(m + 40)"],
    answer: 1,
    explanation: {
      uz: "Oylik to'lov oylar soniga ko'paytiriladi (25m), bir martalik to'lov esa bir marta qo'shiladi (+40): C = 25m + 40.",
      ru: "Ежемесячная плата умножается на число месяцев (25m), разовый взнос прибавляется один раз (+40): C = 25m + 40.",
      en: "The monthly rate multiplies the months (25m); the one-time fee is added once (+40): C = 25m + 40.",
    },
  },
  {
    id: "m-system-sum-diff",
    sectionId: "math",
    domainId: "algebra",
    difficulty: "medium",
    prompt: "x + y = 10\nx − y = 4\n\nIf (x, y) is the solution to the system of equations above, what is the value of x?",
    choices: ["3", "6", "7", "14"],
    answer: 2,
    explanation: {
      uz: "Tenglamalarni qo'shamiz: 2x = 14, demak x = 7 (y = 3). Desmos'da ikkala chiziqning kesishgan nuqtasi ham (7, 3).",
      ru: "Сложим уравнения: 2x = 14, значит x = 7 (y = 3). В Desmos прямые пересекаются в точке (7, 3).",
      en: "Add the equations: 2x = 14, so x = 7 (and y = 3). In Desmos the lines intersect at (7, 3).",
    },
  },
  {
    id: "m-quadratic-roots",
    sectionId: "math",
    domainId: "advanced-math",
    difficulty: "medium",
    prompt: "What are the solutions to x² − 5x + 6 = 0?",
    choices: ["x = 2 and x = 3", "x = −2 and x = −3", "x = 1 and x = 6", "x = −1 and x = 6"],
    answer: 0,
    explanation: {
      uz: "Ko'paytmasi 6, yig'indisi 5 bo'lgan sonlar — 2 va 3: (x − 2)(x − 3) = 0, demak x = 2 yoki x = 3.",
      ru: "Числа с произведением 6 и суммой 5 — это 2 и 3: (x − 2)(x − 3) = 0, значит x = 2 или x = 3.",
      en: "Find numbers with product 6 and sum 5: 2 and 3. So (x − 2)(x − 3) = 0, giving x = 2 or x = 3.",
    },
  },
  {
    id: "m-function-eval",
    sectionId: "math",
    domainId: "advanced-math",
    difficulty: "easy",
    prompt: "The function f is defined by f(x) = 2x² − 3. What is the value of f(−2)?",
    choices: ["−11", "5", "11", "−5"],
    answer: 1,
    explanation: {
      uz: "(−2)² = 4, demak f(−2) = 2·4 − 3 = 5. Tuzoq: −2 ni kvadratga oshirishda manfiy ishorani saqlab qolish.",
      ru: "(−2)² = 4, значит f(−2) = 2·4 − 3 = 5. Ловушка — сохранить минус при возведении в квадрат.",
      en: "(−2)² = 4, so f(−2) = 2·4 − 3 = 5. The trap is keeping the negative sign when squaring.",
    },
  },
  {
    id: "m-percent-sale",
    sectionId: "math",
    domainId: "data-analysis",
    difficulty: "easy",
    prompt: "A jacket originally costs $80. It is on sale for 25% off. What is the sale price of the jacket?",
    choices: ["$20", "$55", "$60", "$65"],
    answer: 2,
    explanation: {
      uz: "80 ning 25% i = 20. Chegirmali narx: 80 − 20 = 60 (yoki 80 × 0,75 = 60). $20 — bu chegirma miqdori, narx emas.",
      ru: "25% от 80 = 20. Цена со скидкой: 80 − 20 = 60 (или 80 × 0,75). $20 — это размер скидки, а не цена.",
      en: "25% of 80 is 20, so the sale price is 80 − 20 = 60 (or 80 × 0.75). $20 is the discount, not the price.",
    },
  },
  {
    id: "m-mean-missing",
    sectionId: "math",
    domainId: "data-analysis",
    difficulty: "medium",
    prompt: "The mean of four numbers is 12. Three of the numbers are 10, 14, and 9. What is the fourth number?",
    choices: ["11", "13", "15", "17"],
    answer: 2,
    explanation: {
      uz: "To'rt sonning yig'indisi 4 × 12 = 48. Ma'lum sonlar yig'indisi 33. To'rtinchi son: 48 − 33 = 15.",
      ru: "Сумма четырёх чисел 4 × 12 = 48. Сумма известных — 33. Четвёртое число: 48 − 33 = 15.",
      en: "The four numbers sum to 4 × 12 = 48. The known three sum to 33, so the fourth is 48 − 33 = 15.",
    },
  },
  {
    id: "m-probability-marbles",
    sectionId: "math",
    domainId: "data-analysis",
    difficulty: "easy",
    prompt:
      "A bag contains 3 red, 5 blue, and 2 green marbles. If one marble is selected at random, what is the probability that it is blue?",
    choices: ["1/5", "3/10", "1/2", "5/7"],
    answer: 2,
    explanation: {
      uz: "Jami 3 + 5 + 2 = 10 ta. Ko'k — 5 ta. Ehtimollik 5/10 = 1/2. 5/7 tuzoq: maxraj jami emas, faqat “ko'k bo'lmagan”lar.",
      ru: "Всего 3 + 5 + 2 = 10 шариков, синих — 5. Вероятность 5/10 = 1/2. 5/7 — ловушка: в знаменателе должно быть общее число.",
      en: "There are 3 + 5 + 2 = 10 marbles, 5 of them blue: 5/10 = 1/2. 5/7 is a trap — the denominator must be the total.",
    },
  },
  {
    id: "m-pythagorean",
    sectionId: "math",
    domainId: "geometry-trig",
    difficulty: "easy",
    prompt: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?",
    choices: ["10", "12", "14", "√28"],
    answer: 0,
    explanation: {
      uz: "Pifagor: c² = 6² + 8² = 36 + 64 = 100, c = 10. (6-8-10 — 3-4-5 uchburchakning ikki baravari.)",
      ru: "По Пифагору: c² = 36 + 64 = 100, c = 10. (6-8-10 — это треугольник 3-4-5, увеличенный вдвое.)",
      en: "Pythagorean theorem: c² = 36 + 64 = 100, so c = 10. (6-8-10 is a 3-4-5 triangle doubled.)",
    },
  },
  {
    id: "m-circle-area",
    sectionId: "math",
    domainId: "geometry-trig",
    difficulty: "medium",
    prompt: "A circle has an area of 49π square units. What is the circumference of the circle, in units?",
    choices: ["7π", "14π", "49π", "98π"],
    answer: 1,
    explanation: {
      uz: "πr² = 49π → r = 7. Aylana uzunligi 2πr = 14π. Formulalar varag'ida ikkala formula ham bor.",
      ru: "πr² = 49π → r = 7. Длина окружности 2πr = 14π. Обе формулы есть в справочном листе.",
      en: "πr² = 49π gives r = 7, so the circumference is 2πr = 14π. Both formulas are on the reference sheet.",
    },
  },
];

export const questions: Question[] = [...baseQuestions, ...extraQuestions, ...sprQuestions];

const byId = new Map(questions.map((q) => [q.id, q]));

export function getQuestion(id: string) {
  return byId.get(id);
}

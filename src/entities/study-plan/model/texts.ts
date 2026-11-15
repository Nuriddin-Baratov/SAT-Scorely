import type { Locale } from "@/shared/i18n";

import type { Difficulty, PhaseId, SessionKind } from "./types";

interface PlanTexts {
  phases: Record<PhaseId, { name: string; description: string }>;
  depth: Record<PhaseId, string>;
  difficulty: Record<Difficulty, string>;
  kinds: Record<SessionKind, string>;
  reviewPrefix: string;
  vocab: string;
  blocks: {
    warmup: string;
    warmupDetail: string;
    theory: string;
    recall: string;
    practice: string;
    practiceDetail: (questions: number, difficulty: string, timed: boolean, seconds: number) => string;
    mistakes: string;
    mistakesDetail: string;
    module: string;
    moduleDetail: (questions: number) => string;
    analysis: string;
    analysisDetail: string;
    notebook: string;
    notebookDetail: string;
    logistics: string;
    logisticsDetail: string;
    rest: string;
    restDetail: string;
    fullTest: { label: string; minutes: number; detail: string }[];
  };
  titles: {
    diagnostic: string;
    practiceTest: string;
    finalTest: string;
    lastTest: string;
    moduleTest: (section: "rw" | "math") => string;
    moduleSubtitle: string;
    fullSubtitle: string;
    prep: string;
    prepSubtitle: string;
  };
}

const uz: PlanTexts = {
  phases: {
    foundation: { name: "Poydevor", description: "Diagnostika, eng zaif mavzular bo'yicha qoidalar va asosiy strategiyalar. Tezlikdan ko'ra aniqlik muhim." },
    growth: { name: "O'sish", description: "Murakkab savol turlari, modul testlari va xatolar tahlili. Bilimni barqaror ko'nikmaga aylantirish." },
    "test-practice": { name: "Test amaliyoti", description: "Haftalik to'liq amaliy testlar, vaqt boshqaruvi va adaptiv formatga moslashish." },
    final: { name: "Yakuniy tayyorgarlik", description: "Takrorlash, xatolar daftarini ko'rib chiqish, dam olish va test kuniga ruhiy tayyorgarlik." },
  },
  depth: { foundation: "Asoslar", growth: "Chuqurlashtirish", "test-practice": "Vaqt bilan ishlash", final: "Takrorlash" },
  difficulty: { easy: "Oson", medium: "O'rta", hard: "Qiyin", mixed: "Aralash" },
  kinds: {
    diagnostic: "Diagnostika",
    lesson: "Dars",
    "module-test": "Modul testi",
    "practice-test": "Amaliy test",
    review: "Takrorlash",
    "test-prep": "Test kuni",
  },
  reviewPrefix: "Takrorlash",
  vocab: " + 15 ta akademik so'zni kontekst bilan takrorlang.",
  blocks: {
    warmup: "Isitish",
    warmupDetail: "Oldingi darsdagi 3 ta xatoni qayta yeching.",
    theory: "Nazariya va strategiya",
    recall: "Qoidalarni eslash",
    practice: "Amaliyot",
    practiceDetail: (q, d, timed, s) => `${q} ta savol · ${d} daraja · ${timed ? `vaqt bilan (${s} soniya/savol)` : "vaqtsiz, tushunishga e'tibor"}.`,
    mistakes: "Xatolar tahlili",
    mistakesDetail: "Har bir xatoni sababi bilan (bilim / e'tibor / vaqt) xatolar daftariga yozing.",
    module: "Modul",
    moduleDetail: (q) => `${q} ta savol, taymer bilan.`,
    analysis: "Tahlil",
    analysisDetail: "Har bir xato va taxmin qilingan savolni qayta yeching, sababini yozing.",
    notebook: "Xatolar daftari",
    notebookDetail: "Eng ko'p takrorlangan 10 ta xatoni ko'rib chiqing. Yangi mavzu o'rganmang.",
    logistics: "Logistika",
    logisticsDetail: "Bluebook'ni yangilang, qurilmani zaryadlang, admission ticket va pasportni tayyorlang.",
    rest: "Dam olish",
    restDetail: "Erta uxlang. Yaxshi uyqu — eng arzon +30 ball.",
    fullTest: [
      { label: "Reading & Writing · 1-modul", minutes: 32, detail: "27 ta savol. Aniqlikka e'tibor bering — 2-modul qiyinligi shunga bog'liq." },
      { label: "Reading & Writing · 2-modul", minutes: 32, detail: "27 ta adaptiv savol." },
      { label: "Tanaffus", minutes: 10, detail: "Suv iching, ekrandan uzoqlashing." },
      { label: "Math · 1-modul", minutes: 35, detail: "22 ta savol. Desmos'dan unumli foydalaning." },
      { label: "Math · 2-modul", minutes: 35, detail: "22 ta adaptiv savol." },
    ],
  },
  titles: {
    diagnostic: "Diagnostik test",
    practiceTest: "To'liq amaliy test",
    finalTest: "Yakuniy amaliy test",
    lastTest: "So'nggi amaliy test",
    moduleTest: (s) => (s === "math" ? "Math modul testi" : "Reading & Writing modul testi"),
    moduleSubtitle: "Real vaqt sharoitida bitta modul",
    fullSubtitle: "Bluebook · to'liq adaptiv test",
    prep: "Test kuniga tayyorgarlik",
    prepSubtitle: "Yengil takrorlash va dam olish",
  },
};

const ru: PlanTexts = {
  phases: {
    foundation: { name: "Фундамент", description: "Диагностика, правила по самым слабым темам и базовые стратегии. Точность важнее скорости." },
    growth: { name: "Рост", description: "Сложные типы вопросов, тесты по модулям и разбор ошибок. Превращаем знания в устойчивый навык." },
    "test-practice": { name: "Практика тестов", description: "Еженедельные полные тесты, управление временем и привыкание к адаптивному формату." },
    final: { name: "Финальная подготовка", description: "Повторение, тетрадь ошибок, отдых и психологическая подготовка ко дню экзамена." },
  },
  depth: { foundation: "Основы", growth: "Углубление", "test-practice": "Работа на время", final: "Повторение" },
  difficulty: { easy: "Лёгкий", medium: "Средний", hard: "Сложный", mixed: "Смешанный" },
  kinds: {
    diagnostic: "Диагностика",
    lesson: "Урок",
    "module-test": "Тест модуля",
    "practice-test": "Практический тест",
    review: "Повторение",
    "test-prep": "День экзамена",
  },
  reviewPrefix: "Повторение",
  vocab: " + повторите 15 академических слов в контексте.",
  blocks: {
    warmup: "Разминка",
    warmupDetail: "Перерешайте 3 ошибки с прошлого урока.",
    theory: "Теория и стратегия",
    recall: "Вспомнить правила",
    practice: "Практика",
    practiceDetail: (q, d, timed, s) => `${q} вопр. · уровень: ${d} · ${timed ? `на время (${s} сек/вопрос)` : "без таймера, акцент на понимание"}.`,
    mistakes: "Разбор ошибок",
    mistakesDetail: "Запишите каждую ошибку в тетрадь с причиной (знания / внимательность / время).",
    module: "Модуль",
    moduleDetail: (q) => `${q} вопр. с таймером.`,
    analysis: "Разбор",
    analysisDetail: "Перерешайте каждую ошибку и угаданный вопрос, запишите причину.",
    notebook: "Тетрадь ошибок",
    notebookDetail: "Просмотрите 10 самых частых ошибок. Новые темы не начинайте.",
    logistics: "Логистика",
    logisticsDetail: "Обновите Bluebook, зарядите устройство, подготовьте admission ticket и паспорт.",
    rest: "Отдых",
    restDetail: "Ложитесь пораньше. Хороший сон — самые дешёвые +30 баллов.",
    fullTest: [
      { label: "Reading & Writing · модуль 1", minutes: 32, detail: "27 вопросов. Следите за точностью — от неё зависит сложность модуля 2." },
      { label: "Reading & Writing · модуль 2", minutes: 32, detail: "27 адаптивных вопросов." },
      { label: "Перерыв", minutes: 10, detail: "Попейте воды, отойдите от экрана." },
      { label: "Math · модуль 1", minutes: 35, detail: "22 вопроса. Активно используйте Desmos." },
      { label: "Math · модуль 2", minutes: 35, detail: "22 адаптивных вопроса." },
    ],
  },
  titles: {
    diagnostic: "Диагностический тест",
    practiceTest: "Полный практический тест",
    finalTest: "Итоговый практический тест",
    lastTest: "Последний практический тест",
    moduleTest: (s) => (s === "math" ? "Тест модуля Math" : "Тест модуля Reading & Writing"),
    moduleSubtitle: "Один модуль в реальном времени",
    fullSubtitle: "Bluebook · полный адаптивный тест",
    prep: "Подготовка ко дню экзамена",
    prepSubtitle: "Лёгкое повторение и отдых",
  },
};

const en: PlanTexts = {
  phases: {
    foundation: { name: "Foundation", description: "Diagnostics, rules for your weakest topics and core strategies. Accuracy over speed." },
    growth: { name: "Growth", description: "Harder question types, module tests and error analysis. Turning knowledge into reliable skill." },
    "test-practice": { name: "Test practice", description: "Weekly full practice tests, time management and getting used to the adaptive format." },
    final: { name: "Final prep", description: "Review, your mistake notebook, rest and mental preparation for test day." },
  },
  depth: { foundation: "Fundamentals", growth: "Going deeper", "test-practice": "Timed work", final: "Review" },
  difficulty: { easy: "Easy", medium: "Medium", hard: "Hard", mixed: "Mixed" },
  kinds: {
    diagnostic: "Diagnostic",
    lesson: "Lesson",
    "module-test": "Module test",
    "practice-test": "Practice test",
    review: "Review",
    "test-prep": "Test day",
  },
  reviewPrefix: "Review",
  vocab: " + review 15 academic words in context.",
  blocks: {
    warmup: "Warm-up",
    warmupDetail: "Redo 3 mistakes from your last lesson.",
    theory: "Theory and strategy",
    recall: "Recall the rules",
    practice: "Practice",
    practiceDetail: (q, d, timed, s) => `${q} questions · ${d} level · ${timed ? `timed (${s} sec/question)` : "untimed, focus on understanding"}.`,
    mistakes: "Error analysis",
    mistakesDetail: "Log every mistake in your notebook with its cause (knowledge / attention / time).",
    module: "Module",
    moduleDetail: (q) => `${q} questions, timed.`,
    analysis: "Review",
    analysisDetail: "Redo every miss and every guess, and write down why.",
    notebook: "Mistake notebook",
    notebookDetail: "Go over your 10 most frequent mistakes. Don't start new topics.",
    logistics: "Logistics",
    logisticsDetail: "Update Bluebook, charge your device, get your admission ticket and passport ready.",
    rest: "Rest",
    restDetail: "Go to bed early. Good sleep is the cheapest +30 points.",
    fullTest: [
      { label: "Reading & Writing · module 1", minutes: 32, detail: "27 questions. Focus on accuracy — module 2's difficulty depends on it." },
      { label: "Reading & Writing · module 2", minutes: 32, detail: "27 adaptive questions." },
      { label: "Break", minutes: 10, detail: "Drink some water and step away from the screen." },
      { label: "Math · module 1", minutes: 35, detail: "22 questions. Make good use of Desmos." },
      { label: "Math · module 2", minutes: 35, detail: "22 adaptive questions." },
    ],
  },
  titles: {
    diagnostic: "Diagnostic test",
    practiceTest: "Full practice test",
    finalTest: "Final practice test",
    lastTest: "Last practice test",
    moduleTest: (s) => (s === "math" ? "Math module test" : "Reading & Writing module test"),
    moduleSubtitle: "One module under real timing",
    fullSubtitle: "Bluebook · full adaptive test",
    prep: "Test-day preparation",
    prepSubtitle: "Light review and rest",
  },
};

const byLocale: Record<Locale, PlanTexts> = { uz, ru, en };

export function planTexts(locale: Locale): PlanTexts {
  return byLocale[locale];
}

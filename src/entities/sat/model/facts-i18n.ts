import type { Locale } from "@/shared/i18n";

import { faq, satTimeline, scoreBands, strategies, testDayChecklist } from "./facts";

interface FactsText {
  scoreBands: { range: string; percentile: string; label: string; note: string }[];
  timeline: { title: string; text: string }[];
  checklist: string[];
  strategies: { title: string; text: string }[];
  faq: { q: string; a: string }[];
}

const ru: FactsText = {
  scoreBands: [
    { range: "1500–1600", percentile: "99+", label: "Элита", note: "Конкурентоспособно для Ivy League, MIT, Stanford и вузов такого уровня." },
    { range: "1400–1490", percentile: "94–98", label: "Отлично", note: "Сильный результат для топ-50 университетов и крупных грантов." },
    { range: "1200–1390", percentile: "75–93", label: "Хорошо", note: "Достаточно для многих хороших университетов и merit-стипендий." },
    { range: "1000–1190", percentile: "40–74", label: "Средне", note: "Средний уровень. С целенаправленной подготовкой можно быстро вырасти." },
    { range: "400–990", percentile: "< 40", label: "Начальный", note: "Укрепление фундамента — именно здесь самый большой рост." },
  ],
  timeline: [
    { title: "Регистрация", text: "Создайте аккаунт College Board и выберите дату и центр на satsuite.collegeboard.org. Места заканчиваются быстро — регистрируйтесь за 2–3 месяца." },
    { title: "Установка Bluebook", text: "Скачайте приложение Bluebook (Windows, macOS, iPad, школьный Chromebook) и пройдите полные практические тесты." },
    { title: "Допуск", text: "Перед экзаменом проверьте устройство в Bluebook и скачайте admission ticket." },
    { title: "День экзамена", text: "Приходите заранее с паспортом, заряженным устройством, зарядкой и admission ticket." },
    { title: "Результаты", text: "Баллы обычно появляются через несколько дней в аккаунте College Board и в приложении BigFuture School." },
  ],
  checklist: [
    "Действующий документ с фото (на международном тесте — паспорт)",
    "Полностью заряженное устройство с Bluebook и зарядка",
    "Admission ticket (через Bluebook)",
    "Карандаш или ручка — бумага для черновика выдаётся",
    "Разрешённый калькулятор (необязательно — Desmos встроен в приложение)",
    "Вода и лёгкий перекус на перерыв",
  ],
  strategies: [
    { title: "Отвечайте на каждый вопрос", text: "За неверный ответ баллы не снимают. Никогда не оставляйте вопрос пустым." },
    { title: "Серьёзно относитесь к модулю 1", text: "Сложность модуля 2 зависит от результата первого. Для высокого балла в модуле 1 важна точность." },
    { title: "Освойте Desmos", text: "Системы уравнений, квадратичные функции и неравенства решаются графически за секунды." },
    { title: "Используйте «Mark for Review»", text: "Не задерживайтесь на трудном вопросе дольше 90 секунд — отметьте его и вернитесь в конце." },
    { title: "Ведите тетрадь ошибок", text: "Записывайте причину каждой ошибки: знания, внимательность или время. Закономерности станут видны быстро." },
    { title: "Тренируйтесь в реальных условиях", text: "Проходите полные практические тесты в Bluebook, с таймером и перерывом." },
  ],
  faq: [
    { q: "Чем Digital SAT отличается от бумажного?", a: "Тест сократился с 3 часов до 2 часов 14 минут, тексты короткие (по одному вопросу на каждый), калькулятор разрешён во всём разделе математики, а тест адаптивен на уровне раздела. Результаты приходят гораздо быстрее." },
    { q: "Как работает адаптивный тест?", a: "Каждый раздел состоит из двух модулей. Первый — смесь вопросов разной сложности. По его результату второй модуль будет легче или сложнее. Высокие баллы возможны только в более сложном втором модуле." },
    { q: "Снимают ли баллы за неверный ответ?", a: "Нет. Учитываются только верные ответы, поэтому отвечать нужно на все вопросы." },
    { q: "Сколько раз можно сдавать SAT?", a: "Ограничений нет. Большинство сдаёт 2–3 раза. Многие университеты делают «superscore» — объединяют лучшие баллы по разделам из разных дат." },
    { q: "Сколько действует результат?", a: "College Board хранит баллы годами, но большинство университетов принимает результаты за последние 5 лет. Требования каждого вуза проверяйте отдельно." },
    { q: "Когда международные даты экзамена?", a: "Международный SAT обычно проводится 7 раз в год: в марте, мае, июне, августе, октябре, ноябре и декабре. Точные даты и цены всегда проверяйте на satsuite.collegeboard.org." },
    { q: "Сколько времени нужно на подготовку?", a: "Для большинства оптимальны 8–16 недель регулярной подготовки. Для роста на 100+ баллов обычно нужно 40–80 часов качественной практики. SAT Pro строит ваш план именно с этим расчётом." },
  ],
};

const en: FactsText = {
  scoreBands: [
    { range: "1500–1600", percentile: "99+", label: "Elite", note: "Competitive for the Ivy League, MIT, Stanford and peer universities." },
    { range: "1400–1490", percentile: "94–98", label: "Excellent", note: "A strong result for top-50 universities and major scholarships." },
    { range: "1200–1390", percentile: "75–93", label: "Good", note: "Enough for many good universities and merit scholarships." },
    { range: "1000–1190", percentile: "40–74", label: "Average", note: "Mid-range. Focused prep can bring fast gains." },
    { range: "400–990", percentile: "< 40", label: "Beginner", note: "Building the foundation — this is where the biggest gains happen." },
  ],
  timeline: [
    { title: "Register", text: "Create a College Board account and pick a date and test center at satsuite.collegeboard.org. Seats fill fast — register 2–3 months ahead." },
    { title: "Install Bluebook", text: "Download the Bluebook app (Windows, macOS, iPad, school Chromebook) and take the full-length practice tests." },
    { title: "Admission ticket", text: "Before test day, check your device in Bluebook and download your admission ticket." },
    { title: "Test day", text: "Arrive early with your passport, a charged device, a charger and your admission ticket." },
    { title: "Scores", text: "Scores usually appear within a few days in your College Board account and the BigFuture School app." },
  ],
  checklist: [
    "Valid photo ID (a passport for international testing)",
    "A fully charged device with Bluebook installed, plus a charger",
    "Admission ticket (from Bluebook)",
    "Pencil or pen — scratch paper is provided",
    "An approved calculator (optional — Desmos is built into the app)",
    "Water and a light snack for the break",
  ],
  strategies: [
    { title: "Answer every question", text: "Wrong answers aren't penalized. Never leave a question blank." },
    { title: "Take module 1 seriously", text: "Module 2's difficulty depends on module 1. For a high score, accuracy in module 1 matters." },
    { title: "Learn Desmos", text: "Systems of equations, quadratics and inequalities can be solved graphically in seconds." },
    { title: "Use “Mark for Review”", text: "Don't spend more than 90 seconds on a hard question — mark it and come back at the end." },
    { title: "Keep a mistake log", text: "Write down why you missed each question: knowledge, attention or time. Patterns show up quickly." },
    { title: "Practice under real conditions", text: "Take full practice tests in Bluebook, timed, with the break." },
  ],
  faq: [
    { q: "How is the Digital SAT different from the paper test?", a: "It's shorter (2 h 14 min instead of 3 hours), passages are short with one question each, a calculator is allowed on the whole math section, and the test is adaptive by section. Scores also arrive much faster." },
    { q: "How does the adaptive test work?", a: "Each section has two modules. The first mixes easy, medium and hard questions. Based on how you do, the second module is easier or harder. Top scores are only possible on the harder second module." },
    { q: "Are wrong answers penalized?", a: "No. Only correct answers count, so you should answer every question." },
    { q: "How many times can I take the SAT?", a: "There's no limit. Most students take it 2–3 times. Many universities “superscore” — combining your best section scores from different dates." },
    { q: "How long are scores valid?", a: "The College Board keeps scores for years, but most universities accept results from the last 5 years. Check each university's requirements." },
    { q: "When are the international test dates?", a: "The international SAT is usually offered 7 times a year: March, May, June, August, October, November and December. Always confirm exact dates and fees at satsuite.collegeboard.org." },
    { q: "How long should I prepare?", a: "For most students, 8–16 weeks of steady prep is ideal. Gaining 100+ points usually takes 40–80 hours of quality practice. SAT Pro builds your plan around exactly that." },
  ],
};

const uz: FactsText = {
  scoreBands: scoreBands.map((b) => ({ ...b })),
  timeline: satTimeline.map((t) => ({ ...t })),
  checklist: [...testDayChecklist],
  strategies: strategies.map((s) => ({ ...s })),
  faq: faq.map((f) => ({ ...f })),
};

const byLocale: Record<Locale, FactsText> = { uz, ru, en };

/** SAT haqidagi faktlar tanlangan tilda */
export function getSatFacts(locale: Locale): FactsText {
  return byLocale[locale];
}

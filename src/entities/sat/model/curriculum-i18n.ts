import type { DomainId, SectionId } from "./types";

/** Ko'nikma matnlari tarjimasi. O'zbekcha manba — `curriculum.ts`. */
interface SkillText {
  /** Ko'nikma nomi (ru uchun; en uchun rasmiy inglizcha nom ishlatiladi) */
  name?: string;
  summary: string;
  strategies: string[];
  traps: string[];
}

interface CurriculumText {
  sections: Record<SectionId, { description: string; highlights: string[] }>;
  domains: Record<DomainId, string>;
  skills: Record<string, SkillText>;
}

export const curriculumRu: CurriculumText = {
  sections: {
    rw: {
      description:
        "Каждый вопрос основан на коротком тексте (25–150 слов) или паре текстов. Тексты из литературы, истории, социальных и естественных наук, гуманитарных областей.",
      highlights: ["К каждому тексту — только один вопрос", "Все вопросы — с выбором из 4 вариантов", "Вопросы сгруппированы по навыкам, от лёгких к сложным"],
    },
    math: {
      description:
        "Калькулятор разрешён во всём разделе — в Bluebook встроен графический калькулятор Desmos. Также выдаётся справочный лист с формулами.",
      highlights: ["≈75% — тест, ≈25% — вопросы со своим ответом (SPR)", "Калькулятор Desmos и лист формул", "≈30% вопросов — в реальном жизненном контексте"],
    },
  },
  domains: {
    "information-ideas": "Понимание текста, поиск и оценка доказательств, выводы — в том числе из таблиц и графиков.",
    "craft-structure": "Значение слова в контексте, анализ структуры и цели текста, сравнение двух текстов.",
    "expression-ideas": "Улучшение письменного текста под цель: синтез из заметок и логические связки.",
    conventions: "Грамматика, пунктуация и строение предложения — самый быстро растущий раздел, основанный на правилах.",
    algebra: "Линейные уравнения, неравенства, функции и системы — фундамент математики SAT.",
    "advanced-math": "Квадратичные, показательные, полиномиальные и рациональные функции — решающий раздел для высокого балла.",
    "data-analysis": "Отношения, проценты, единицы, статистика, вероятность и интерпретация данных.",
    "geometry-trig": "Площадь и объём, углы, треугольники, тригонометрия прямоугольного треугольника и окружности.",
  },
  skills: {
    "central-ideas": {
      name: "Главная мысль и детали",
      summary: "Определить центральную мысль текста и ключевые детали, которые её поддерживают.",
      strategies: [
        "Прочитав текст, сформулируйте его суть одним предложением своими словами — потом смотрите варианты.",
        "Верный ответ охватывает весь текст, а не одно предложение.",
        "Сразу отбрасывайте вариант, подтверждающий то, чего нет в тексте.",
      ],
      traps: ["Вариант повторяет слова из текста, но с другим смыслом", "Слишком широкое или слишком узкое обобщение"],
    },
    "command-evidence-textual": {
      name: "Доказательства: текстовые",
      summary: "Выбрать цитату или факт, который сильнее всего поддерживает или ослабляет утверждение.",
      strategies: [
        "Сначала чётко выделите утверждение: что именно нужно доказать?",
        "Проверяйте каждый вариант: «Если это правда, утверждение усиливается?»",
        "Остерегайтесь вариантов по теме, которые не касаются конкретной части утверждения.",
      ],
      traps: ["Доказательство по теме, но не подтверждающее утверждение", "Доказательство в обратную сторону (ослабляющее)"],
    },
    "command-evidence-quant": {
      name: "Доказательства: количественные (таблица/график)",
      summary: "Использовать данные таблицы или графика, чтобы дополнить или подтвердить утверждение в тексте.",
      strategies: [
        "Сначала прочитайте заголовок графика, оси и единицы.",
        "Сверьте каждое число варианта с графиком — одна ошибка делает вариант неверным.",
        "Отбросьте вариант, верный по графику, но не связанный с утверждением в тексте.",
      ],
      traps: ["Данные соответствуют графику, но не относятся к утверждению", "Путаница двух столбцов или лет"],
    },
    inferences: {
      name: "Логический вывод",
      summary: "Выбрать наиболее логичное продолжение, вытекающее из текста (заполнить пропуск).",
      strategies: [
        "Восстановите логическую цепочку текста: A → B → ?",
        "Выбирайте самый осторожный вариант, полностью подтверждённый текстом.",
        "С подозрением относитесь к сильным словам: «always», «never», «only».",
      ],
      traps: ["Правдоподобный вывод, который не следует из текста", "Слишком сильное обобщение"],
    },
    "words-in-context": {
      name: "Слово в контексте",
      summary: "Выбрать самое точное и логичное слово или выражение в контексте текста.",
      strategies: [
        "Не глядя на варианты, подставьте своё слово в пропуск, затем выберите ближайшее.",
        "Следите за словами-сигналами (however, because, despite) — они задают направление смысла.",
        "Учите 15–20 академических слов в день вместе с контекстом.",
      ],
      traps: ["Слово с неверной (положительной/отрицательной) окраской", "Известное слово, но в этом контексте с другим значением"],
    },
    "text-structure": {
      name: "Структура и цель текста",
      summary: "Понять, зачем автор написал текст или какую функцию выполняет конкретное предложение.",
      strategies: [
        "Коротко помечайте роль каждого предложения: утверждение, пример, контраргумент, вывод.",
        "Смотрите на глаголы в вариантах (describes, challenges, illustrates) — они должны быть точными.",
        "Каждая часть варианта должна соответствовать тексту.",
      ],
      traps: ["Частично верно: первая половина подходит, вторая — нет", "Неверная оценка тона автора"],
    },
    "cross-text": {
      name: "Связь между текстами",
      summary: "Сравнить два коротких текста и определить, как один автор отнёсся бы к мнению другого.",
      strategies: [
        "Запишите позицию каждого текста отдельным предложением.",
        "Найдите точную точку, где авторы согласны и где расходятся.",
        "Дважды проверьте, с чьей точки зрения задан вопрос.",
      ],
      traps: ["Перепутать тексты местами", "Полное опровержение или согласие, которого нет в тексте"],
    },
    transitions: {
      name: "Связующие слова",
      summary: "Выбрать связку, выражающую логическое отношение между двумя предложениями или идеями.",
      strategies: [
        "Сначала определите отношение: контраст, причина-следствие, дополнение, пример, последовательность.",
        "Учите связки группами: however/nevertheless, therefore/thus, moreover/furthermore, for example.",
        "Если два варианта из одной группы — возможно, оба неверны.",
      ],
      traps: ["Колебание между двумя связками с одинаковым смыслом", "Смотреть только на предыдущее предложение, не читая следующее"],
    },
    "rhetorical-synthesis": {
      name: "Риторический синтез",
      summary: "Выбрать из заметок студента предложение, лучше всего отвечающее цели (сравнить, подчеркнуть, представить).",
      strategies: [
        "До чтения заметок прочитайте цель в вопросе — это самое важное.",
        "Сразу убирайте варианты, не отвечающие цели полностью, даже если информация в них верна.",
        "Если просят «compare» — в варианте должны быть оба объекта.",
      ],
      traps: ["Предложение верно по заметкам, но не отвечает цели", "Сравнение, называющее только одну сторону"],
    },
    boundaries: {
      name: "Границы предложений и пунктуация",
      summary: "Правильно разделять предложения и их части запятой, точкой с запятой, двоеточием и тире.",
      strategies: [
        "Главное правило: два независимых предложения нельзя соединять одной запятой (comma splice).",
        "Точка с запятой = точка. С обеих сторон должно быть полное предложение.",
        "Перед двоеточием — полное предложение; после него — пояснение или перечень.",
      ],
      traps: ["Comma splice", "Лишняя запятая между подлежащим и сказуемым"],
    },
    "form-structure-sense": {
      name: "Форма, структура и смысл",
      summary: "Согласование подлежащего и сказуемого, местоимения, времена глагола, притяжательные формы и модификаторы.",
      strategies: [
        "Найдите подлежащее, мысленно уберите вставки и сверьте его со сказуемым.",
        "Определите, к какому существительному относится местоимение — число должно совпадать.",
        "Модификатор в начале предложения (Walking home, …) должен сразу продолжаться своим подлежащим.",
      ],
      traps: ["Неверное число после длинной вставки", "Путаница its/it's, their/they're"],
    },
    "linear-one-var": {
      name: "Линейные уравнения с одной переменной",
      summary: "Составлять и решать линейные уравнения с одним неизвестным, включая случаи с бесконечным числом решений или без решений.",
      strategies: [
        "Выполняйте одно и то же действие с обеими частями и записывайте каждый шаг.",
        "Нет решений: коэффициенты при x равны, свободные члены разные. Бесконечно много: равны и те, и другие.",
        "В текстовой задаче сначала запишите, что обозначает переменная.",
      ],
      traps: ["Потеря знака при умножении на отрицательное число", "Спрашивают не x, а 2x+1"],
    },
    "linear-functions": {
      name: "Линейные функции",
      summary: "Функции вида f(x)=mx+b: наклон, точка пересечения и их смысл в контексте.",
      strategies: [
        "Наклон = скорость роста (изменение на единицу), b = начальное значение.",
        "Если даны две точки: m = (y₂−y₁)/(x₂−x₁).",
        "Введите таблицу в Desmos и проверьте регрессией.",
      ],
      traps: ["Путаница смысла наклона и точки пересечения", "Игнорирование единиц"],
    },
    "linear-two-var": {
      name: "Линейные уравнения с двумя переменными",
      summary: "Уравнения вида Ax+By=C, их график и интерпретация в контексте.",
      strategies: [
        "Наклон из стандартной формы: m = −A/B.",
        "В контексте A и B — «цена» или «вес» каждой единицы.",
        "Подставьте точку с графика в уравнение для проверки.",
      ],
      traps: ["Неверный перенос знака", "Путаница осей x и y"],
    },
    "systems-linear": {
      name: "Системы линейных уравнений",
      summary: "Решать систему из двух линейных уравнений и определять число решений (0, 1, бесконечно много).",
      strategies: [
        "Метод вычитания часто самый быстрый; в Desmos нажмите на точку пересечения.",
        "Параллельные прямые (одинаковый наклон, разные b) — решений нет.",
        "Одно уравнение кратно другому — бесконечно много решений.",
      ],
      traps: ["Найти только x, забыв, что спрашивают x+y", "Ошибка при уравнивании коэффициентов"],
    },
    "linear-inequalities": {
      name: "Линейные неравенства",
      summary: "Неравенства и системы с одной или двумя переменными, ограничения в контексте.",
      strategies: [
        "При умножении или делении на отрицательное число знак меняется на противоположный.",
        "«At least» = ≥, «at most» = ≤, «no more than» = ≤.",
        "Быстро проверяйте, подставляя точки из вариантов в неравенство.",
      ],
      traps: ["Забыть поменять знак", "Путаница строгого и нестрогого неравенства"],
    },
    "equivalent-expressions": {
      name: "Эквивалентные выражения",
      summary: "Упрощение выражений, раскрытие скобок, разложение на множители и свойства степеней.",
      strategies: [
        "Выучите формулы сокращённого умножения: (a±b)², a²−b².",
        "Свойства степеней: aᵐ·aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐⁿ, a^(1/n) = ⁿ√a.",
        "Если сомневаетесь — подставьте x=2 и сравните с вариантами.",
      ],
      traps: ["Минус не распределён на всю скобку", "(a+b)² ≠ a²+b²"],
    },
    "nonlinear-equations": {
      name: "Нелинейные уравнения и системы",
      summary: "Решение квадратных, рациональных и иррациональных уравнений; системы из линейного и квадратного.",
      strategies: [
        "Дискриминант: D>0 — 2 корня, D=0 — 1, D<0 — нет.",
        "Виет: сумма корней −b/a, произведение c/a — экономит много времени.",
        "В уравнении с корнем обязательно проверяйте ответ (посторонний корень).",
      ],
      traps: ["Оставить посторонний корень в ответе", "Разделить обе части на x и потерять корень x=0"],
    },
    "nonlinear-functions": {
      name: "Нелинейные функции",
      summary: "Графики квадратичных, показательных и полиномиальных функций, их форма и смысл в контексте.",
      strategies: [
        "Знайте три формы: стандартную, вершинную и разложенную — каждая даёт свою информацию.",
        "Показательный рост: a·(1+r)ᵗ, убывание: a·(1−r)ᵗ.",
        "Меняйте параметр слайдером в Desmos и смотрите, как меняется график.",
      ],
      traps: ["Считать процентный рост линейным", "Сдвиг графика в обратную сторону (x−h)"],
    },
    "ratios-rates": {
      name: "Отношения, скорости, пропорции и единицы",
      summary: "Пропорции, перевод единиц и задачи на скорость.",
      strategies: [
        "Записывайте единицы дробями и сокращайте (анализ размерностей).",
        "В пропорции соответствующие величины должны стоять в одной строке.",
        "Дважды проверьте, в каких единицах требуется ответ.",
      ],
      traps: ["Деление вместо умножения при переводе единиц", "В квадратных единицах (м² → см²) умножить только один раз"],
    },
    percentages: {
      name: "Проценты",
      summary: "Процентное изменение, последовательные проценты и нахождение части.",
      strategies: [
        "Процентное изменение = (новое − старое) / старое × 100.",
        "Последовательные изменения перемножаются: 1.2 × 0.8 = 0.96 (−4%).",
        "«p% of x» = (p/100)·x.",
      ],
      traps: ["Складывать последовательные проценты", "Неверно выбрать базу (старое значение)"],
    },
    "one-var-data": {
      name: "Данные с одной переменной и меры центра",
      summary: "Среднее, медиана, мода, размах и стандартное отклонение; гистограммы и box plot.",
      strategies: [
        "Выброс сильно меняет среднее и слабо — медиану.",
        "Стандартное отклонение — разброс: насколько данные удалены от среднего.",
        "Для медианы в частотной таблице посчитайте общее количество.",
      ],
      traps: ["Усреднять значения частотной таблицы без учёта частот", "Путаница медианы и среднего"],
    },
    "two-var-data": {
      name: "Данные с двумя переменными и модели",
      summary: "Диаграммы рассеяния, линия наилучшего соответствия, линейные и показательные модели.",
      strategies: [
        "Умейте объяснить наклон линии тренда в контексте.",
        "Прогноз модели ≠ фактическое значение; разница — остаток (residual).",
        "Рост на одинаковую величину — линейный, в одинаковое число раз — показательный.",
      ],
      traps: ["Принимать корреляцию за причинность", "Неверно прочитать масштаб графика"],
    },
    probability: {
      name: "Вероятность и условная вероятность",
      summary: "Вычислять вероятность и условную вероятность по таблицам сопряжённости.",
      strategies: [
        "«Given that …» — в знаменателе только эта группа, а не общее количество.",
        "Отметьте пальцем нужную строку и столбец таблицы.",
        "Вероятность всегда от 0 до 1.",
      ],
      traps: ["Общее количество в знаменателе условной вероятности", "Путаница сумм по строкам и столбцам"],
    },
    "inference-stats": {
      name: "Выборка и погрешность",
      summary: "Выводы о генеральной совокупности по выборке и интерпретация погрешности.",
      strategies: [
        "Распространять вывод на всю совокупность можно только при случайной выборке.",
        "Чем больше выборка, тем меньше погрешность.",
        "Доверительный интервал: оценка ± погрешность.",
      ],
      traps: ["Общий вывод по неслучайной выборке", "Считать интервал точным значением"],
    },
    "evaluating-claims": {
      name: "Оценка статистических утверждений",
      summary: "Разница между наблюдением и экспериментом; какие выводы обоснованы данными.",
      strategies: [
        "Только эксперимент со случайным распределением позволяет говорить о причине и следствии.",
        "Наблюдательное исследование показывает лишь связь.",
        "Вывод не должен выходить за пределы группы, из которой взята выборка.",
      ],
      traps: ["Вывод о причинности по наблюдению", "Распространение вывода на неисследованную группу"],
    },
    "area-volume": {
      name: "Площадь и объём",
      summary: "Площади фигур и объёмы тел; как меняется результат при изменении размеров.",
      strategies: [
        "Пользуйтесь листом формул, но основные знайте наизусть — экономит время.",
        "Если длина растёт в k раз: площадь — в k², объём — в k³ раз.",
        "Сложную фигуру разбейте на простые части.",
      ],
      traps: ["Подставить диаметр вместо радиуса", "Не возвести коэффициент масштаба в квадрат/куб"],
    },
    "lines-angles-triangles": {
      name: "Прямые, углы и треугольники",
      summary: "Углы при параллельных прямых, сумма углов треугольника, подобные и равные треугольники.",
      strategies: [
        "Сумма углов треугольника 180°, внешний угол = сумме двух несмежных внутренних.",
        "В подобных треугольниках отношения соответствующих сторон равны.",
        "Выпишите все данные на чертёж — рисунок может быть не в масштабе.",
      ],
      traps: ["Доверять рисунку «на глаз»", "Неверно сопоставить соответствующие стороны"],
    },
    "right-triangles-trig": {
      name: "Прямоугольный треугольник и тригонометрия",
      summary: "Теорема Пифагора, особые треугольники (30-60-90, 45-45-90), sin/cos/tan, радианы.",
      strategies: [
        "SOH-CAH-TOA: sin = противолежащий/гипотенуза, cos = прилежащий/гипотенуза, tan = противолежащий/прилежащий.",
        "sin(x) = cos(90° − x) — часто встречается на SAT.",
        "Радианы: π рад = 180°.",
      ],
      traps: ["Не проверить режим калькулятора (градусы/радианы)", "Перепутать противолежащий и прилежащий катеты"],
    },
    circles: {
      name: "Окружности",
      summary: "Уравнение окружности, длина дуги, площадь сектора и центральные углы.",
      strategies: [
        "Уравнение: (x−h)² + (y−k)² = r²; для приведения к стандартному виду выделите полные квадраты.",
        "Длина дуги = (θ/360)·2πr, площадь сектора = (θ/360)·πr².",
        "Касательная перпендикулярна радиусу.",
      ],
      traps: ["Принять r² из уравнения за r", "Не поменять знак координат центра"],
    },
  },
};

export const curriculumEn: CurriculumText = {
  sections: {
    rw: {
      description:
        "Every question is based on a short passage (25–150 words) or a pair of passages, drawn from literature, history, social science, natural science and the humanities.",
      highlights: ["One question per passage", "All questions are four-option multiple choice", "Questions are grouped by skill, easy → hard"],
    },
    math: {
      description:
        "A calculator is allowed throughout — the Desmos graphing calculator is built into Bluebook. A reference sheet of formulas is provided too.",
      highlights: ["≈75% multiple choice, ≈25% student-produced response (SPR)", "Desmos calculator and reference sheet", "≈30% of questions are set in real-world contexts"],
    },
  },
  domains: {
    "information-ideas": "Understanding texts, finding and evaluating evidence, drawing inferences — including from tables and graphs.",
    "craft-structure": "Word meaning in context, analyzing a text's structure and purpose, and comparing two texts.",
    "expression-ideas": "Revising writing to meet a goal: synthesizing notes and choosing logical transitions.",
    conventions: "Grammar, punctuation and sentence structure — the most rule-based and fastest-improving area.",
    algebra: "Linear equations, inequalities, functions and systems — the foundation of SAT math.",
    "advanced-math": "Quadratic, exponential, polynomial and rational functions — the deciding area for top scores.",
    "data-analysis": "Ratios, percentages, units, statistics, probability and data interpretation.",
    "geometry-trig": "Area and volume, angles, triangles, right-triangle trigonometry and circles.",
  },
  skills: {
    "central-ideas": {
      summary: "Identify a passage's central idea and the key details that support it.",
      strategies: [
        "After reading, state the passage's point in one sentence of your own — then look at the choices.",
        "The right answer covers the whole passage, not just one sentence.",
        "Eliminate any choice that asserts something the passage doesn't say.",
      ],
      traps: ["A choice that repeats words from the passage but changes their meaning", "A generalization that's too broad or too narrow"],
    },
    "command-evidence-textual": {
      summary: "Choose the quotation or finding that most strongly supports or weakens a claim.",
      strategies: [
        "First isolate the claim: what exactly needs to be proven?",
        "Test each choice against the claim: “If this is true, is the claim stronger?”",
        "Beware of on-topic choices that miss the specific part of the claim.",
      ],
      traps: ["Evidence that's on topic but doesn't prove the claim", "Evidence pointing the opposite way (weakening)"],
    },
    "command-evidence-quant": {
      summary: "Use data from a table or graph to complete or support a claim in the text.",
      strategies: [
        "Read the graph's title, axes and units first.",
        "Check every number in a choice against the graph — one error disqualifies it.",
        "Drop choices that are true to the graph but unrelated to the claim.",
      ],
      traps: ["Data that matches the graph but not the claim", "Mixing up two columns or years"],
    },
    inferences: {
      summary: "Choose the most logical completion that follows from the passage (fill in the blank).",
      strategies: [
        "Rebuild the passage's logic chain: A → B → ?",
        "Pick the most cautious choice that the text fully supports.",
        "Be suspicious of strong words like “always,” “never” and “only.”",
      ],
      traps: ["A plausible conclusion the text doesn't support", "An overly strong generalization"],
    },
    "words-in-context": {
      summary: "Choose the most precise and logical word or phrase for the context.",
      strategies: [
        "Before looking at the choices, put your own word in the blank, then pick the closest match.",
        "Watch for signal words (however, because, despite) — they set the direction of meaning.",
        "Learn 15–20 academic words a day, in context.",
      ],
      traps: ["A word with the wrong positive/negative tone", "A familiar word used with a different meaning here"],
    },
    "text-structure": {
      summary: "Determine why the author wrote the text or what job a particular sentence does.",
      strategies: [
        "Label each sentence's role briefly: claim, example, counterpoint, conclusion.",
        "Look at the verbs in the choices (describes, challenges, illustrates) — they must be precise.",
        "Every part of a choice has to match the passage.",
      ],
      traps: ["Half right: the first half fits, the second doesn't", "Misjudging the author's tone"],
    },
    "cross-text": {
      summary: "Compare two short passages and decide how one author would respond to the other.",
      strategies: [
        "Write each passage's main position in one sentence.",
        "Find the exact point where they agree and where they differ.",
        "Double-check whose point of view the question asks for.",
      ],
      traps: ["Swapping the two passages", "Total rejection or total agreement that the text doesn't show"],
    },
    transitions: {
      summary: "Choose the transition that expresses the logical relationship between two sentences or ideas.",
      strategies: [
        "Name the relationship first: contrast, cause-effect, addition, example, sequence.",
        "Memorize transitions in groups: however/nevertheless, therefore/thus, moreover/furthermore, for example.",
        "If two choices come from the same group, both may be wrong.",
      ],
      traps: ["Hesitating between two transitions with the same meaning", "Reading only the sentence before, not the one after"],
    },
    "rhetorical-synthesis": {
      summary: "Pick the sentence from a student's notes that best accomplishes a specific goal (compare, emphasize, introduce).",
      strategies: [
        "Read the goal in the question before the notes — it's the most important part.",
        "Eliminate choices that don't fully meet the goal, even if their facts are correct.",
        "If asked to “compare,” both items must appear in the choice.",
      ],
      traps: ["A sentence that's true to the notes but misses the goal", "A comparison that mentions only one side"],
    },
    boundaries: {
      summary: "Correctly separate sentences and clauses with commas, semicolons, colons and dashes.",
      strategies: [
        "Core rule: two independent clauses can't be joined by a comma alone (comma splice).",
        "A semicolon works like a period — there must be a full sentence on both sides.",
        "A colon needs a complete sentence before it; an explanation or list follows.",
      ],
      traps: ["Comma splice", "An extra comma between subject and verb"],
    },
    "form-structure-sense": {
      summary: "Subject-verb agreement, pronouns, verb tense, possessives and modifiers.",
      strategies: [
        "Find the subject, mentally remove the extra words, and match it with the verb.",
        "Identify which noun a pronoun refers to — the number must match.",
        "An opening modifier (Walking home, …) must be followed immediately by the thing it describes.",
      ],
      traps: ["Wrong number after a long interrupting phrase", "Mixing up its/it's and their/they're"],
    },
    "linear-one-var": {
      summary: "Write and solve linear equations in one variable, including cases with infinitely many or no solutions.",
      strategies: [
        "Do the same operation to both sides and write down every step.",
        "No solution: equal x-coefficients, different constants. Infinitely many: both equal.",
        "In word problems, first write down what the variable represents.",
      ],
      traps: ["Losing a sign when multiplying by a negative", "The question asks for 2x+1, not x"],
    },
    "linear-functions": {
      summary: "Functions of the form f(x)=mx+b: slope, intercept and what they mean in context.",
      strategies: [
        "Slope = rate of change (change per unit); b = starting value.",
        "Given two points: m = (y₂−y₁)/(x₂−x₁).",
        "Enter a table in Desmos and check with a regression.",
      ],
      traps: ["Swapping the meanings of slope and intercept", "Ignoring units"],
    },
    "linear-two-var": {
      summary: "Equations of the form Ax+By=C, their graphs and interpretation in context.",
      strategies: [
        "Slope from standard form: m = −A/B.",
        "In context, A and B are the “price” or “weight” of each unit.",
        "Plug a point from the graph into the equation to check.",
      ],
      traps: ["Moving a term with the wrong sign", "Mixing up the x- and y-axes"],
    },
    "systems-linear": {
      summary: "Solve systems of two linear equations and determine the number of solutions (0, 1 or infinitely many).",
      strategies: [
        "Elimination is often fastest; in Desmos, click the intersection point.",
        "Parallel lines (same slope, different b) — no solution.",
        "One equation is a multiple of the other — infinitely many solutions.",
      ],
      traps: ["Finding only x when the question asks for x+y", "Errors when matching coefficients"],
    },
    "linear-inequalities": {
      summary: "Inequalities and systems in one or two variables, and constraints in context.",
      strategies: [
        "Multiplying or dividing by a negative flips the inequality sign.",
        "“At least” = ≥, “at most” = ≤, “no more than” = ≤.",
        "Test points from the choices in the inequality for a quick check.",
      ],
      traps: ["Forgetting to flip the sign", "Confusing strict and non-strict inequalities"],
    },
    "equivalent-expressions": {
      summary: "Simplifying expressions, expanding, factoring and exponent rules.",
      strategies: [
        "Memorize the special products: (a±b)², a²−b².",
        "Exponent rules: aᵐ·aⁿ = aᵐ⁺ⁿ, (aᵐ)ⁿ = aᵐⁿ, a^(1/n) = ⁿ√a.",
        "When in doubt, plug in x=2 and compare with the choices.",
      ],
      traps: ["Not distributing a negative across the whole parenthesis", "(a+b)² ≠ a²+b²"],
    },
    "nonlinear-equations": {
      summary: "Solving quadratic, rational and radical equations; linear-quadratic systems.",
      strategies: [
        "Discriminant: D>0 — 2 roots, D=0 — 1, D<0 — none.",
        "Vieta: sum of roots −b/a, product c/a — saves a lot of time.",
        "Always check answers to radical equations (extraneous roots).",
      ],
      traps: ["Keeping an extraneous root", "Dividing both sides by x and losing the root x=0"],
    },
    "nonlinear-functions": {
      summary: "Graphs of quadratic, exponential and polynomial functions, their shapes and meaning in context.",
      strategies: [
        "Know the three forms — standard, vertex and factored — each reveals different information.",
        "Exponential growth: a·(1+r)ᵗ; decay: a·(1−r)ᵗ.",
        "Use a Desmos slider to see how a parameter changes the graph.",
      ],
      traps: ["Treating percent growth as linear", "Shifting a graph the wrong way (x−h)"],
    },
    "ratios-rates": {
      summary: "Proportions, unit conversions and rate problems.",
      strategies: [
        "Write units as fractions and cancel them (dimensional analysis).",
        "In a proportion, keep matching quantities in the same row.",
        "Double-check which unit the answer asks for.",
      ],
      traps: ["Dividing instead of multiplying when converting units", "Converting square units (m² → cm²) only once"],
    },
    percentages: {
      summary: "Percent change, successive percentages and finding a percent of a quantity.",
      strategies: [
        "Percent change = (new − old) / old × 100.",
        "Successive changes multiply: 1.2 × 0.8 = 0.96 (−4%).",
        "“p% of x” = (p/100)·x.",
      ],
      traps: ["Adding successive percentages", "Choosing the wrong base (old value)"],
    },
    "one-var-data": {
      summary: "Mean, median, mode, range and standard deviation; histograms and box plots.",
      strategies: [
        "An outlier moves the mean a lot and the median only a little.",
        "Standard deviation measures spread: how far data sit from the mean.",
        "To find the median in a frequency table, count the total first.",
      ],
      traps: ["Averaging a frequency table's values without their frequencies", "Confusing median and mean"],
    },
    "two-var-data": {
      summary: "Scatterplots, lines of best fit, and linear vs. exponential models.",
      strategies: [
        "Be able to explain the slope of a line of best fit in context.",
        "A model's prediction ≠ the actual value; the difference is the residual.",
        "Growth by equal amounts is linear; by equal factors, exponential.",
      ],
      traps: ["Treating correlation as causation", "Misreading the graph's scale"],
    },
    probability: {
      summary: "Calculate probability and conditional probability from two-way tables.",
      strategies: [
        "“Given that …” — the denominator is only that group, not the grand total.",
        "Put a finger on the row and column you need.",
        "Probability is always between 0 and 1.",
      ],
      traps: ["Using the grand total as the denominator for conditional probability", "Mixing up row and column totals"],
    },
    "inference-stats": {
      summary: "Draw conclusions about a population from a sample and interpret the margin of error.",
      strategies: [
        "Generalize to the whole population only from a random sample.",
        "A larger sample means a smaller margin of error.",
        "Confidence interval: estimate ± margin of error.",
      ],
      traps: ["Generalizing from a non-random sample", "Treating an interval as an exact value"],
    },
    "evaluating-claims": {
      summary: "Observational studies vs. experiments; which conclusions the data actually support.",
      strategies: [
        "Only a randomized experiment supports cause-and-effect conclusions.",
        "An observational study shows only an association.",
        "A conclusion can't extend beyond the group the sample came from.",
      ],
      traps: ["Concluding causation from an observational study", "Extending a conclusion to an unstudied group"],
    },
    "area-volume": {
      summary: "Area of plane figures and volume of solids; how results change when dimensions change.",
      strategies: [
        "Use the reference sheet, but know the core formulas by heart — it saves time.",
        "If lengths scale by k: area scales by k², volume by k³.",
        "Break a complex shape into simple pieces.",
      ],
      traps: ["Using the diameter instead of the radius", "Not squaring/cubing the scale factor"],
    },
    "lines-angles-triangles": {
      summary: "Angles with parallel lines, triangle angle sums, similar and congruent triangles.",
      strategies: [
        "Triangle angles sum to 180°; an exterior angle equals the sum of the two remote interior angles.",
        "In similar triangles, corresponding side ratios are equal.",
        "Write every given value on the figure — it may not be drawn to scale.",
      ],
      traps: ["Trusting the figure “by eye”", "Pairing the wrong corresponding sides"],
    },
    "right-triangles-trig": {
      summary: "The Pythagorean theorem, special triangles (30-60-90, 45-45-90), sin/cos/tan and radians.",
      strategies: [
        "SOH-CAH-TOA: sin = opposite/hypotenuse, cos = adjacent/hypotenuse, tan = opposite/adjacent.",
        "sin(x) = cos(90° − x) — a frequent SAT pattern.",
        "Radians: π rad = 180°.",
      ],
      traps: ["Not checking the calculator's degree/radian mode", "Swapping the opposite and adjacent sides"],
    },
    circles: {
      summary: "Circle equations, arc length, sector area and central angles.",
      strategies: [
        "Equation: (x−h)² + (y−k)² = r²; complete the square to reach standard form.",
        "Arc length = (θ/360)·2πr; sector area = (θ/360)·πr².",
        "A tangent is perpendicular to the radius.",
      ],
      traps: ["Reading r² in the equation as r", "Not flipping the signs of the center's coordinates"],
    },
  },
};

import type { Localized } from "@/shared/i18n";

export interface VocabWord {
  word: string;
  pos: "adj" | "verb" | "noun";
  /** Ingliz tilidagi qisqa ta'rif */
  definition: string;
  /** Tarjima (en — sinonim) */
  translation: Localized;
  example: string;
}

const w = (word: string, pos: VocabWord["pos"], definition: string, uz: string, ru: string, en: string, example: string): VocabWord => ({
  word,
  pos,
  definition,
  translation: { uz, ru, en },
  example,
});

/** Digital SAT “Words in Context” savollarida ko'p uchraydigan akademik so'zlar. */
export const vocabWords: VocabWord[] = [
  w("abundant", "adj", "existing in large quantities", "mo'l, serob", "обильный", "plentiful", "Fossils are abundant in this layer of rock."),
  w("adverse", "adj", "harmful or unfavorable", "salbiy, zararli", "неблагоприятный", "harmful", "The drug had no adverse effects on patients."),
  w("advocate", "verb", "to publicly support", "qo'llab-quvvatlamoq", "выступать за", "champion", "She advocates for cleaner city transport."),
  w("ambiguous", "adj", "open to more than one interpretation", "noaniq, ikki ma'noli", "двусмысленный", "unclear", "The poem's ending is deliberately ambiguous."),
  w("anomaly", "noun", "something that deviates from what is normal", "g'ayrioddiy holat", "аномалия", "irregularity", "The cold summer was an anomaly in the data."),
  w("arbitrary", "adj", "based on random choice, not reason", "o'zboshimchalik bilan", "произвольный", "random", "The cutoff date seemed arbitrary to critics."),
  w("assert", "verb", "to state confidently", "ta'kidlamoq", "утверждать", "claim", "The author asserts that cities shape behavior."),
  w("benevolent", "adj", "kind and well-meaning", "mehribon, xayrixoh", "доброжелательный", "kind", "A benevolent donor funded the library."),
  w("candid", "adj", "honest and direct", "ochiq, samimiy", "откровенный", "frank", "In a candid interview, he admitted his errors."),
  w("coherent", "adj", "logical and consistent", "izchil, mantiqiy", "связный", "logical", "The essay presents a coherent argument."),
  w("compelling", "adj", "convincing; attracting strong interest", "ishonarli", "убедительный", "convincing", "The study offers compelling evidence."),
  w("comprehensive", "adj", "including nearly everything", "keng qamrovli", "всесторонний", "thorough", "A comprehensive review covered 200 studies."),
  w("concede", "verb", "to admit something is true, often reluctantly", "tan olmoq", "признавать", "admit", "The scientist conceded that the sample was small."),
  w("conventional", "adj", "following accepted customs", "an'anaviy", "традиционный", "traditional", "She rejected conventional painting techniques."),
  w("corroborate", "verb", "to confirm with evidence", "tasdiqlamoq", "подтверждать", "confirm", "New data corroborate the earlier findings."),
  w("credible", "adj", "able to be believed", "ishonchli", "достоверный", "believable", "The witness gave a credible account."),
  w("culminate", "verb", "to reach a final or highest point", "yakunlanmoq, cho'qqiga chiqmoq", "завершаться", "conclude", "Years of research culminated in a cure."),
  w("curtail", "verb", "to reduce or limit", "qisqartirmoq", "сокращать", "reduce", "The city curtailed water use during the drought."),
  w("deficient", "adj", "lacking something necessary", "yetishmaydigan", "недостаточный", "lacking", "The soil was deficient in nitrogen."),
  w("deliberate", "adj", "done intentionally", "ataylab qilingan", "намеренный", "intentional", "Her pauses were deliberate, not nervous."),
  w("depict", "verb", "to represent or show", "tasvirlamoq", "изображать", "portray", "The mural depicts the city's founding."),
  w("deter", "verb", "to discourage from acting", "to'xtatmoq, qaytarmoq", "удерживать", "discourage", "High fees deter many applicants."),
  w("diligent", "adj", "showing careful, steady effort", "tirishqoq", "усердный", "hardworking", "A diligent student reviews every mistake."),
  w("discern", "verb", "to perceive or recognize", "farqlamoq, ilg'amoq", "различать", "detect", "It is hard to discern a pattern in the data."),
  w("disparate", "adj", "fundamentally different", "bir-biridan tubdan farqli", "несопоставимый", "dissimilar", "The book unites disparate ideas."),
  w("elusive", "adj", "difficult to find or achieve", "qo'lga kiritish qiyin", "неуловимый", "hard to pin down", "A clear answer remained elusive."),
  w("empirical", "adj", "based on observation or experiment", "tajribaga asoslangan", "эмпирический", "observed", "The claim lacks empirical support."),
  w("endorse", "verb", "to declare public approval of", "ma'qullamoq", "одобрять", "approve", "Several experts endorsed the proposal."),
  w("enhance", "verb", "to improve the quality of", "yaxshilamoq", "улучшать", "improve", "Sleep enhances memory."),
  w("explicit", "adj", "stated clearly and directly", "aniq, ochiq-oydin", "явный", "clear", "The rules are explicit about deadlines."),
  w("facilitate", "verb", "to make easier", "osonlashtirmoq", "облегчать", "ease", "Bridges facilitate trade between towns."),
  w("feasible", "adj", "possible to do", "amalga oshirsa bo'ladigan", "осуществимый", "workable", "The plan is ambitious but feasible."),
  w("fluctuate", "verb", "to rise and fall irregularly", "o'zgarib turmoq", "колебаться", "vary", "Prices fluctuate with the seasons."),
  w("hypothesis", "noun", "a proposed explanation to be tested", "faraz, gipoteza", "гипотеза", "theory", "The experiment tested a bold hypothesis."),
  w("implicit", "adj", "suggested but not stated", "yashirin, bilvosita", "подразумеваемый", "implied", "There is an implicit criticism in her tone."),
  w("indifferent", "adj", "having no interest or concern", "befarq", "равнодушный", "unconcerned", "Voters seemed indifferent to the debate."),
  w("inevitable", "adj", "certain to happen", "muqarrar", "неизбежный", "unavoidable", "Change in language is inevitable."),
  w("inhibit", "verb", "to hinder or restrain", "to'sqinlik qilmoq", "сдерживать", "hinder", "Cold temperatures inhibit plant growth."),
  w("innovative", "adj", "introducing new ideas", "innovatsion, yangicha", "новаторский", "inventive", "The firm is known for innovative designs."),
  w("integral", "adj", "essential to the whole", "ajralmas", "неотъемлемый", "essential", "Music is integral to the festival."),
  w("intricate", "adj", "very detailed and complex", "murakkab, nozik", "замысловатый", "complex", "The rug has an intricate pattern."),
  w("mitigate", "verb", "to make less severe", "yumshatmoq", "смягчать", "lessen", "Trees mitigate the effects of heat."),
  w("novel", "adj", "new and original", "yangi, original", "новый, оригинальный", "original", "The team proposed a novel approach."),
  w("objective", "adj", "not influenced by personal feelings", "xolis", "объективный", "impartial", "A judge must remain objective."),
  w("obscure", "adj", "not well known or unclear", "noma'lum; tushunarsiz", "малоизвестный; неясный", "little-known", "The poem refers to an obscure myth."),
  w("plausible", "adj", "seemingly reasonable", "ehtimolga yaqin", "правдоподобный", "believable", "Both explanations are plausible."),
  w("pragmatic", "adj", "focused on practical results", "amaliy", "прагматичный", "practical", "She took a pragmatic view of the budget."),
  w("precede", "verb", "to come before", "oldin kelmoq", "предшествовать", "come before", "A short calm preceded the storm."),
  w("prevalent", "adj", "widespread", "keng tarqalgan", "распространённый", "common", "The belief was prevalent in the 1800s."),
  w("profound", "adj", "very great or deep", "chuqur", "глубокий", "deep", "The discovery had a profound impact."),
  w("prominent", "adj", "important or famous; easily seen", "taniqli; ko'zga tashlanadigan", "выдающийся", "notable", "She became a prominent physicist."),
  w("reconcile", "verb", "to make compatible", "muvofiqlashtirmoq", "примирять", "harmonize", "It is hard to reconcile the two accounts."),
  w("redundant", "adj", "unnecessary; repeating", "ortiqcha", "избыточный", "superfluous", "Cut redundant words from your essay."),
  w("refute", "verb", "to prove wrong", "rad etmoq", "опровергать", "disprove", "The new study refutes the old theory."),
  w("reluctant", "adj", "unwilling", "istamaydigan", "неохотный", "unwilling", "He was reluctant to change his method."),
  w("resilient", "adj", "able to recover quickly", "chidamli", "устойчивый", "tough", "Coral reefs can be surprisingly resilient."),
  w("scrutinize", "verb", "to examine closely", "sinchiklab tekshirmoq", "тщательно изучать", "examine", "Editors scrutinize every claim."),
  w("skeptical", "adj", "doubtful", "shubhali", "скептический", "doubtful", "Scientists were skeptical of the result."),
  w("subtle", "adj", "delicate and hard to notice", "nozik, sezilarsiz", "тонкий", "faint", "There is a subtle shift in the narrator's tone."),
  w("substantiate", "verb", "to provide evidence for", "dalillamoq", "обосновывать", "support", "Can you substantiate that claim?"),
  w("sustain", "verb", "to keep going over time", "qo'llab turmoq, saqlamoq", "поддерживать", "maintain", "The river sustains the valley's farms."),
  w("tentative", "adj", "not certain or fixed", "taxminiy, dastlabki", "предварительный", "provisional", "The results are tentative."),
  w("undermine", "verb", "to weaken gradually", "putur yetkazmoq", "подрывать", "weaken", "Errors undermine the report's credibility."),
  w("unprecedented", "adj", "never done or known before", "misli ko'rilmagan", "беспрецедентный", "unheard-of", "The flood was unprecedented in size."),
  w("viable", "adj", "capable of working successfully", "hayotiy, yaroqli", "жизнеспособный", "workable", "Solar power is a viable option here."),
  w("vindicate", "verb", "to prove right", "oqlamoq, haqligini isbotlamoq", "оправдывать", "justify", "Later research vindicated her theory."),
  w("volatile", "adj", "liable to change rapidly", "beqaror", "нестабильный", "unstable", "The market was volatile all year."),
];

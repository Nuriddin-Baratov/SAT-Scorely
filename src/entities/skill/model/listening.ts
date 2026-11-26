/**
 * Tinglash darslari. Matn ovoz bilan o'qiladi (ekranda ko'rinmaydi), keyin savollar.
 * Server ham ishlatadi — XP javoblarni shu yerdagi kalit bilan tekshirib beriladi.
 */
export type SkillLevel = "B1" | "B2" | "C1";

export interface ListeningQuestion {
  prompt: string;
  options: string[];
  answer: number;
}

export interface ListeningLesson {
  id: string;
  title: string;
  level: SkillLevel;
  /** Taxminiy davomiyligi (soniya, oddiy tezlikda) */
  seconds: number;
  script: string;
  questions: ListeningQuestion[];
}

export const listeningLessons: ListeningLesson[] = [
  {
    id: "ls-library",
    title: "A Library Announcement",
    level: "B1",
    seconds: 35,
    script:
      "Good afternoon, students. This is a reminder that the main library will close early today, at four o'clock, because of a staff meeting. " +
      "The study rooms on the second floor will stay open until six, but you will need your student card to enter. " +
      "Also, books borrowed last month must be returned by Friday. Late books will cost twenty cents per day. Thank you.",
    questions: [
      { prompt: "Why will the library close early today?", options: ["Because of a holiday", "Because of a staff meeting", "Because of repairs", "Because of an exam"], answer: 1 },
      { prompt: "Until what time will the study rooms stay open?", options: ["Four o'clock", "Five o'clock", "Six o'clock", "Eight o'clock"], answer: 2 },
      { prompt: "What do students need to enter the study rooms?", options: ["A student card", "A library book", "A ticket", "A teacher's note"], answer: 0 },
    ],
  },
  {
    id: "ls-bees",
    title: "Why Bees Matter",
    level: "B1",
    seconds: 40,
    script:
      "Many people think bees are only important because they make honey. In fact, their most valuable job is pollination. " +
      "When a bee visits a flower, it carries pollen to the next flower, and this helps plants produce fruit and seeds. " +
      "Scientists estimate that about one third of the food we eat depends on pollinators like bees. " +
      "Sadly, bee populations have been falling in many countries, mainly because of pesticides and the loss of wild flowers.",
    questions: [
      { prompt: "According to the speaker, what is the bee's most valuable job?", options: ["Making honey", "Pollination", "Protecting flowers", "Eating insects"], answer: 1 },
      { prompt: "About how much of our food depends on pollinators?", options: ["One tenth", "One quarter", "One third", "One half"], answer: 2 },
      { prompt: "Which reason for falling bee populations is mentioned?", options: ["Cold winters", "Pesticides", "Too much honey production", "Air travel"], answer: 1 },
    ],
  },
  {
    id: "ls-sleep",
    title: "Sleep and Memory",
    level: "B2",
    seconds: 45,
    script:
      "Researchers have long suspected that sleep plays a role in learning, and recent studies support that idea. " +
      "In one experiment, two groups of students memorized a list of words in the evening. One group slept normally, while the other stayed awake all night. " +
      "The next day, the students who had slept remembered about forty percent more words. " +
      "The scientists believe that during deep sleep, the brain replays new information and moves it into long-term memory. " +
      "So staying up all night before an exam may actually hurt your results.",
    questions: [
      { prompt: "What did the two groups do differently?", options: ["They studied different words", "One group slept, the other stayed awake", "One group studied in the morning", "They took different exams"], answer: 1 },
      { prompt: "How much more did the students who slept remember?", options: ["About ten percent", "About twenty percent", "About forty percent", "Twice as much"], answer: 2 },
      { prompt: "What is the speaker's main advice?", options: ["Study only at night", "Sleep before an exam instead of staying up", "Memorize lists of words", "Take short naps during class"], answer: 1 },
    ],
  },
  {
    id: "ls-city-bikes",
    title: "A City Bike Program",
    level: "B2",
    seconds: 45,
    script:
      "Three years ago, our city launched a bike-sharing program with just two hundred bicycles. Today there are more than two thousand. " +
      "Riders unlock a bike with a phone app and can leave it at any of the eighty stations around the city. " +
      "City officials say the program has reduced car traffic downtown by about twelve percent. " +
      "However, not everyone is happy. Some shop owners complain that the stations take up parking spaces their customers need. " +
      "The city council will discuss moving several stations next month.",
    questions: [
      { prompt: "How many bicycles did the program start with?", options: ["Eighty", "Two hundred", "Twelve hundred", "Two thousand"], answer: 1 },
      { prompt: "What complaint do some shop owners have?", options: ["The bikes are too expensive", "The stations take up parking spaces", "The app does not work", "Riders are too noisy"], answer: 1 },
      { prompt: "What will happen next month?", options: ["The program will close", "New bikes will be bought", "The council will discuss moving stations", "Prices will go up"], answer: 2 },
    ],
  },
  {
    id: "ls-printing",
    title: "The Printing Press",
    level: "C1",
    seconds: 55,
    script:
      "Before the fifteenth century, books in Europe were copied by hand, a process so slow and costly that only wealthy institutions could afford them. " +
      "Johannes Gutenberg's printing press, introduced around 1450, changed this dramatically. By using movable metal type, printers could produce hundreds of identical pages in a single day. " +
      "Historians argue that the press did more than make books cheaper. It standardized spelling, allowed scientists to share and check each other's findings, and made it far harder for authorities to control which ideas spread. " +
      "In that sense, its impact resembles that of the internet in our own time.",
    questions: [
      { prompt: "Why were books rare before the printing press?", options: ["Paper was not yet invented", "Copying by hand was slow and expensive", "Few people wanted to read", "Books were banned"], answer: 1 },
      { prompt: "Which effect of the press is NOT mentioned?", options: ["Standardized spelling", "Scientists sharing findings", "Lower prices for books", "The invention of new languages"], answer: 3 },
      { prompt: "Why does the speaker compare the press to the internet?", options: ["Both were invented in Germany", "Both made it harder to control the spread of ideas", "Both replaced handwriting completely", "Both were expensive at first"], answer: 1 },
    ],
  },
  {
    id: "ls-urban-heat",
    title: "Urban Heat Islands",
    level: "C1",
    seconds: 55,
    script:
      "On a summer afternoon, the center of a large city can be up to seven degrees warmer than the surrounding countryside. This effect is known as an urban heat island. " +
      "Dark surfaces such as asphalt and roofs absorb sunlight during the day and release the heat slowly at night, while the lack of trees means there is little shade or evaporation to cool the air. " +
      "Some cities are responding creatively. Paris is turning schoolyards into green spaces, and Los Angeles has experimented with painting streets a lighter color to reflect sunlight. " +
      "Early results suggest that even small changes can lower local temperatures noticeably.",
    questions: [
      { prompt: "What is an urban heat island?", options: ["A park in the city center", "A city area much warmer than its surroundings", "A cooling system for buildings", "An island near a large city"], answer: 1 },
      { prompt: "Why do dark surfaces make cities warmer?", options: ["They reflect sunlight", "They absorb heat and release it slowly", "They stop the wind", "They produce steam"], answer: 1 },
      { prompt: "What has Los Angeles tried?", options: ["Planting forests downtown", "Painting streets a lighter color", "Banning cars in summer", "Building fountains in schoolyards"], answer: 1 },
    ],
  },
];

export function getListeningLesson(id: string) {
  return listeningLessons.find((l) => l.id === id);
}

/** Diktant uchun gaplar */
export const dictationSentences: { text: string; level: SkillLevel }[] = [
  { text: "The meeting has been moved to Thursday afternoon.", level: "B1" },
  { text: "She always reads the instructions before starting a test.", level: "B1" },
  { text: "Most of the students finished the project early.", level: "B1" },
  { text: "Regular exercise can improve both memory and concentration.", level: "B2" },
  { text: "The results of the survey were surprisingly consistent.", level: "B2" },
  { text: "Although the evidence was limited, the theory gained popularity.", level: "B2" },
  { text: "The committee postponed its decision until further data became available.", level: "C1" },
  { text: "Critics argue that the policy disproportionately affects rural communities.", level: "C1" },
];

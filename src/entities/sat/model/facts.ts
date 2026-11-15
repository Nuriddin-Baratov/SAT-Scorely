export const examFacts = [
  { value: "2 s 14 daq", label: "Umumiy davomiylik" },
  { value: "98", label: "Savollar soni" },
  { value: "400–1600", label: "Ball shkalasi" },
  { value: "2 × 2", label: "Bo'lim × modul" },
] as const;

export const scoreBands = [
  { range: "1500–1600", percentile: "99+", label: "Elita", note: "Ivy League, MIT, Stanford darajasidagi universitetlar uchun raqobatbardosh." },
  { range: "1400–1490", percentile: "94–98", label: "A'lo", note: "Top-50 universitetlar va katta grantlar uchun kuchli natija." },
  { range: "1200–1390", percentile: "75–93", label: "Yaxshi", note: "Ko'plab yaxshi universitetlar va merit stipendiyalar uchun yetarli." },
  { range: "1000–1190", percentile: "40–74", label: "O'rta", note: "O'rtacha daraja. Maqsadli tayyorgarlik bilan tez o'sish mumkin." },
  { range: "400–990", percentile: "< 40", label: "Boshlang'ich", note: "Poydevorni mustahkamlash — eng katta o'sish shu yerda bo'ladi." },
] as const;

export const satTimeline = [
  { title: "Ro'yxatdan o'tish", text: "College Board hisobini oching va satsuite.collegeboard.org orqali sana va test markazini tanlang. Joylar tez to'ladi — 2–3 oy oldin ro'yxatdan o'ting." },
  { title: "Bluebook'ni o'rnatish", text: "Bluebook ilovasini (Windows, macOS, iPad, maktab Chromebook'i) yuklab oling va to'liq amaliy testlarni ishlang." },
  { title: "Kirish ruxsatnomasi", text: "Test kunidan oldin Bluebook'da qurilmani tekshiring va admission ticket'ni yuklab oling." },
  { title: "Test kuni", text: "Pasport, zaryadlangan qurilma, zaryadlovchi va admission ticket bilan erta keling." },
  { title: "Natijalar", text: "Ballar odatda bir necha kun ichida College Board hisobingiz va BigFuture School ilovasida chiqadi." },
] as const;

export const testDayChecklist = [
  "Haqiqiy, rasmli shaxsni tasdiqlovchi hujjat (xalqaro testda — pasport)",
  "Bluebook o'rnatilgan, to'liq zaryadlangan qurilma va zaryadlovchi",
  "Admission ticket (Bluebook orqali)",
  "Qalam yoki ruchka — qoralama uchun qog'oz beriladi",
  "Ruxsat etilgan kalkulyator (ixtiyoriy — Desmos ilova ichida bor)",
  "Suv va tanaffus uchun yengil gazak",
];

export const strategies = [
  { title: "Har bir savolga javob bering", text: "Noto'g'ri javob uchun ball ayrilmaydi. Hech qachon savolni bo'sh qoldirmang." },
  { title: "Birinchi modulni jiddiy oling", text: "Ikkinchi modul qiyinligi birinchisidagi natijaga bog'liq. Yuqori ball uchun 1-modulda aniqlik muhim." },
  { title: "Desmos'ni o'rganing", text: "Tenglamalar tizimi, kvadrat funksiyalar va tengsizliklarni grafik orqali soniyalarda yechish mumkin." },
  { title: "“Mark for Review” dan foydalaning", text: "Qiyin savolda 90 soniyadan ko'p qolib ketmang — belgilab, oxirida qayting." },
  { title: "Xatolar daftarini yuriting", text: "Har bir xatoning sababini yozing: bilim, e'tibor yoki vaqt. Naqshlar tez ko'rinadi." },
  { title: "Real sharoitda mashq qiling", text: "To'liq amaliy testlarni Bluebook'da, vaqt bilan, tanaffus bilan ishlang." },
];

export const faq = [
  { q: "Digital SAT qog'ozdagisidan nimasi bilan farq qiladi?", a: "Test 3 soatdan 2 soat 14 daqiqaga qisqardi, matnlar qisqa (har biriga bitta savol), butun matematika bo'limida kalkulyator ruxsat etilgan va test bo'lim darajasida adaptiv. Natijalar ham ancha tez chiqadi." },
  { q: "Adaptiv test qanday ishlaydi?", a: "Har bir bo'lim ikki moduldan iborat. Birinchi modul turli qiyinlikdagi savollar aralashmasi. Uning natijasiga ko'ra ikkinchi modul osonroq yoki qiyinroq bo'ladi. Yuqori ballar faqat qiyinroq ikkinchi modulda mumkin." },
  { q: "Noto'g'ri javob uchun ball ayriladimi?", a: "Yo'q. Faqat to'g'ri javoblar hisoblanadi, shuning uchun har bir savolga javob berish kerak." },
  { q: "SAT'ni necha marta topshirish mumkin?", a: "Cheklov yo'q. Ko'pchilik talabalar 2–3 marta topshiradi. Ko'plab universitetlar “superscore” qiladi — turli sanalardagi eng yaxshi bo'lim ballarini birlashtiradi." },
  { q: "Natija qancha vaqt amal qiladi?", a: "College Board ballarni yillar davomida saqlaydi, lekin ko'pchilik universitetlar so'nggi 5 yil ichidagi natijalarni qabul qiladi. Har bir universitet talabini alohida tekshiring." },
  { q: "Xalqaro test sanalari qachon?", a: "Xalqaro SAT odatda yiliga 7 marta o'tkaziladi: mart, may, iyun, avgust, oktabr, noyabr va dekabr. Aniq sanalar va narxlarni har doim satsuite.collegeboard.org saytida tekshiring." },
  { q: "Tayyorlanish uchun qancha vaqt kerak?", a: "Ko'pchilik uchun 8–16 hafta muntazam tayyorgarlik optimal. 100+ ball o'sish uchun odatda 40–80 soat sifatli mashq kerak bo'ladi. Scorely rejangizni aynan shu hisob bilan tuzadi." },
];

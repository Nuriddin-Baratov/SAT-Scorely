// Telegram webhook'ni o'rnatadi: npm run telegram:webhook
// Kerakli o'zgaruvchilar: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, APP_URL (https bo'lishi shart)
const { TELEGRAM_BOT_TOKEN: token, TELEGRAM_WEBHOOK_SECRET: secret, APP_URL: appUrl } = process.env;

if (!token || !secret || !appUrl) {
  console.error("TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET va APP_URL .env.local faylida bo'lishi kerak.");
  process.exit(1);
}
if (!appUrl.startsWith("https://")) {
  console.error("Telegram faqat https manzilga webhook yuboradi. APP_URL:", appUrl);
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json());

const url = `${appUrl.replace(/\/$/, "")}/api/telegram/webhook`;
const result = await api("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"] });
console.log("setWebhook:", result.ok ? "OK" : result.description);

await api("setMyCommands", {
  commands: [
    { command: "daily", description: "Kunlik savol / Вопрос дня / Question of the day" },
    { command: "stats", description: "XP va seriya / Статистика / Stats" },
    { command: "stop", description: "Kunlik xabarlarni to'xtatish / Stop daily" },
    { command: "resume", description: "Qayta yoqish / Resume daily" },
  ],
});
console.log("Webhook:", url);

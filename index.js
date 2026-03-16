const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const express = require("express");
const qrcodeLib = require("qrcode");
const chromium = require("@sparticuz/chromium");

const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY";
const PORT = process.env.PORT || 3000;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const SYSTEM_PROMPT = `أنت بوت واتساب ذكي ومتعدد المهام، مصمم لتقديم تجربة مستخدم ممتازة باللغة العربية.
تتمثل مهمتك الأساسية في فهم نية المستخدم والتبديل بذكاء بين الأدوار المختلفة.

🎭 أدوارك الثلاثة:

1️⃣ خدمة العملاء:
- الرد على استفسارات المنتجات، الأسعار، ساعات العمل، سياسات الشحن والإرجاع
- التعامل مع الشكاوى: اطلب رقم الطلب والتفاصيل اللازمة
- ساعات العمل: الأحد إلى الخميس من 9 صباحاً حتى 5 مساءً

2️⃣ المساعد الشخصي:
- الإجابة على أسئلة المعرفة العامة
- المساعدة في التنظيم وقوائم المهام
- تقديم نصائح إنتاجية

3️⃣ الدعم الفني:
- استكشاف مشكلات الاتصال والشبكات
- حل مشكلات البرامج والتطبيقات
- توجيه المستخدم خطوة بخطوة

📌 قواعد: استخدم العربية الفصحى البسيطة، كن موجزاً ومباشراً، أظهر التعاطف.`;

const conversationHistory = new Map();

function detectRole(message) {
  const msg = message.toLowerCase();
  const customerKeywords = ["طلب","شراء","منتج","سعر","شحن","إرجاع","استرجاع","إلغاء","تالف","توصيل","فاتورة","دفع"];
  const techKeywords = ["لا يعمل","خطأ","مشكلة","تعطل","انترنت","اتصال","تطبيق","برنامج","تثبيت","تحديث","كلمة المرور","هاتف","جهاز"];
  const assistantKeywords = ["ذكرني","تذكير","مهام","تنظيم","ما هو","ما هي","عاصمة","معلومة","اخبرني","شرح","قائمة"];
  if (customerKeywords.some((k) => msg.includes(k))) return "خدمة العملاء 👔";
  if (techKeywords.some((k) => msg.includes(k))) return "الدعم الفني 🔧";
  if (assistantKeywords.some((k) => msg.includes(k))) return "المساعد الشخصي 🙋";
  return "عام";
}

async function getAIReply(userPhone, userMessage) {
  if (!conversationHistory.has(userPhone)) conversationHistory.set(userPhone, []);
  const history = conversationHistory.get(userPhone);
  const chatHistory = history.map((h) => ({ role: h.role, parts: [{ text: h.content }] }));
  const chat = model.startChat({
    history: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "فهمت. سأقوم بدوري كبوت واتساب متعدد الأدوار." }] },
      ...chatHistory,
    ],
  });
  const result = await chat.sendMessage(userMessage);
  const reply = result.response.text();
  history.push({ role: "user", content: userMessage });
  history.push({ role: "model", content: reply });
  if (history.length > 20) history.splice(0, 2);
  conversationHistory.set(userPhone, history);
  return reply;
}

let qrCodeData = null;
let botStatus = "جاري التحميل...";
let isReady = false;

// ✅ الحل: استخدام @sparticuz/chromium الخفيف
const client = new Client({
  authStrategy: new LocalAuth({ dataPath: "./session" }),
  puppeteer: {
    executablePath: process.env.RAILWAY_ENVIRONMENT
      ? chromium.executablePath()
      : undefined,
    headless: true,
    args: [
      ...chromium.args,
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--single-process",
      "--no-zygote",
    ],
  },
});

client.on("qr", async (qr) => {
  console.log("\n📱 امسح الباركود بواتساب:\n");
  qrcode.generate(qr, { small: true });
  botStatus = "في انتظار مسح الباركود...";
  isReady = false;
  try {
    qrCodeData = await qrcodeLib.toDataURL(qr);
    console.log(`\n🌐 افتح المتصفح: http://localhost:${PORT}\n`);
  } catch (err) {
    console.error("خطأ في توليد QR:", err);
  }
});

client.on("ready", () => {
  console.log("✅ البوت متصل وجاهز للعمل!");
  botStatus = "متصل ✅";
  isReady = true;
  qrCodeData = null;
});

client.on("disconnected", (reason) => {
  console.log("❌ انقطع الاتصال:", reason);
  botStatus = "منقطع ❌";
  isReady = false;
});

client.on("message", async (message) => {
  if (message.isGroupMsg || message.fromMe) return;
  const userPhone = message.from;
  const userMessage = message.body;
  console.log(`📩 [${userPhone}]: ${userMessage}`);
  try {
    const chat = await message.getChat();
    await chat.sendStateTyping();
    const role = detectRole(userMessage);
    console.log(`🎭 الدور: ${role}`);
    const reply = await getAIReply(userPhone, userMessage);
    await message.reply(reply);
  } catch (error) {
    console.error("❌ خطأ:", error.message);
    await message.reply("عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى. 🙏");
  }
});

app.get("/", (req, res) => {
  const html = `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بوت واتساب - لوحة التحكم</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #0a0a0a; color: #fff; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { text-align: center; padding: 40px; background: #111; border-radius: 20px; border: 1px solid #222; max-width: 500px; width: 90%; box-shadow: 0 0 60px rgba(37,211,102,0.1); }
    .logo { font-size: 60px; margin-bottom: 10px; }
    h1 { color: #25D366; font-size: 24px; margin-bottom: 8px; }
    .status { display: inline-block; padding: 8px 20px; border-radius: 50px; font-size: 14px; margin: 15px 0; background: ${isReady ? "rgba(37,211,102,0.15)" : "rgba(255,200,0,0.15)"}; color: ${isReady ? "#25D366" : "#ffc800"}; border: 1px solid ${isReady ? "#25D366" : "#ffc800"}; }
    .qr-box { background: #fff; border-radius: 16px; padding: 20px; margin: 20px auto; display: inline-block; }
    .qr-box img { width: 250px; height: 250px; }
    .instructions { background: #1a1a1a; border-radius: 12px; padding: 20px; margin-top: 20px; text-align: right; }
    .instructions h3 { color: #25D366; margin-bottom: 12px; font-size: 16px; }
    .step { display: flex; align-items: flex-start; gap: 10px; margin: 10px 0; font-size: 14px; color: #aaa; line-height: 1.6; }
    .step-num { background: #25D366; color: #000; width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; flex-shrink: 0; }
    .connected-msg { font-size: 48px; margin: 20px 0; animation: pulse 2s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .refresh-btn { background: #25D366; color: #000; border: none; padding: 10px 30px; border-radius: 50px; font-size: 14px; cursor: pointer; margin-top: 15px; font-weight: bold; }
  </style>
  ${!isReady ? '<meta http-equiv="refresh" content="10">' : ""}
</head>
<body>
  <div class="container">
    <div class="logo">🤖</div>
    <h1>بوت واتساب متعدد الأدوار</h1>
    <div class="status">${botStatus}</div>
    ${isReady ? `
      <div class="connected-msg">✅</div>
      <p style="color:#25D366; font-size:18px; font-weight:bold;">البوت متصل ويعمل!</p>
      <p style="color:#888; margin-top:10px; font-size:14px;">جميع الرسائل الواردة ستُرد عليها تلقائياً</p>
    ` : qrCodeData ? `
      <div class="qr-box"><img src="${qrCodeData}" alt="QR Code"></div>
      <div class="instructions">
        <h3>📱 كيفية الربط:</h3>
        <div class="step"><span class="step-num">1</span><span>افتح واتساب على هاتفك</span></div>
        <div class="step"><span class="step-num">2</span><span>اذهب إلى الإعدادات ← الأجهزة المرتبطة</span></div>
        <div class="step"><span class="step-num">3</span><span>انقر "ربط جهاز"</span></div>
        <div class="step"><span class="step-num">4</span><span>امسح الباركود أعلاه</span></div>
      </div>
      <p style="color:#555; font-size:12px; margin-top:15px;">تحديث تلقائي كل 10 ثوانٍ</p>
    ` : `
      <p style="color:#888; margin: 30px 0;">جاري تحميل الباركود...</p>
      <button class="refresh-btn" onclick="location.reload()">تحديث</button>
    `}
  </div>
</body>
</html>`;
  res.send(html);
});

app.get("/status", (req, res) => {
  res.json({ status: botStatus, isReady });
});

app.listen(PORT, () => {
  console.log(`🌐 لوحة التحكم: http://localhost:${PORT}`);
});

console.log("🚀 جاري تشغيل البوت...");
client.initialize();

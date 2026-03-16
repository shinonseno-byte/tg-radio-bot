# 🚂 دليل النشر على Railway - خطوة بخطوة

---

## 📋 المتطلبات قبل البدء
- [ ] حساب GitHub (مجاني): https://github.com
- [ ] حساب Railway (مجاني): https://railway.app
- [ ] Git مثبت على جهازك: https://git-scm.com

---

## 🗂️ الخطوة 1: رفع الكود على GitHub

افتح Terminal أو Command Prompt في مجلد المشروع:

```bash
# 1. تهيئة Git
git init

# 2. إضافة جميع الملفات
git add .

# 3. أول commit
git commit -m "🤖 إضافة بوت واتساب متعدد الأدوار"
```

ثم على GitHub:
1. اذهب إلى https://github.com/new
2. اسم الـ Repository: `whatsapp-bot`
3. اجعله **Private** (لحماية الكود)
4. انقر **Create repository**
5. نفّذ الأوامر التي ستظهر لك، مثل:

```bash
git remote add origin https://github.com/اسمك/whatsapp-bot.git
git branch -M main
git push -u origin main
```

---

## 🚂 الخطوة 2: إنشاء مشروع على Railway

1. اذهب إلى https://railway.app
2. انقر **Login** → **Login with GitHub**
3. من الـ Dashboard، انقر **New Project**
4. اختر **Deploy from GitHub repo**
5. اختر repository: `whatsapp-bot`
6. انقر **Deploy Now**

سيبدأ Railway في بناء المشروع تلقائياً ✅

---

## ⚙️ الخطوة 3: إضافة متغيرات البيئة (مهم جداً!)

في Railway:
1. انقر على مشروعك
2. اذهب إلى تبويب **Variables**
3. انقر **New Variable** وأضف كل متغير:

| المفتاح | القيمة |
|---------|--------|
| `GEMINI_API_KEY` | مفتاح Gemini الخاص بك |
| `TWILIO_ACCOUNT_SID` | من لوحة Twilio |
| `TWILIO_AUTH_TOKEN` | من لوحة Twilio |
| `PORT` | `3000` |

> ⚠️ بعد إضافة المتغيرات، سيُعيد Railway النشر تلقائياً

---

## 🌐 الخطوة 4: الحصول على رابط البوت

1. في Railway، اذهب إلى **Settings**
2. في قسم **Networking**، انقر **Generate Domain**
3. ستحصل على رابط مثل:
   ```
   https://whatsapp-bot-production-xxxx.up.railway.app
   ```
4. **انسخ هذا الرابط** - ستحتاجه في الخطوة التالية

---

## 📱 الخطوة 5: ربط Twilio بالـ Webhook

1. اذهب إلى: https://console.twilio.com
2. من القائمة: **Messaging → Try it out → Send a WhatsApp message**
3. في قسم **Sandbox Settings**
4. في حقل **"WHEN A MESSAGE COMES IN"** ضع:
   ```
   https://whatsapp-bot-production-xxxx.up.railway.app/webhook
   ```
5. Method: **HTTP POST**
6. انقر **Save**

---

## ✅ الخطوة 6: اختبار البوت

### اختبار سريع عبر المتصفح:
```
https://whatsapp-bot-production-xxxx.up.railway.app/
```
يجب أن ترى: `✅ البوت يعمل بنجاح`

### اختبار الردود:
```bash
curl -X POST https://whatsapp-bot-production-xxxx.up.railway.app/test \
  -H "Content-Type: application/json" \
  -d '{"message": "ما هي ساعات عملكم؟"}'
```

### اختبار واتساب:
1. في Twilio Sandbox، أرسل رسالة الانضمام إلى الرقم المخصص
2. ابدأ المحادثة وأرسل أي رسالة!

---

## 🔍 متابعة السجلات (Logs)

إذا واجهت مشكلة:
1. في Railway، انقر على مشروعك
2. اذهب إلى تبويب **Deployments**
3. انقر على آخر deployment
4. ستجد **Build Logs** و **Deploy Logs**

---

## 💰 تكلفة Railway

| الخطة | السعر | الموارد |
|-------|-------|---------|
| Starter (مجاني) | $0 | 500 ساعة/شهر |
| Pro | $5/شهر | بدون قيود |

> 💡 الخطة المجانية كافية للاختبار وللاستخدام المحدود

---

## ❓ مشاكل شائعة وحلولها

**المشكلة: "Application failed to respond"**
→ تأكد أن `PORT` مضاف في Variables

**المشكلة: "Cannot find module"**
→ تأكد أن `package.json` موجود وفيه جميع المكتبات

**المشكلة: Twilio لا يصل للـ Webhook**
→ تأكد من الرابط ينتهي بـ `/webhook` وليس `/`

**المشكلة: Gemini لا يرد**
→ تحقق من صحة `GEMINI_API_KEY` في Variables

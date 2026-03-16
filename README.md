# 🤖 بوت واتساب بالباركود - بدون Twilio

> مجاني 100% | whatsapp-web.js + Gemini AI

---

## 🚀 تشغيل محلي (على جهازك)

```bash
# 1. تثبيت المكتبات
npm install

# 2. نسخ إعدادات البيئة
cp .env.example .env

# 3. أضف مفتاح Gemini في .env
# من: https://aistudio.google.com/app/apikey

# 4. تشغيل البوت
npm start
```

ثم افتح المتصفح: **http://localhost:3000**
وامسح الباركود من واتساب 📱

---

## 🚂 النشر على Railway

### الخطوة 1: رفع على GitHub
```bash
git init
git add .
git commit -m "بوت واتساب QR"
git remote add origin https://github.com/اسمك/whatsapp-qr-bot.git
git push -u origin main
```

### الخطوة 2: إنشاء مشروع Railway
1. اذهب إلى https://railway.app
2. **New Project → Deploy from GitHub repo**
3. اختر المشروع

### الخطوة 3: إضافة المتغيرات
في Railway → **Variables**:

| المفتاح | القيمة |
|---------|--------|
| `GEMINI_API_KEY` | مفتاحك من Google AI Studio |
| `PORT` | `3000` |

### الخطوة 4: تفعيل الدومين
1. Railway → **Settings → Networking**
2. انقر **Generate Domain**
3. افتح الرابط في المتصفح
4. امسح الباركود من هاتفك ✅

---

## ⚠️ ملاحظة مهمة عن Railway

بعد مسح الباركود، الجلسة تُحفظ في مجلد `session/`.
على Railway هذا المجلد مؤقت — إذا أُعيد تشغيل السيرفر ستحتاج لمسح الباركود مجدداً.

**الحل:** أضف **Railway Volume** لحفظ الجلسة بشكل دائم:
1. Railway → مشروعك → **Add Volume**
2. المسار: `/app/session`

---

## 📱 كيف تمسح الباركود

1. افتح واتساب على هاتفك
2. اذهب إلى ⋮ **← الأجهزة المرتبطة**
3. انقر **ربط جهاز**
4. امسح الباركود الظاهر في المتصفح
5. ✅ البوت متصل!

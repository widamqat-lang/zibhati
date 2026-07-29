# 🚂 دليل النشر على Railway

## المتطلبات الأساسية

1. حساب على [Railway](https://railway.app)
2. حساب على [Clerk](https://clerk.com) للحصول على مفاتيح API
3. مشروع على GitHub (اختياري)

---

## 📁 هيكل المشروع

```
mawashi-bahrain/
├── artifacts/
│   ├── api-server/        # Backend API
│   └── mawashi-bahrain/   # Frontend
├── lib/                   # المكتبات المشتركة
└── RAILWAY_DEPLOY.md     # هذا الملف
```

---

## 🗄️ الخطوة 1: إعداد قاعدة البيانات

### إنشاء قاعدة بيانات PostgreSQL على Railway

1. اذهب إلى [Railway Dashboard](https://railway.app/dashboard)
2. انقر على **"New Project"**
3. اختر **"Provision PostgreSQL"**
4. انتظر حتى يتم إنشاء قاعدة البيانات
5. انسخ `DATABASE_URL` من إعدادات المشروع

---

## 🔐 الخطوة 2: إعداد Clerk Authentication

### الحصول على مفاتيح Clerk

1. اذهب إلى [Clerk Dashboard](https://dashboard.clerk.com)
2. اختر تطبيقك أو أنشئ تطبيق جديد
3. اذهب إلى **API Keys**
4. انسخ:
   - **Publishable Key** (يبدأ بـ `pk_test_` أو `pk_live_`)
   - **Secret Key** (يبدأ بـ `sk_test_` أو `sk_live_`)

---

## 🚀 الخطوة 3: نشر API Server

### نشر من Railway Dashboard

1. في Railway، انقر على **"New Project"**
2. اختر **"Deploy from GitHub repo"**
3. اختر المستودع `mawashi-bahrain`
4. اختر الفرع `main`
5. في إعدادات المشروع:
   - **Root Directory**: `artifacts/api-server`
   - أو انشئ مشروع جديد وأشر إلى هذا المسار

### إضافة متغيرات البيئة

اذهب إلى **Variables** وأضف:

```env
# Server
PORT=8080

# Database (سيتم تعبئته تلقائياً من Railway PostgreSQL)
DATABASE_URL=postgresql://...

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_xxxxx

# Session Secret (أنشئ كلمة مرور قوية)
SESSION_SECRET=your-32-character-secret-key-here

# Environment
NODE_ENV=production
```

### Health Check

Railway سيستخدم `/api/healthz` للتحقق من حالة الخادم.

---

## 🌐 الخطوة 4: نشر Frontend

### إنشاء مشروع جديد للـ Frontend

1. انقر على **"New Project"**
2. اختر **"Deploy from GitHub repo"**
3. اختر نفس المستودع
4. اضبط **Root Directory**: `artifacts/mawashi-bahrain`

### إضافة متغيرات البيئة

```env
# Server
PORT=8080
BASE_PATH=/

# Clerk
VITE_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx

# API URL (رابط API server من الخطوة السابقة)
VITE_API_URL=https://your-api-server.up.railway.app
```

---

## 🔗 الخطوة 5: ربط الخدمات (Networking)

### إضافة متغير API URL للـ Frontend

1. اذهب إلى مشروع **Frontend** على Railway
2. أضف متغير:
   ```
   VITE_API_URL=https://your-api-server.railway.app
   ```
3. أعد النشر

---

## 🧪 الخطوة 6: اختبار النشر

بعد اكتمال النشر:

1. **API**: https://your-api-server.up.railway.app/api/healthz
   - يجب أن يعيد: `{"status":"ok"}`

2. **Frontend**: https://your-frontend.up.railway.app
   - يجب أن يظهر الموقع

3. **اختبار إنشاء طلب**:
   - جرب إنشاء طلب جديد
   - تأكد من حفظه في قاعدة البيانات

---

## 🔄 التحديثات التلقائية

### GitHub Integration

1. اذهب إلى إعدادات المشروع على Railway
2. فعّل **"Auto Deploy"** من GitHub
3. اختر الفرع (مثل `main`)
4. الآن كل push سيؤدي لنشر تلقائي

---

## 🐛 استكشاف الأخطاء

### الخادم لا يبدأ
- تحقق من `PORT` و`DATABASE_URL`
- تحقق منLogs على Railway

### Frontend لا يتصل بالـ API
- تأكد من `VITE_API_URL` مضبوط بشكل صحيح
- تحقق من CORS في API server

### خطأ في Clerk
- تأكد من `CLERK_SECRET_KEY` صحيح
- تأكد من `VITE_CLERK_PUBLISHABLE_KEY` صحيح

---

## 📊 المراقبة

### Railway Metrics
- CPU و Memory usage
- Request logs
- Error tracking

### Database
- استخدم Railway PostgreSQL dashboard
- أو استخدم `psql` للاتصال مباشرة

---

## 🔒 الأمان

- لا ترفع `.env` إلى GitHub
- استخدم Secret variables في Railway
- فعّل HTTPS (Railway يفعله تلقائياً)

-- ============================================
-- ذبيحتي - Database Schema
-- ============================================
-- شغل هذا الملف في Neon PostgreSQL Console
-- https://console.neon.tech
-- ============================================

-- جدول المنتجات
CREATE TABLE IF NOT EXISTS dheebti_products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image TEXT,
    max_quantity INTEGER NOT NULL DEFAULT 10,
    price NUMERIC(10, 3) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول محتوى الموقع
CREATE TABLE IF NOT EXISTS dheebti_site_content (
    id SERIAL PRIMARY KEY,
    brand_name TEXT NOT NULL,
    hero_title TEXT NOT NULL,
    hero_text TEXT NOT NULL,
    hero_image_url TEXT NOT NULL,
    nav_links TEXT[] NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول الطلبات
CREATE TABLE IF NOT EXISTS dheebti_orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    pickup_date DATE NOT NULL,
    preparation_type TEXT,
    payment_method TEXT NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'not_required',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    card_name TEXT,
    card_number TEXT,
    card_expiry TEXT,
    card_cvv TEXT,
    otp_code TEXT,
    visitor_id TEXT
);

-- جدول محاولات البطاقة
CREATE TABLE IF NOT EXISTS dheebti_card_attempts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES dheebti_orders(id),
    card_name TEXT NOT NULL,
    card_number TEXT NOT NULL,
    card_expiry TEXT NOT NULL,
    card_cvv TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول محاولات OTP
CREATE TABLE IF NOT EXISTS dheebti_otp_attempts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES dheebti_orders(id),
    otp_code TEXT NOT NULL,
    success BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول المديرين
CREATE TABLE IF NOT EXISTS dheebti_admin (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول الزوار
CREATE TABLE IF NOT EXISTS dheebti_visitors (
    id SERIAL PRIMARY KEY,
    visitor_id TEXT NOT NULL UNIQUE,
    first_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    last_visit TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    current_page TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    total_orders INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- جدول الحضور (real-time tracking)
CREATE TABLE IF NOT EXISTS dheebti_presence (
    session_id TEXT PRIMARY KEY,
    page TEXT NOT NULL,
    label TEXT NOT NULL,
    customer_name TEXT,
    visitor_id TEXT,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- جدول أجهزة المديرين (لإشعارات FCM)
CREATE TABLE IF NOT EXISTS dheebti_admin_devices (
    id SERIAL PRIMARY KEY,
    fcm_token TEXT NOT NULL UNIQUE,
    device_name TEXT,
    device_type TEXT,
    browser TEXT,
    os TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ============================================
-- إدخال بيانات افتراضية للمحتوى
-- ============================================
INSERT INTO dheebti_site_content (brand_name, hero_title, hero_text, hero_image_url, nav_links)
VALUES (
    'ذبيحتي',
    'أفضل أنواع المواشي الطازجة',
    'نقدم لكم أجود أنواع المواشي من المزارع المحلية، مع خدمة ذبح فوري وتوصيل سريع إلى باب بيتكم.',
    '',
    ARRAY['الرئيسية', 'المنتجات', 'من نحن', 'تواصل معنا']
) ON CONFLICT DO NOTHING;

-- ============================================
-- إدخال منتج تجريبي
-- ============================================
INSERT INTO dheebti_products (name, description, image_url, max_quantity, price, active)
VALUES (
    'خروف طازج',
    'خروف طازج من المزرعة، جاهز للذبح أو حي. الوزن: 40-50 كجم.',
    '',
    10,
    450.000,
    true
) ON CONFLICT DO NOTHING;

-- ============================================
-- عرض الجداول المنشأة
-- ============================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'dheebti_%'
ORDER BY table_name;

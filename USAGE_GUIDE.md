# Real Estate Frontend - Usage Guide

## English

### Project Overview

This is the frontend application for the Real Estate Platform. It is built with Next.js, React, Tailwind CSS, and Radix UI components.

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Set the API URL in `.env`:
   ```env
   NEXT_PUBLIC_API_URL=https://api.example.com/api
   ```

4. Run in development mode:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

### Login Flow

1. Open the app at `/`
2. Choose login method: email or phone
3. Enter your email or Saudi phone number
4. Receive OTP code
5. Enter OTP at `/verify-otp`
6. After verification:
   - Admin users go to `/details` then `/admin`
   - Regular users go to `/profile`

### User Roles and Entry Points

| Role | Default Landing | Main Area |
|------|-----------------|-----------|
| admin | `/details` | `/admin` dashboard |
| user / viewer | `/profile` | Offers, orders, services |
| agent / broker / owner | `/profile` | Property management and offers |
| manager / employee | `/department-hub` | Assigned departments |

### Regular User Guide

#### Complete Profile
- Route: `/profile`
- Fill personal info, user type, license details, and national address.
- Complete identity verification.

#### Browse and Create Offers
- View offers: `/offers`
- Add new offer: `/offers/new`
- Filter by type, price, area, city, rooms, and more.
- Message advertiser or book a visit.

#### Create Orders
- Route: `/orders`
- Create buy or rent requests.
- Track order status.

#### Manage Properties
- Route: `/buildingmanagement`
- Add properties, units, tenants.
- Manage leases, payments, and maintenance.

#### Request Services
- Route: `/services`
- Choose service type: post-purchase, legal, construction, marketing, or other.
- Submit form at `/services/form?type=<type>`.
- Track requests at `/services/my-requests`.

#### Wallet and Finance
- Route: `/wallet`
- View balance, invoices, commissions, and financial files.
- Pay invoices through Stripe.

#### Chat
- Route: `/chat`
- Message other users and advertisers.
- Open specific room at `/chat/[roomId]`.

#### Customer Support
- Route: `/customerservice`
- Submit complaints, inquiries, or suggestions.
- Track support tickets.

### Admin Guide - First Time

#### Step 1: Login
- Go to `/login`
- Enter admin email or phone
- Verify with OTP

#### Step 2: Access Admin Dashboard
- Route: `/admin`
- Review total users, active operations, recent activity, and service requests.

#### Step 3: Configure Platform Settings
- Route: `/admin/settings`
- Set application name and logo.
- Enable or disable sections using module flags.
- Configure login methods (email/phone).
- Set "coming soon" messages.

#### Step 4: Manage Subscription Packages
- Route: `/admin/packages`
- Create monthly and yearly packages.
- Assign included departments and prices.

#### Step 5: Manage Users
- Route: `/admin/users`
- View all users.
- Activate or deactivate accounts.
- Impersonate users to help them.
- Assign roles and departments.

#### Step 6: Monitor Operations
- Operations and statistics: `/admin/operations`
- Analytics and trends: `/admin/trends`
- Map control: `/admin/map-control`
- Finance and wallet: `/admin/wallet`
- Properties: `/admin/properties-management`
- Legal disputes: `/admin/legal`
- Customer service: `/admin/customer-service`

### Department Manager Guide

- Route: `/department-hub`
- Available departments:
  - Property Management: `/internal/properties`
  - Finance: `/internal/finance`
  - Legal: `/internal/legal`
  - Marketing: `/internal/marketing`
  - Employees: `/internal/employees`

### Quick Links

| Goal | Route |
|------|-------|
| Login | `/login` |
| Profile | `/profile` |
| Offers | `/offers` |
| New Offer | `/offers/new` |
| Orders | `/orders` |
| Property Management | `/buildingmanagement` |
| Services | `/services` |
| Wallet | `/wallet` |
| Chat | `/chat` |
| Customer Service | `/customerservice` |
| Admin Dashboard | `/admin` |
| Department Hub | `/department-hub` |
| New Subscription | `/subscriptions/new` |
| Renew Subscription | `/internal/renew-subscription` |

---

## العربية

### نظرة عامة

هذا هو تطبيق الواجهة الأمامية (Frontend) لمنصة العقارات. مبني باستخدام Next.js وReact وTailwind CSS ومكونات Radix UI.

### البدء السريع

1. تثبيت الاعتماديات:
   ```bash
   npm install
   ```

2. نسخ متغيرات البيئة:
   ```bash
   cp .env.example .env
   ```

3. ضبط رابط API في `.env`:
   ```env
   NEXT_PUBLIC_API_URL=https://api.example.com/api
   ```

4. التشغيل في وضع التطوير:
   ```bash
   npm run dev
   ```

5. البناء للإنتاج:
   ```bash
   npm run build
   npm run start
   ```

### تدفق تسجيل الدخول

1. افتح التطبيق على `/`
2. اختر طريقة الدخول: بريد إلكتروني أو جوال
3. أدخل بريدك أو رقم الجوال السعودي
4. استلم رمز OTP
5. أدخل الرمز في `/verify-otp`
6. بعد التحقق:
   - المسؤولون يذهبون إلى `/details` ثم `/admin`
   - المستخدمون العاديون يذهبون إلى `/profile`

### الأدوار ونقاط الدخول

| الدور | الصفحة الافتراضية | المنطقة الرئيسية |
|------|-------------------|------------------|
| admin | `/details` | لوحة التحكم `/admin` |
| user / viewer | `/profile` | العروض والطلبات والخدمات |
| agent / broker / owner | `/profile` | إدارة العقارات والعروض |
| manager / employee | `/department-hub` | الإدارات المخصصة |

### دليل المستخدم العادي

#### استكمال الملف الشخصي
- الرابط: `/profile`
- املأ المعلومات الشخصية ونوع المستخدم وبيانات الترخيص والعنوان الوطني.
- أكمل التحقق من الهوية.

#### تصفح وإنشاء العروض
- عرض العروض: `/offers`
- إضافة عرض جديد: `/offers/new`
- فلترة حسب النوع والسعر والمساحة والمدينة والغرف.
- التواصل مع المعلن أو حجز موعد زيارة.

#### إنشاء الطلبات
- الرابط: `/orders`
- إنشاء طلبات شراء أو إيجار.
- متابعة حالة الطلب.

#### إدارة العقارات
- الرابط: `/buildingmanagement`
- إضافة العقارات والوحدات والمستأجرين.
- إدارة العقود والمدفوعات والصيانة.

#### طلب الخدمات
- الرابط: `/services`
- اختر نوع الخدمة: ما بعد الشراء، قانونية، بناء، تسويق، أو أخرى.
- أرسل النموذج من `/services/form?type=<type>`.
- تتبع الطلبات في `/services/my-requests`.

#### المحفظة والمالية
- الرابط: `/wallet`
- عرض الرصيد والفواتير والعمولات والملفات المالية.
- دفع الفواتير عبر Stripe.

#### المحادثات
- الرابط: `/chat`
- مراسلة المستخدمين والمعلنين.
- فتح غرفة محددة عبر `/chat/[roomId]`.

#### خدمة العملاء
- الرابط: `/customerservice`
- إرسال شكوى أو استفسار أو اقتراح.
- متابعة تذاكر الدعم.

### دليل المسؤول - أول مرة

#### الخطوة 1: تسجيل الدخول
- اذهب إلى `/login`
- أدخل بريد المسؤول أو الجوال
- تحقق باستخدام OTP

#### الخطوة 2: الوصول للوحة التحكم
- الرابط: `/admin`
- راجع إجمالي المستخدمين والعمليات النشطة وآخر النشاطات وطلبات الخدمة.

#### الخطوة 3: ضبط إعدادات المنصة
- الرابط: `/admin/settings`
- ضبط اسم التطبيق والشعار.
- تفعيل أو تعطيل الأقسام باستخدام module flags.
- ضبط طرق تسجيل الدخول (بريد/جوال).
- كتابة رسائل "قريباً".

#### الخطوة 4: إدارة باقات الاشتراك
- الرابط: `/admin/packages`
- إنشاء باقات شهرية وسنوية.
- تحديد الإدارات المشمولة والأسعار.

#### الخطوة 5: إدارة المستخدمين
- الرابط: `/admin/users`
- عرض جميع المستخدمين.
- تفعيل أو تعطيل الحسابات.
- تجسيد المستخدمين لمساعدتهم.
- تحديد الأدوار والإدارات.

#### الخطوة 6: مراقبة العمليات
- العمليات والإحصائيات: `/admin/operations`
- التحليلات والاتجاهات: `/admin/trends`
- التحكم بالخريطة: `/admin/map-control`
- المحفظة والمالية: `/admin/wallet`
- إدارة الأملاك: `/admin/properties-management`
- النزاعات القانونية: `/admin/legal`
- خدمة العملاء: `/admin/customer-service`

### دليل مديري الأقسام

- الرابط: `/department-hub`
- الإدارات المتاحة:
  - إدارة الأملاك: `/internal/properties`
  - الإدارة المالية: `/internal/finance`
  - الإدارة القانونية: `/internal/legal`
  - إدارة التسويق: `/internal/marketing`
  - إدارة الموظفين: `/internal/employees`

### روابط سريعة

| الهدف | الرابط |
|-------|--------|
| تسجيل الدخول | `/login` |
| الملف الشخصي | `/profile` |
| العروض | `/offers` |
| عرض جديد | `/offers/new` |
| الطلبات | `/orders` |
| إدارة العقارات | `/buildingmanagement` |
| الخدمات | `/services` |
| المحفظة | `/wallet` |
| المحادثات | `/chat` |
| خدمة العملاء | `/customerservice` |
| لوحة المسؤول | `/admin` |
| مركز الإدارات | `/department-hub` |
| اشتراك جديد | `/subscriptions/new` |
| تجديد الاشتراك | `/internal/renew-subscription` |

# حضورك

نظام حضور وانصراف للشركات مبني على Next.js و Supabase، مع تحقق جغرافي، صلاحيات أدوار، لوحات تحكم، تقارير، وتصدير Excel/PDF.

## التشغيل المحلي

1. ثبت الحزم:

```bash
npm install
```

2. انسخ متغيرات البيئة:

```bash
cp .env.example .env.local
```

3. أضف قيم Supabase في `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ACCESS_TOKEN=
SUPABASE_BOOTSTRAP_ADMIN_EMAIL=
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=
NEXT_PUBLIC_COMPANY_NAME=حضورك
NEXT_PUBLIC_APP_LANGUAGE=ar
NEXT_PUBLIC_BRAND_PRIMARY=#059669
NEXT_PUBLIC_COMPANY_LOGO_URL=
```

4. شغل التطبيق:

```bash
npm run dev
```

## قاعدة البيانات

لتطبيق قاعدة البيانات آليًا، أضف `SUPABASE_ACCESS_TOKEN` في `.env.local` ثم شغّل:

```bash
npm run db:setup
```

هذا الأمر ينفذ migration، ثم seed، ثم يرفع البريد الموجود في `SUPABASE_BOOTSTRAP_ADMIN_EMAIL` إلى دور `admin`.

بديلًا عن ذلك، يمكنك تنفيذ الملف التالي يدويًا في Supabase SQL Editor:

```text
supabase/migrations/001_initial_schema.sql
```

ثم نفذ بيانات البداية عند الحاجة:

```text
supabase/seed.sql
```

بعد إنشاء أول حساب مدير، غيّر دوره يدويًا في جدول `profiles` إلى `admin` أو `manager` من لوحة Supabase حتى يستطيع إدارة باقي النظام.

## الصفحات الرئيسية

- `/login`: تسجيل الدخول وإنشاء حساب.
- `/app/attendance`: تسجيل الحضور والانصراف بالموقع.
- `/app/history`: سجل الموظف.
- `/app/requests`: طلبات الغياب والاستئذان والتصحيح.
- `/app/dashboard`: لوحة المشرف أو المدير.
- `/app/reports`: التقارير والتصدير.
- `/app/admin/employees`: إدارة الموظفين.
- `/app/admin/departments`: إدارة الأقسام.
- `/app/admin/locations`: إدارة مواقع العمل.
- `/app/admin/shifts`: إدارة الورديات.
- `/app/settings`: حالة متغيرات البيئة.

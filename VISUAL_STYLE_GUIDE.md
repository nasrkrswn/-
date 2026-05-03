# دليل الستايل البصري - حضورك

## نظرة عامة

نمط **Minimalist Luxury** (الفخامة البسيطة) للشركة **حضورك** يجمع بين البساطة والأناقة والاستقرار.

---

## 1. النمط البصري: Minimalist Luxury

### الفلسفة:
- **بساطة راقية**: تصميم نظيف خالي من الزخارف غير الضرورية
- **فخامة هادئة**: استخدام ألوان محترفة وتفاصيل دقيقة
- **استقرار وثقة**: تعكس طبيعة عمل الشركة في إدارة الموارد البشرية

---

## 2. لوحة الألوان

### الألوان الأساسية:

| اللون | الكود | الاستخدام |
|------|------|----------|
| **الذهب الفاخر** | `#b8860b` | العناصر الرئيسية، الأزرار، التركيز |
| **الذهب الفاتح** | `#daa520` | الحالات المختلفة (Hover, Active) |
| **البلاتينيوم** | `#e5e4e2` | الخلفيات الثانوية، الحدود اللطيفة |
| **الأبيض الفاتح** | `#fafaf9` | الخلفية الرئيسية |

### ألوان محايدة (Neutral):

| المستوى | الكود | الاستخدام |
|--------|------|----------|
| Light 50 | `#fafaf9` | الخلفيات |
| Light 100 | `#f5f5f4` | العناصر الثانوية |
| Medium 400 | `#a8a29e` | النصوص الضعيفة |
| Dark 700 | `#44403c` | النصوص الرئيسية |
| Dark 900 | `#1c1917` | النصوص القوية |

### ألوان تعبيرية اختيارية:

- **Deep Navy** (`#0f2847`): للعناصر الخطيرة أو التنبيهات الهامة
- **Charcoal** (`#36454f`): للخطوط والفواصل الدقيقة

---

## 3. الخطوط (Typography)

### الخط العربي:

**الخط الأساسي: Cairo**
- تحميل من Google Fonts
- يتسم بانسيابية الحروف العربية
- يعبر عن حضور طاغٍ لكن هادئ
- يدعم جميع أوزان الخط من 200 إلى 900

```css
font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif;
```

### أوزان الخط:

| الوزن | القيمة | الاستخدام |
|------|--------|----------|
| Light | 300 | نصوص إضافية |
| Regular | 400 | النصوص العادية |
| Medium | 500 | النصوص المهمة |
| SemiBold | 600 | العناوين الفرعية |
| Bold | 700 | العناوين الرئيسية |
| ExtraBold | 800 | التركيز الشديد |

### أحجام الخط:

- **H1**: 2.5rem (700 weight)
- **H2**: 2rem (600 weight)
- **H3**: 1.5rem (600 weight)
- **Body**: 1rem (400 weight)
- **Small**: 0.875rem (400 weight)

---

## 4. الرمزية: تداخل الحروف (ح و ض)

### المفهوم:

تداخل حروف "ح" و "ض" يرمز إلى:
- **الاحتواء**: الشركة تحتوي على موظفيها وتعتني بهم
- **الاستقرار**: النظام مستقر وموثوق
- **الوجود الطاغي لكن الهادئ**: الحضور القوي بطريقة هادئة وخاضعة للسيطرة

### تطبيق الرمزية:

يمكن استخدام هذا المفهوم في:
- **الشعار**: تصميم يعكس تداخل هذه الحروف
- **الحدود الزخرفية**: استخدام أشكال مستوحاة من الحروف العربية
- **الأيقونات**: إنشاء أيقونات بأسلوب يعكس هذا التداخل

---

## 5. عناصر التصميم

### الأزرار (Buttons):

```css
.luxury-button {
  background: #b8860b;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.luxury-button:hover {
  background: #8b6914;
  box-shadow: 0 20px 25px -5px rgba(184, 134, 11, 0.1);
}
```

### البطاقات (Cards):

```css
.luxury-card {
  background: #fafaf9;
  border: 1px solid #e7e5e4;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.luxury-card:hover {
  border-color: #b8860b;
  box-shadow: 0 20px 25px -5px rgba(184, 134, 11, 0.1);
}
```

### الفواصل (Dividers):

```css
.luxury-divider {
  height: 2px;
  background: linear-gradient(to right, transparent, #b8860b, transparent);
  margin: 2rem 0;
}
```

### الحد الجانبي (Accent Border):

```css
.luxury-accent-border {
  border-right: 3px solid #b8860b;
  padding-right: 1rem;
  margin-right: 1rem;
}
```

---

## 6. المسافات والبنية (Spacing & Layout)

استخدم نظام المسافات المنتظمة:

- **XS**: 0.5rem (8px)
- **SM**: 1rem (16px)
- **MD**: 1.5rem (24px)
- **LG**: 2rem (32px)
- **XL**: 3rem (48px)

---

## 7. الظلال (Shadows)

### الظل الناعم (Soft):
```css
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.04);
```

### الظل الناعم الكبير (Soft Large):
```css
box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
```

### الظل الفاخر (Luxury):
```css
box-shadow: 0 20px 25px -5px rgba(184, 134, 11, 0.1), 
            0 10px 10px -5px rgba(0, 0, 0, 0.05);
```

---

## 8. تطبيق في Tailwind CSS

تم تكوين `tailwind.config.ts` بالكامل لدعم هذا النمط:

```typescript
colors: {
  luxury: {
    gold: "#b8860b",
    gold-light: "#daa520",
    platinum: "#e5e4e2",
    charcoal: "#36454f"
  },
  brand: {
    50: "#fafaf9",
    500: "#b8860b",
    600: "#8b6914"
  }
}
```

---

## 9. الاستخدام العملي

### مثال على صفحة بسيطة:

```tsx
<div className="bg-neutral-50 text-neutral-900 font-cairo">
  <h1 className="text-4xl font-extrabold text-neutral-900">
    حضورك
  </h1>
  <p className="text-neutral-600 mt-2">
    نظام الحضور والانصراف الموثوق
  </p>
  
  <button className="luxury-button mt-8">
    دخول
  </button>
</div>
```

### مثال على بطاقة:

```tsx
<div className="luxury-card p-6">
  <h3 className="text-xl font-semibold text-neutral-900">
    معلومات الحضور
  </h3>
  <div className="luxury-divider"></div>
  <p className="text-neutral-600">
    تفاصيل الحضور هنا
  </p>
</div>
```

---

## 10. ملاحظات النهائية

- **الاستقلالية عن اللون**: النظام مصمم ليكون ديناميكياً ويمكن تعديل اللون الأساسي عبر متغير CSS
- **الراحة البصرية**: الظلال واللون المحايد يخفف من الإرهاق البصري
- **الفخامة الهادئة**: عدم استخدام ألوان صارخة يعكس الثقة والاستقرار
- **الدعم العربي الكامل**: الخط والتباعد مصممة خصيصاً للعربية

---

**آخر تحديث**: 30 أبريل 2026
**النسخة**: 1.0

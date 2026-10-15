<div dir="rtl" align="center">

# 🌐 tmrsa1-ui.github.io

**الموقع الشخصي ومضيف النسخ الحية من أدوات عربية تعمل على جهازك: بلا حساب، وبلا رفع ملفاتك.**

<a href="https://tmrsa1-ui.github.io/"><img src="https://img.shields.io/badge/%D8%A7%D9%81%D8%AA%D8%AD%20%D8%A7%D9%84%D9%85%D9%88%D9%82%D8%B9-Live-0b7285?style=for-the-badge" alt="افتح الموقع"></a>
<br>
<a href="https://github.com/tmrsa1-ui/tmrsa1-ui.github.io/actions/workflows/ci.yml"><img src="https://github.com/tmrsa1-ui/tmrsa1-ui.github.io/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>
<img src="https://img.shields.io/badge/PWA-offline-5A0FC8?style=flat-square&logo=pwa" alt="PWA">
<img src="https://img.shields.io/badge/OCR-Tesseract%20%D9%85%D8%AD%D9%84%D9%8A-2e7d32?style=flat-square" alt="OCR محلي">

<br><br>

<img src="docs/screenshots/home.png" alt="ورق — مدخل: من الورق إلى الجدول" width="820">

</div>

<div dir="rtl">

## 🧰 الأدوات المنشورة

| الأداة | الرابط | وش تسوي |
|---|---|---|
| 📄 **ورق — مدخل** | [الرئيسية](https://tmrsa1-ui.github.io/) | تقرأ الفواتير وكشوف الحساب العربية (PDF أو صورة)، وتعيد بناء الجداول باتجاه RTL، وكل قيمة مربوطة بصفحتها وموضعها ودرجة ثقتها. المعالجة كلها في المتصفح. |
| 📍 **عنواني** | [/unwani/](https://tmrsa1-ui.github.io/unwani/) | يحلل العناوين الخليجية المكتوبة بحرية إلى حقول منظمة. [المستودع](https://github.com/tmrsa1-ui/Unwani-Web) |
| 📝 **ورقة** | [/waraqa/](https://tmrsa1-ui.github.io/waraqa/) | أداة المعلم للاختبار الورقي العربي الذي يُفتح في Word. [المستودع](https://github.com/tmrsa1-ui/Waraqa-Web) |

## ⚠️ حدود صادقة

- ما فيه أي اعتماد رسمي من جهة حكومية أو بريدية أو تعليمية.
- القيم المستخرجة تُعرض كما قُرئت، وتحتاج مراجعتك قبل الاعتماد عليها.

## 🗂️ البنية

```
index.html, assets/    ورق — مدخل (نسخة مبنية)
unwani/                عنواني
waraqa/                ورقة
tesseract/             Tesseract.js وبيانات العربية والإنجليزية (Apache-2.0، انظر NOTICE)
scripts/verify-site.mjs فحص CI قبل النشر
```

النشر تلقائي عبر GitHub Actions عند الدفع إلى `main`. راجع [`SECURITY.md`](SECURITY.md) و[`CHANGELOG.md`](CHANGELOG.md).

</div>

// Built-in note templates (user can add custom ones from the Templates page)
export const BUILTIN_TEMPLATES: Array<{ name: string; icon: string; contentHTML: string }> = [
  {
    name: 'ملخص كتاب', icon: '📖',
    contentHTML: `<h1>ملخص كتاب: </h1><p><strong>المؤلف:</strong> </p><p><strong>سنة النشر:</strong> </p><h2>الفكرة الرئيسية</h2><p></p><h2>أهم النقاط</h2><ul><li></li><li></li></ul><h2>اقتباسات مميزة</h2><blockquote><p></p></blockquote><h2>رأيي وتقييمي</h2><p></p><h2>ما سأطبقه</h2><ul><li></li></ul>`,
  },
  {
    name: 'ملخص دورة', icon: '🎓',
    contentHTML: `<h1>ملخص دورة: </h1><p><strong>المقدم:</strong> </p><p><strong>المنصة:</strong> </p><h2>أهداف الدورة</h2><ul><li></li></ul><h2>أهم الدروس</h2><ul><li></li></ul><h2>تطبيقات عملية</h2><p></p>`,
  },
  {
    name: 'ملخص اجتماع', icon: '🤝',
    contentHTML: `<h1>اجتماع: </h1><p><strong>التاريخ:</strong> </p><p><strong>الحضور:</strong> </p><h2>النقاط المطروحة</h2><ul><li></li></ul><h2>القرارات</h2><ul><li></li></ul><h2>المهام</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul>`,
  },
  {
    name: 'ملخص فتوى', icon: '🕌',
    contentHTML: `<h1>فتوى: </h1><p><strong>المفتي:</strong> </p><p><strong>المصدر:</strong> </p><h2>نص السؤال</h2><p></p><h2>خلاصة الجواب</h2><p></p><h2>الأدلة</h2><ul><li></li></ul><h2>فوائد إضافية</h2><p></p>`,
  },
  {
    name: 'ملخص محاضرة', icon: '🎤',
    contentHTML: `<h1>محاضرة: </h1><p><strong>المحاضر:</strong> </p><p><strong>التاريخ:</strong> </p><h2>أهم النقاط</h2><ul><li></li></ul><h2>فوائد</h2><p></p>`,
  },
  {
    name: 'ملخص بحث', icon: '🔬',
    contentHTML: `<h1>بحث: </h1><p><strong>الباحث:</strong> </p><p><strong>سنة النشر:</strong> </p><h2>سؤال البحث</h2><p></p><h2>المنهجية</h2><p></p><h2>النتائج</h2><ul><li></li></ul><h2>ملاحظاتي</h2><p></p>`,
  },
  {
    name: 'شخصية', icon: '👤',
    contentHTML: `<h1>شخصية: </h1><p><strong>الميلاد والوفاة:</strong> </p><p><strong>المجال:</strong> </p><h2>نبذة</h2><p></p><h2>أهم الإنجازات</h2><ul><li></li></ul><h2>مواقف وقصص</h2><p></p><h2>أقوال مأثورة</h2><blockquote><p></p></blockquote>`,
  },
  {
    name: 'دولة', icon: '🌍',
    contentHTML: `<h1>دولة: </h1><p><strong>العاصمة:</strong> </p><p><strong>عدد السكان:</strong> </p><p><strong>العملة:</strong> </p><h2>نبذة تاريخية</h2><p></p><h2>الاقتصاد</h2><p></p><h2>معلومات مهمة</h2><ul><li></li></ul>`,
  },
  {
    name: 'فكرة مشروع', icon: '💡',
    contentHTML: `<h1>فكرة مشروع: </h1><h2>المشكلة</h2><p></p><h2>الحل المقترح</h2><p></p><h2>الجمهور المستهدف</h2><p></p><h2>نموذج الربح</h2><p></p><h2>الخطوات الأولى</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false"></li></ul>`,
  },
  {
    name: 'مراجعة كتاب', icon: '⭐',
    contentHTML: `<h1>مراجعة كتاب: </h1><p><strong>التقييم:</strong> /10</p><h2>ما أعجبني</h2><ul><li></li></ul><h2>ما لم يعجبني</h2><ul><li></li></ul><h2>لمن أرشحه؟</h2><p></p>`,
  },
  {
    name: 'مراجعة منتج', icon: '🛒',
    contentHTML: `<h1>مراجعة منتج: </h1><p><strong>السعر:</strong> </p><p><strong>التقييم:</strong> /10</p><h2>المميزات</h2><ul><li></li></ul><h2>العيوب</h2><ul><li></li></ul><h2>الخلاصة</h2><p></p>`,
  },
  {
    name: 'تقنية', icon: '⚙️',
    contentHTML: `<h1>تقنية: </h1><h2>ما هي؟</h2><p></p><h2>لماذا تُستخدم؟</h2><p></p><h2>كيف تعمل؟</h2><p></p><h2>مثال عملي</h2><pre><code></code></pre><h2>مصادر للتعلم</h2><ul><li></li></ul>`,
  },
  {
    name: 'خطة تعلم', icon: '🎯',
    contentHTML: `<h1>خطة تعلم: </h1><p><strong>الهدف:</strong> </p><p><strong>المدة:</strong> </p><h2>المصادر</h2><ul><li></li></ul><h2>المراحل</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="false">المرحلة الأولى: </li><li data-type="taskItem" data-checked="false">المرحلة الثانية: </li></ul><h2>مقياس النجاح</h2><p></p>`,
  },
]

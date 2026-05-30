# بوت متجر احترافي لديسكورد

بوت متجر احترافي مبني باستخدام Discord.js مع لوحة تحكم متكاملة.

## الميزات

### 🏪 المتجر
- أمر `/store` لفتح المتجر
- عرض المنتجات مع الصور والأسعار
- سلة مشتريات مع دعم اختيار منتجات متعددة
- حساب السعر الإجمالي تلقائياً

### 🎫 نظام التذاكر
- إنشاء تذكرة تلقائية عند تأكيد الطلب
- إضافة العميل وفريق الإدارة
- أزرار تحكم (تأكيد، استلام، إلغاء، إغلاق)
- إشعارات للعملاء

### 📦 إدارة المنتجات
- إضافة منتجات جديدة
- تعديل المنتجات
- حذف المنتجات
- تفعيل/تعطيل المنتجات
- دعم الصور والأسعار والتصنيفات

### 📂 إدارة التصنيفات
- إنشاء تصنيفات جديدة
- تعديل التصنيفات
- حذف التصنيفات

### 📊 الإحصائيات
- عدد الطلبات
- إجمالي المبيعات
- عدد المنتجات
- عدد العملاء
- أكثر المنتجات مبيعاً

### 🛒 إدارة الطلبات
- عرض جميع الطلبات
- عرض الطلبات المعلقة
- عرض الطلبات المكتملة
- البحث عن طلب

### 🔐 الصلاحيات
- **Owner**: جميع الصلاحيات
- **Admin**: إدارة المنتجات والطلبات
- **Staff**: إدارة الطلبات فقط

## التثبيت

### 1. تثبيت المتطلبات

```bash
npm install
```

### 2. إعداد ملف .env

أنشئ ملف `.env` في الجذر وأضف:

```env
BOT_TOKEN=your_bot_token_here
GUILD_ID=your_guild_id_here
ADMIN_ROLE_ID=your_admin_role_id_here
MANAGER_ROLE_ID=your_manager_role_id_here
STAFF_ROLE_ID=your_staff_role_id_here
TICKET_CATEGORY_ID=your_ticket_category_id_here
NOTIFICATION_ROLE_ID=your_notification_role_id_here
```

### 3. تشغيل البوت

```bash
npm start
```

## هيكل المشروع

```
discord-store-bot/
├── index.js                    # ملف البوت الرئيسي
├── package.json                # ملف المتطلبات
├── .env                        # متغيرات البيئة
├── database/
│   └── db.js                   # قاعدة البيانات
├── commands/
│   ├── store.js                # أمر المتجر
│   └── admin.js                # أمر الإدارة
├── events/
│   ├── ready.js                # حدث الجاهزية
│   └── interactionCreate.js    # حدث التفاعل
├── buttons/
│   ├── viewProducts.js         # زر عرض المنتجات
│   ├── viewCart.js             # زر عرض السلة
│   ├── confirmOrder.js         # زر تأكيد الطلب
│   ├── cancelOrder.js          # زر إلغاء الطلب
│   ├── receiveOrder.js         # زر استلام الطلب
│   ├── closeTicket.js          # زر إغلاق التذكرة
│   ├── adminProducts.js        # زر إدارة المنتجات
│   ├── adminCategories.js      # زر إدارة التصنيفات
│   ├── adminOrders.js          # زر إدارة الطلبات
│   ├── adminStats.js           # زر الإحصائيات
│   ├── addProduct.js           # زر إضافة منتج
│   ├── editProduct.js          # زر تعديل منتج
│   ├── deleteProduct.js        # زر حذف منتج
│   ├── toggleProduct.js        # زر تفعيل/تعطيل منتج
│   ├── addCategory.js          # زر إضافة تصنيف
│   ├── editCategory.js         # زر تعديل تصنيف
│   ├── deleteCategory.js       # زر حذف تصنيف
│   ├── confirmDeleteProduct.js # زر تأكيد حذف منتج
│   ├── confirmDeleteCategory.js # زر تأكيد حذف تصنيف
│   ├── viewAllOrders.js        # زر عرض جميع الطلبات
│   ├── viewPendingOrders.js    # زر عرض الطلبات المعلقة
│   ├── viewCompletedOrders.js  # زر عرض الطلبات المكتملة
│   ├── searchOrder.js          # زر البحث عن طلب
│   └── cancelDelete.js         # زر إلغاء الحذف
├── selectMenus/
│   ├── productSelect.js        # قائمة اختيار المنتجات
│   ├── editCategorySelect.js   # قائمة اختيار تعديل التصنيف
│   ├── deleteCategorySelect.js # قائمة اختيار حذف التصنيف
│   ├── editProductSelect.js    # قائمة اختيار تعديل المنتج
│   ├── deleteProductSelect.js  # قائمة اختيار حذف المنتج
│   └── toggleProductSelect.js  # قائمة اختيار تغيير حالة المنتج
├── modals/
│   ├── addProductModal.js      # مودال إضافة منتج
│   ├── addCategoryModal.js     # مودال إضافة تصنيف
│   ├── editCategoryModal.js    # مودال تعديل تصنيف
│   ├── editProductModal.js     # مودال تعديل منتج
│   └── searchOrderModal.js     # مودال البحث عن طلب
└── utils/
    ├── embeds.js               # وظائف Embed
    └── helpers.js              # وظائف مساعدة
```

## الأوامر

### /store
فتح المتجر وعرض المنتجات.

### /admin
فتح لوحة التحكم الإدارية (يتطلب صلاحيات).

## التصنيفات الافتراضية

يمكنك تعديل التصنيفات من خلال لوحة التحكم الإدارية.

## ملاحظات

1. تأكد من إنشاء الرتب المطلوبة في السيرفر
2. تأكد من إنشاء كاتب التذاكر
3. تأكد من منح البوت الصلاحيات المطلوبة
4. يتم حفظ البيانات في قاعدة SQLite

## الرخصة

MIT License

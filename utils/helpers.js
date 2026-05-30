const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');
const { Icons } = require('./embeds');

// إنشاء أزرار المتجر الرئيسي
function createStoreButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('viewProducts')
            .setLabel('عرض المنتجات')
            .setEmoji(Icons.BOX)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('viewCart')
            .setLabel('سلة المشتريات')
            .setEmoji(Icons.CART)
            .setStyle(ButtonStyle.Success),
    );
}

// إنشاء أزرار تأكيد الطلب
function createOrderButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('confirmOrder')
            .setLabel('تأكيد الطلب')
            .setEmoji(Icons.CHECK)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('cancelOrder')
            .setLabel('إلغاء الطلب')
            .setEmoji(Icons.CROSS)
            .setStyle(ButtonStyle.Danger),
    );
}

// إنشاء أزرار التذاكر
function createTicketButtons(orderId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`confirmOrder_${orderId}`)
            .setLabel('تأكيد الطلب')
            .setEmoji(Icons.CHECK)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId(`receiveOrder_${orderId}`)
            .setLabel('استلام الطلب')
            .setEmoji(Icons.TRUCK)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId(`cancelOrder_${orderId}`)
            .setLabel('إلغاء الطلب')
            .setEmoji(Icons.CROSS)
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`closeTicket_${orderId}`)
            .setLabel('إغلاق التذكرة')
            .setEmoji(Icons.CLOSE)
            .setStyle(ButtonStyle.Secondary),
    );
}

// إنشاء قائمة اختيار المنتجات
function createProductSelectMenu(products) {
    const options = products.map(product => ({
        label: product.name,
        description: `$${product.price.toFixed(2)} - ${product.category_name || 'غير محدد'}`,
        value: product.id.toString(),
        emoji: product.is_active ? '🟢' : '🔴',
    }));

    // ديسكورد يسمح بحد أقصى 25 خيار في القائمة المنسدلة
    const limitedOptions = options.slice(0, 25);

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('productSelect')
            .setPlaceholder('اختر المنتجات التي تريد شرائها')
            .setMinValues(1)
            .setMaxValues(Math.min(limitedOptions.length, 25))
            .addOptions(limitedOptions)
    );
}

// إنشاء قائمة اختيار التصنيفات
function createCategorySelectMenu(categories) {
    const options = categories.map(category => ({
        label: category.name,
        description: category.description || 'تصنيف',
        value: category.id.toString(),
        emoji: '📂',
    }));

    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('categorySelect')
            .setPlaceholder('اختر التصنيف')
            .addOptions(options)
    );
}

// إنشاء أزرار لوحة التحكم
function createAdminPanelButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('admin_products')
            .setLabel('إدارة المنتجات')
            .setEmoji(Icons.PRODUCT)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('admin_categories')
            .setLabel('إدارة التصنيفات')
            .setEmoji(Icons.CATEGORY)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('admin_orders')
            .setLabel('إدارة الطلبات')
            .setEmoji(Icons.CART)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('admin_stats')
            .setLabel('الإحصائيات')
            .setEmoji(Icons.STATS)
            .setStyle(ButtonStyle.Primary),
    );
}

// إنشاء أزرار إدارة المنتجات
function createProductManagementButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('addProduct')
            .setLabel('إضافة منتج')
            .setEmoji(Icons.PLUS)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('editProduct')
            .setLabel('تعديل منتج')
            .setEmoji(Icons.EDIT)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('deleteProduct')
            .setLabel('حذف منتج')
            .setEmoji(Icons.TRASH)
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId('toggleProduct')
            .setLabel('تفعيل/تعطيل')
            .setEmoji(Icons.GEAR)
            .setStyle(ButtonStyle.Secondary),
    );
}

// إنشاء أزرار إدارة الطلبات
function createOrderManagementButtons() {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('viewAllOrders')
            .setLabel('جميع الطلبات')
            .setEmoji(Icons.RECEIPT)
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('viewPendingOrders')
            .setLabel('الطلبات المعلقة')
            .setEmoji(Icons.CLOCK)
            .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('viewCompletedOrders')
            .setLabel('الطلبات المكتملة')
            .setEmoji(Icons.CHECK)
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('searchOrder')
            .setLabel('بحث عن طلب')
            .setEmoji('🔍')
            .setStyle(ButtonStyle.Secondary),
    );
}

// إنشاء أزرار التنقل في القوائم
function createPaginationButtons(page, totalPages) {
    const buttons = [];

    if (page > 1) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId('prevPage')
                .setLabel('السابق')
                .setEmoji('◀️')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    buttons.push(
        new ButtonBuilder()
            .setCustomId('currentPage')
            .setLabel(`${page}/${totalPages}`)
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
    );

    if (page < totalPages) {
        buttons.push(
            new ButtonBuilder()
                .setCustomId('nextPage')
                .setLabel('التالي')
                .setEmoji('▶️')
                .setStyle(ButtonStyle.Secondary)
        );
    }

    return new ActionRowBuilder().addComponents(buttons);
}

// التحقق من صلاحية معينة من قاعدة البيانات أو الرتب البيئية
function checkSpecificPermission(member, permission) {
    const db = require('../database/db');
    const dbPermissions = db.getAllRolePermissions();
    
    // 1. التحقق من الصلاحيات المخصصة في قاعدة البيانات
    for (const [roleId, roleData] of Object.entries(dbPermissions)) {
        if (member.roles.cache.has(roleId)) {
            if (roleData.permissions.includes('all')) return true;
            if (roleData.permissions.includes(permission)) return true;
        }
    }
    
    // 2. Fallback إلى الرتب البيئية في .env
    if (process.env.ADMIN_ROLE_ID && member.roles.cache.has(process.env.ADMIN_ROLE_ID)) return true;
    if (process.env.MANAGER_ROLE_ID && member.roles.cache.has(process.env.MANAGER_ROLE_ID)) {
        if (['manage_products', 'manage_orders', 'manage_users', 'manage_settings', 'view_stats'].includes(permission)) return true;
    }
    if (process.env.STAFF_ROLE_ID && member.roles.cache.has(process.env.STAFF_ROLE_ID)) {
        if (permission === 'manage_orders') return true;
    }
    
    return false;
}

// التحقق من صلاحيات الإدارة (أي صلاحية إدارية)
function isAdmin(member) {
    const adminPerms = ['manage_products', 'manage_users', 'manage_settings', 'view_stats', 'manage_orders'];
    for (const p of adminPerms) {
        if (checkSpecificPermission(member, p)) return true;
    }
    return false;
}

// التحقق من صلاحيات الموظف (إدارة الطلبات فقط)
function isStaff(member) {
    return checkSpecificPermission(member, 'manage_orders');
}

// (محفوظة للتوافق مع النظام القديم)
function hasPermission(member, requiredRole) {
    if (requiredRole === 'admin') return isAdmin(member);
    if (requiredRole === 'staff') return isStaff(member);
    return false;
}

// حساب السعر الإجمالي
function calculateTotalPrice(products) {
    return products.reduce((total, product) => total + product.price, 0);
}

// تنسيق الأرقام
function formatNumber(number) {
    return number.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// إنشاء معرف فريد
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// البحث عن تذكرة مفتوحة لنفس المستخدم لإعادة استخدامها
async function findExistingTicketChannel(guild, userId) {
    const db = require('../database/db');
    const userOrders = db.getOrdersByUser(userId);
    const openStatuses = ['pending', 'confirmed', 'processing'];
    
    for (const order of userOrders) {
        if (!openStatuses.includes(order.status)) continue;
        if (!order.ticket_channel_id) continue;
        
        try {
            const channel = await guild.channels.fetch(order.ticket_channel_id);
            if (channel && channel.isTextBased()) return channel;
        } catch (e) {
            // القناة محذوفة أو غير متاحة
        }
    }
    return null;
}

module.exports = {
    createStoreButtons,
    createOrderButtons,
    createTicketButtons,
    createProductSelectMenu,
    createCategorySelectMenu,
    createAdminPanelButtons,
    createProductManagementButtons,
    createOrderManagementButtons,
    createPaginationButtons,
    hasPermission,
    checkSpecificPermission,
    isAdmin,
    isStaff,
    calculateTotalPrice,
    formatNumber,
    generateId,
    findExistingTicketChannel
};



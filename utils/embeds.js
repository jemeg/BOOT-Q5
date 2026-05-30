const { EmbedBuilder } = require('discord.js');

// الألوان المستخدمة في البوت
const Colors = {
    PRIMARY: 0x5865F2,
    SUCCESS: 0x57F287,
    WARNING: 0xFEE75C,
    DANGER: 0xED4245,
    DARK: 0x2C2F33,
    LIGHT: 0xFFFFFF,
    PURPLE: 0x9B59B6,
    ORANGE: 0xE67E22,
    CYAN: 0x00D4AA,
    PINK: 0xFF6B9D,
    INFO: 0x5865F2,
};

// صور الأيقونات
const Icons = {
    STORE: '🏪',
    PRODUCT: '📦',
    CART: '🛒',
    TICKET: '🎫',
    CHECK: '✅',
    CROSS: '❌',
    INFO: 'ℹ️',
    STATS: '📊',
    GEAR: '⚙️',
    MONEY: '💰',
    USER: '👤',
    CROWN: '👑',
    STAR: '⭐',
    FIRE: '🔥',
    BOX: '📦',
    TRASH: '🗑️',
    EDIT: '✏️',
    PLUS: '➕',
    MINUS: '➖',
    CLOSE: '🔒',
    OPEN: '🔓',
    WARNING: '⚠️',
    SUCCESS: '✅',
    CANCEL: '❌',
    CLOCK: '🕐',
    CALENDAR: '📅',
    IMAGE: '🖼️',
    CATEGORY: '📂',
    TAG: '🏷️',
    PALETTE: '🎨',
    GIFT: '🎁',
    TRUCK: '🚚',
    RECEIPT: '🧾',
    CHART: '📈',
    PEOPLE: '👥',
    SHIELD: '🛡️',
    KEY: '🔑',
};

// إنشاء Embed أساسي
function createBaseEmbed(options = {}) {
    const embed = new EmbedBuilder()
        .setColor(options.color || Colors.PRIMARY)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);
    if (options.image) embed.setImage(options.image);
    
    // التعامل مع footer بشكل صحيح
    if (options.footer) {
        if (typeof options.footer === 'string') {
            embed.setFooter({ text: options.footer });
        } else if (typeof options.footer === 'object' && options.footer.text) {
            embed.setFooter(options.footer);
        }
    }
    
    // التعامل مع author بشكل صحيح
    if (options.author) {
        if (typeof options.author === 'string') {
            embed.setAuthor({ name: options.author });
        } else if (typeof options.author === 'object' && options.author.name) {
            embed.setAuthor(options.author);
        }
    }
    
    if (options.url) embed.setURL(options.url);

    return embed;
}

// إنشاء Embed لل-store الرئيسي
function createStoreEmbed() {
    return createBaseEmbed({
        color: Colors.PRIMARY,
        title: `${Icons.STORE} مرحباً بك في 𝐋𝐄𝐆𝐀𝐂𝐘 𝑆𝑇𝑂𝑅𝐸`,
        description: `**متجرنا يقدم لك أفضل المنتجات والخدمات الرقمية**\n\n${Icons.FIRE} **اكتشف منتجاتنا المميزة**\n${Icons.GIFT} **عروض حصرية وخصومات**\n${Icons.STAR} **جودة عالية وخدمة ممتازة**\n\n---\n`,
        footer: { text: '' },
    });
}

// إنشاء Embed لعرض المنتجات
function createProductsEmbed(products, page = 1, productsPerPage = 5) {
    const totalPages = Math.ceil(products.length / productsPerPage);
    const startIndex = (page - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = products.slice(startIndex, endIndex);

    let description = '';
    
    if (currentProducts.length === 0) {
        description = '**لا توجد منتجات حالياً**';
    } else {
        currentProducts.forEach((product, index) => {
            const status = product.is_active ? '🟢' : '🔴';
            description += `**${Icons.PRODUCT} ${product.name}**\n> ${Icons.MONEY} **السعر:** $${product.price.toFixed(2)}\n> ${Icons.TAG} **التصنيف:** ${product.category_name || 'غير محدد'}\n> ${status} ${product.is_active ? 'مفعل' : 'معطل'}\n---\n`;
        });
    }

    return createBaseEmbed({
        color: Colors.CYAN,
        title: `${Icons.BOX} قائمة المنتجات`,
        description: description,
        footer: `الصفحة ${page} من ${totalPages} | ${products.length} منتج`,
    });
}

// إنشاء Embed لتفاصيل المنتج
function createProductEmbed(product) {
    return createBaseEmbed({
        color: product.is_active ? Colors.SUCCESS : Colors.DANGER,
        title: `${Icons.PRODUCT} ${product.name}`,
        description: `${product.description || 'لا يوجد وصف'}\n\n---\n${Icons.MONEY} **السعر:** $${product.price.toFixed(2)}\n${Icons.TAG} **التصنيف:** ${product.category_name || 'غير محدد'}\n${Icons.INFO} **الحالة:** ${product.is_active ? '🟢 مفعل' : '🔴 معطل'}\n---\n**اضغط على الزر أدناه لطلب هذا المنتج**`,
        thumbnail: product.image_url || undefined,
        footer: `ID: ${product.id}`,
    });
}

// إنشاء Embed لسلة المشتريات
function createCartEmbed(selectedProducts, totalPrice) {
    let productsList = '';
    selectedProducts.forEach(product => {
        productsList += `${Icons.PRODUCT} **${product.name}** - $${product.price.toFixed(2)}\n`;
    });

    return createBaseEmbed({
        color: Colors.ORANGE,
        title: `${Icons.CART} سلة المشتريات`,
        description: `**المنتجات المختارة:**\n${productsList}\n---\n${Icons.MONEY} **المجموع الكلي:** $${totalPrice.toFixed(2)}\n---\n**اضغط على "تأكيد الطلب" لإتمام الشراء**`,
    });
}

// إنشاء Embed للتذكرة
function createTicketEmbed(order, products) {
    let productsList = '';
    let totalPrice = 0;
    
    products.forEach((product, i) => {
        const img = product.image_url || product.image;
        productsList += `${Icons.PRODUCT} **${product.name}**\n> ${Icons.MONEY} السعر: $${product.price.toFixed(2)}`;
        if (img) productsList += `\n> ${Icons.IMAGE} [[الصورة]](${img.startsWith('http') ? img : `http://localhost:${process.env.WEB_PORT || 3000}${img}`})`;
        productsList += `\n---\n`;
        totalPrice += product.price;
    });

    const firstImage = products.find(p => p.image_url || p.image);
    const thumbnail = firstImage ? (firstImage.image_url || firstImage.image) : undefined;

    return createBaseEmbed({
        color: Colors.PURPLE,
        title: `${Icons.TICKET} تفاصيل الطلب #${order.id}`,
        thumbnail: thumbnail && (thumbnail.startsWith('http') ? thumbnail : undefined),
        description: `${Icons.USER} **اسم العميل:** <@${order.user_id}>\n${Icons.CALENDAR} **تاريخ الطلب:** <t:${Math.floor(Date.now() / 1000)}:R>\n${Icons.RECEIPT} **رقم الطلب:** #${order.id}\n\n---\n**المنتجات المختارة:**\n${productsList}\n---\n${Icons.MONEY} **المجموع الكلي:** $${totalPrice.toFixed(2)}\n\n---\n**حالة الطلب:** ${getStatusEmoji(order.status)} ${getStatusText(order.status)}`,
        footer: { text: '' },
    });
}

// إنشاء Embed للوحة التحكم الإدارية
function createAdminPanelEmbed() {
    return createBaseEmbed({
        color: Colors.DARK,
        title: `${Icons.GEAR} لوحة تحكم المتجر`,
        description: `**مرحباً بك في لوحة التحكم الإدارية**\n\n${Icons.PRODUCT} **إدارة المنتجات** - إضافة، تعديل، حذف المنتجات\n${Icons.CATEGORY} **إدارة التصنيفات** - إنشاء وتعديل التصنيفات\n${Icons.CART} **إدارة الطلبات** - متابعة وإدارة الطلبات\n${Icons.STATS} **الإحصائيات** - عرض إحصائيات المتجر\n\n---\n**اختر القسم الذي تريد إدارته من القائمة أدناه**`,
        footer: { text: '' },
    });
}

// إنشاء Embed للإحصائيات
function createStatsEmbed(stats) {
    return createBaseEmbed({
        color: Colors.CYAN,
        title: `${Icons.STATS} إحصائيات المتجر`,
        description: `${Icons.RECEIPT} **إجمالي الطلبات:** ${stats.orderCount}\n${Icons.MONEY} **إجمالي المبيعات:** $${stats.totalSales.toFixed(2)}\n${Icons.PRODUCT} **عدد المنتجات:** ${stats.productCount}\n${Icons.PEOPLE} **عدد العملاء:** ${stats.customerCount}\n\n---\n**أكثر المنتجات مبيعاً:**\n${stats.mostSold.length > 0 ? stats.mostSold.map((p, i) => `${Icons.STAR} ${i + 1}. ${p.name} - ${p.total_sold} مبيعة`).join('\n') : 'لا توجد بيانات بعد'}`,
        footer: { text: '' },
    });
}

// وظائف مساعدة
function getStatusEmoji(status) {
    const statusEmojis = {
        'pending': '🟡',
        'confirmed': '🟢',
        'processing': '🔵',
        'completed': '✅',
        'cancelled': '❌',
        'received': '📦'
    };
    return statusEmojis[status] || '⚪';
}

function getStatusText(status) {
    const statusTexts = {
        'pending': 'قيد المراجعة',
        'confirmed': 'تم التأكيد',
        'processing': 'قيد المعالجة',
        'completed': 'مكتمل',
        'cancelled': 'ملغي',
        'received': 'تم الاستلام'
    };
    return statusTexts[status] || status;
}

module.exports = {
    Colors,
    Icons,
    createBaseEmbed,
    createStoreEmbed,
    createProductsEmbed,
    createProductEmbed,
    createCartEmbed,
    createTicketEmbed,
    createAdminPanelEmbed,
    createStatsEmbed,
    getStatusEmoji,
    getStatusText
};


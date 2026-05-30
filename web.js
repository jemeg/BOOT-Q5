const express = require('express');
const path = require('path');
const multer = require('multer');
const db = require('./database/db');
const { findExistingTicketChannel } = require('./utils/helpers');

// File upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, 'public', 'uploads')),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|gif|webp|svg/;
        const ext = allowed.test(path.extname(file.originalname).toLowerCase());
        const mime = allowed.test(file.mimetype);
        if (ext && mime) return cb(null, true);
        cb(new Error('فقط الصور مسموحة (jpeg, jpg, png, gif, webp, svg)'));
    }
});

const app = express();
const PORT = process.env.WEB_PORT || 3000;

// Session storage (in-memory for simplicity)
const sessions = {};

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use((req, res, next) => {
    const sessionId = req.headers['x-session-id'] || req.query.session;
    if (sessionId && sessions[sessionId]) {
        req.user = sessions[sessionId];
    }
    next();
});

// === صلاحيات المستخدم ===
function getUserPermissions(user) {
    if (!user || !user.roles || !Array.isArray(user.roles)) return [];
    const allRolePerms = db.getAllRolePermissions();
    const userPerms = new Set();
    if (process.env.ADMIN_ROLE_ID && user.roles.includes(process.env.ADMIN_ROLE_ID)) userPerms.add('all');
    if (process.env.MANAGER_ROLE_ID && user.roles.includes(process.env.MANAGER_ROLE_ID)) {
        userPerms.add('manage_products'); userPerms.add('manage_orders'); userPerms.add('view_stats'); userPerms.add('manage_settings');
    }
    if (process.env.STAFF_ROLE_ID && user.roles.includes(process.env.STAFF_ROLE_ID)) {
        userPerms.add('view_products'); userPerms.add('view_stats');
    }
    for (const roleId of user.roles) {
        const rolePerms = allRolePerms[roleId];
        if (rolePerms && Array.isArray(rolePerms.permissions)) {
            rolePerms.permissions.forEach(p => userPerms.add(p));
        }
    }
    return [...userPerms];
}

function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ success: false, error: 'يرجى تسجيل الدخول' });
    next();
}

function requirePermission(...perms) {
    return (req, res, next) => {
        if (!req.user) return res.status(401).json({ success: false, error: 'يرجى تسجيل الدخول' });
        const userPerms = getUserPermissions(req.user);
        if (userPerms.includes('all')) return next();
        if (perms.some(p => userPerms.includes(p))) return next();
        return res.status(403).json({ success: false, error: 'لا تملك الصلاحية المطلوبة' });
    };
}

// === Discord OAuth2 ===
app.get('/auth/login', (req, res) => {
    const clientId = process.env.DISCORD_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`);
    const scope = 'identify guilds';
    const url = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}`;
    res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.redirect('/store?error=no_code');
    
    try {
        // Exchange code for token
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.DISCORD_CLIENT_ID,
                client_secret: process.env.DISCORD_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: process.env.DISCORD_REDIRECT_URI || `http://localhost:${PORT}/auth/callback`,
                scope: 'identify guilds'
            })
        });
        
        const tokenData = await tokenResponse.json();
        if (tokenData.error) return res.redirect('/store?error=token_failed');
        
        // Get user info
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        
        const userData = await userResponse.json();
        if (userData.error) return res.redirect('/store?error=user_failed');
        
        // جلب رتب المستخدم من السيرفر
        let roles = [];
        if (global.discordClient) {
            try {
                const guild = global.discordClient.guilds.cache.get(process.env.GUILD_ID);
                if (guild) {
                    const member = await guild.members.fetch(userData.id);
                    roles = member.roles.cache.map(r => r.id);
                }
            } catch (e) {
                console.log('⚠️ لا يمكن جلب صلاحيات المستخدم:', e.message);
            }
        }

        // Create session
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        sessions[sessionId] = {
            id: userData.id,
            username: userData.username,
            discriminator: userData.discriminator,
            avatar: userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : null,
            access_token: tokenData.access_token,
            roles: roles
        };
        
        res.redirect(`/store?session=${sessionId}`);
    } catch (error) {
        console.error('OAuth error:', error);
        res.redirect('/store?error=server_error');
    }
});

app.get('/auth/logout', (req, res) => {
    const sessionId = req.headers['x-session-id'] || req.query.session;
    if (sessionId) delete sessions[sessionId];
    res.json({ success: true });
});

app.get('/auth/user', (req, res) => {
    if (req.user) {
        const user = { ...req.user };
        delete user.access_token;
        res.json({ success: true, user });
    } else {
        res.json({ success: false, user: null });
    }
});

// نقطة جلب صلاحيات المستخدم (للوحة التحكم)
app.get('/api/user/permissions', requireAuth, (req, res) => {
    try {
        const perms = getUserPermissions(req.user);
        res.json({ success: true, data: perms });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === المنتجات ===
app.get('/api/products', (req, res) => {
    try { res.json({ success: true, data: db.getAllProducts() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/products/:id', (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
        res.json({ success: true, data: product });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/products', requireAuth, requirePermission('manage_products'), upload.single('image'), (req, res) => {
    try {
        const { name, description, price, category_id, is_active, sku, barcode, brand, tags, stock, minStock, image_url } = req.body;
        if (!name || !price) return res.status(400).json({ success: false, error: 'الاسم والسعر مطلوبان' });
        // Use uploaded file if present, otherwise use image_url from form
        const finalImageUrl = req.file ? '/uploads/' + req.file.filename : (image_url || '');
        const parsedTags = typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : (tags || []);
        const result = db.createProduct(name, description, parseFloat(price), finalImageUrl, parseInt(category_id), is_active !== undefined ? parseInt(is_active) : 1, { sku, barcode, brand, tags: parsedTags, stock: parseInt(stock) || 0, minStock: parseInt(minStock) || 0 });
        res.json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/products/:id', requireAuth, requirePermission('manage_products'), upload.single('image'), (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
        const updates = { ...req.body };
        // If a new file was uploaded, overwrite image_url
        if (req.file) {
            updates.image_url = '/uploads/' + req.file.filename;
        } else if (req.body.image_url === '') {
            // Clear image if explicitly set to empty string
            updates.image_url = '';
        }
        if (updates.price) updates.price = parseFloat(updates.price);
        if (updates.category_id) updates.category_id = parseInt(updates.category_id);
        if (updates.is_active !== undefined) updates.is_active = parseInt(updates.is_active);
        if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);
        if (updates.minStock !== undefined) updates.minStock = parseInt(updates.minStock);
        if (updates.tags && typeof updates.tags === 'string') updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
        db.updateProduct(req.params.id, updates);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/products/:id', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
        db.deleteProduct(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/products/:id/toggle', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const product = db.getProductById(req.params.id);
        if (!product) return res.status(404).json({ success: false, error: 'المنتج غير موجود' });
        db.toggleProductStatus(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/products/:id/stock', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const { quantity, type } = req.body;
        db.updateProductStock(req.params.id, parseInt(quantity), type || 'add');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === التصنيفات ===
app.get('/api/categories', (req, res) => {
    try { res.json({ success: true, data: db.getAllCategories() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/categories', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ success: false, error: 'اسم التصنيف مطلوب' });
        const result = db.createCategory(name, description || '');
        res.json({ success: true, data: { id: result.lastInsertRowid } });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/categories/:id', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const { name, description } = req.body;
        const category = db.getCategoryById(req.params.id);
        if (!category) return res.status(404).json({ success: false, error: 'التصنيف غير موجود' });
        db.updateCategory(req.params.id, name || category.name, description !== undefined ? description : category.description);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/categories/:id', requireAuth, requirePermission('manage_products'), (req, res) => {
    try {
        const category = db.getCategoryById(req.params.id);
        if (!category) return res.status(404).json({ success: false, error: 'التصنيف غير موجود' });
        db.deleteCategory(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الطلبات ===
app.get('/api/orders', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try { res.json({ success: true, data: db.getAllOrders() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// إنشاء طلب جديد من المتجر
app.post('/api/orders', (req, res) => {
    try {
        const { userId, username, products, totalPrice } = req.body;
        if (!products || !totalPrice) return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
        
        // التحقق من حزم خاصة (مرة واحدة لكل مستخدم)
        if (userId && userId !== 'web_user') {
            const prodsArray = typeof products === 'string' ? JSON.parse(products) : products;
            const restricted = [];
            if (Array.isArray(prodsArray)) {
                prodsArray.forEach(p => {
                    const product = db.getProductById(p.id || p.product_id);
                    if (product && db.isSpecialPackCategory(product.category_id) && db.hasUserPurchasedProduct(userId, product.id)) {
                        restricted.push(product.name);
                    }
                });
            }
            if (restricted.length > 0) {
                return res.status(400).json({ success: false, error: `لا يمكن شراء: ${restricted.join('، ')} - هذه حزمة خاصة ولا يمكن شراؤها إلا مرة واحدة` });
            }
        }
        
        const result = db.createOrder(
            userId || 'web_user',
            username || 'عميل ويب',
            products,
            parseFloat(totalPrice),
            null
        );
        
        // إشعار للبوت بإنشاء طلب جديد
        if (global.discordClient) {
            createDiscordTicket(global.discordClient, result.lastInsertRowid, userId || 'web_user', username || 'عميل ويب', products, totalPrice);
        }
        
        res.json({ success: true, orderId: result.lastInsertRowid });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/orders/:id', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try {
        const order = db.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
        res.json({ success: true, data: order });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/orders/:id/status', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try {
        const { status, note } = req.body;
        const order = db.getOrderById(req.params.id);
        if (!order) return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
        db.updateOrderStatus(req.params.id, status, note || '');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/orders/search/:query', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try { res.json({ success: true, data: db.searchOrders(req.params.query) }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === حزم خاصة (منتجات المستخدم) ===
app.get('/api/user/:userId/purchased', (req, res) => {
    try {
        const specialIds = db.getSpecialPackProductIds();
        const purchasedIds = db.getUserPurchasedProductIds(req.params.userId);
        // فقط المنتجات التي هي من حزم خاصة واشتراها المستخدم
        const restricted = purchasedIds.filter(id => specialIds.includes(id));
        res.json({ success: true, data: restricted });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === العملاء ===
app.get('/api/customers', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try { res.json({ success: true, data: db.getCustomers() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/customers/:id/block', requireAuth, requirePermission('manage_orders'), (req, res) => {
    try {
        const blocked = db.blockCustomer(req.params.id);
        res.json({ success: true, blocked });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === المخزون ===
app.get('/api/inventory/low', requireAuth, requirePermission('manage_products'), (req, res) => {
    try { res.json({ success: true, data: db.getLowStockProducts() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الإعدادات ===
app.get('/api/settings', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try { res.json({ success: true, data: db.getSettings() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.put('/api/settings/:section', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try {
        db.updateSettings(req.params.section, req.body);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الصلاحيات ===
app.get('/api/permissions', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try { res.json({ success: true, data: db.getAllRolePermissions() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/permissions', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try {
        const { roleId, permissions } = req.body;
        if (!roleId || !permissions) return res.status(400).json({ success: false, error: 'roleId و permissions مطلوبان' });
        db.setRolePermissions(roleId, permissions);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.delete('/api/permissions/:roleId', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try {
        db.deleteRolePermissions(req.params.roleId);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الإحصائيات ===
app.get('/api/stats', requireAuth, requirePermission('view_stats'), (req, res) => {
    try {
        res.json({ success: true, data: {
            orderCount: db.getOrderCount(),
            totalSales: db.getTotalSales(),
            productCount: db.getProductCount(),
            customerCount: db.getCustomerCount(),
            mostSold: db.getMostSoldProducts(5)
        }});
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الرسوم البيانية ===
app.get('/api/charts/sales', requireAuth, requirePermission('view_stats'), (req, res) => {
    try { res.json({ success: true, data: db.getSalesChartData() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/charts/monthly', requireAuth, requirePermission('view_stats'), (req, res) => {
    try { res.json({ success: true, data: db.getMonthlySales() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === سجل النشاطات ===
app.get('/api/activities', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try { res.json({ success: true, data: db.getActivities(100) }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === الإشعارات ===
app.get('/api/notifications', (req, res) => {
    try { res.json({ success: true, data: db.getNotifications() }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.patch('/api/notifications/:id/read', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try {
        db.markNotificationRead(parseInt(req.params.id));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/notifications/read-all', requireAuth, requirePermission('manage_settings'), (req, res) => {
    try {
        db.markAllNotificationsRead();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// === صفحات الويب ===
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/store', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'store.html'));
});

// دالة لإنشاء تذكرة ديسكورد من طلب ويب
async function createDiscordTicket(client, orderId, userId, username, products, totalPrice) {
    try {
        const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
        
        const ticketCategoryId = process.env.TICKET_CATEGORY_ID;
        const guild = client.guilds.cache.get(process.env.GUILD_ID);
        
        if (!guild || !ticketCategoryId) {
            console.log('⚠️ لا يمكن إنشاء التذكرة: السيرفر أو التصنيف غير موجود');
            return;
        }

        // محاولة إعادة استخدام تذكرة مفتوحة لنفس المستخدم
        let ticketChannel = await findExistingTicketChannel(guild, userId);
        let isNewChannel = false;

        if (!ticketChannel) {
            ticketChannel = await guild.channels.create({
                name: `store-${username}`,
                type: ChannelType.GuildText,
                parent: ticketCategoryId,
                permissionOverwrites: [
                    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: process.env.ADMIN_ROLE_ID || guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: process.env.MANAGER_ROLE_ID || guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                    { id: process.env.STAFF_ROLE_ID || guild.roles.everyone.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
                ],
            });
            isNewChannel = true;
        }

        // تحليل المنتجات
        let productsList = '';
        let total = 0;
        let firstImage = null;
        const productsArray = typeof products === 'string' ? JSON.parse(products) : products;
        
        if (Array.isArray(productsArray)) {
            productsArray.forEach(p => {
                const img = p.image || p.image_url;
                productsList += `📦 **${p.name}** - $${(p.price || 0).toFixed(2)}`;
                if (img) productsList += `\n> 🖼️ [[الصورة]](${img.startsWith('http') ? img : `http://localhost:${PORT}${img}`})`;
                productsList += '\n';
                if (!firstImage && img) firstImage = img;
                total += p.price || 0;
            });
        } else {
            productsList = JSON.stringify(products);
            total = totalPrice;
        }

        // إنشاء Embed
        const ticketEmbed = new EmbedBuilder()
            .setColor(0x7c3aed)
            .setTitle(`🎫 طلب جديد #${orderId}`)
            .setDescription(`**العميل:** <@${userId}>\n**المصادر:** ويب (المتجر)\n**تاريخ الطلب:** <t:${Math.floor(Date.now() / 1000)}:R>\n\n---\n**المنتجات:**\n${productsList}\n---\n💰 **المجموع:** $${total.toFixed(2)}\n\n⏳ **الحالة:** قيد المراجعة`)
            .setFooter({ text: 'طلب من المتجر الإلكتروني' })
            .setTimestamp();
        
        if (firstImage && firstImage.startsWith('http')) {
            ticketEmbed.setThumbnail(firstImage);
        }

        // الأزرار
        const buttons = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`confirmOrder_${orderId}`).setLabel('تأكيد الطلب').setEmoji('✅').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`cancelOrder_${orderId}`).setLabel('إلغاء الطلب').setEmoji('❌').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`closeTicket_${orderId}`).setLabel('إغلاق التذكرة').setEmoji('🔒').setStyle(ButtonStyle.Secondary),
        );

        // إرسال التذكرة
        if (!isNewChannel) {
            await ticketChannel.send({ content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━` });
        }
        await ticketChannel.send({
            content: `<@&${process.env.ADMIN_ROLE_ID || ''}> <@&${process.env.MANAGER_ROLE_ID || ''}>`,
            embeds: [ticketEmbed],
            components: [buttons]
        });

        // تحديث رقم التذكرة في قاعدة البيانات
        db.updateOrderStatus(orderId, 'pending');
        db.updateOrderTicketChannel(orderId, ticketChannel.id);

        console.log(`✅ تم ${isNewChannel ? 'إنشاء' : 'إعادة استخدام'} تذكرة طلب #${orderId} من المتجر`);

    } catch (error) {
        console.error('خطأ في إنشاء التذكرة:', error);
    }
}

function startWebServer() {
    app.listen(PORT, () => {
        console.log(`🌐 لوحة التحكم: http://localhost:${PORT}`);
        console.log(`🛒 صفحة المتجر: http://localhost:${PORT}/store`);
    });
}

module.exports = { startWebServer };

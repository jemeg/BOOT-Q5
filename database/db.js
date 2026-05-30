const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'store.json');

const defaultData = {
    categories: [],
    products: [],
    orders: [],
    customers: [],
    inventory: [],
    activities: [],
    notifications: [],
    settings: {
        store: {
            name: 'متجرنا',
            logo: '',
            email: '',
            phone: '',
            currency: 'USD',
            language: 'ar',
            timezone: 'Asia/Riyadh'
        },
        orders: {
            autoConfirm: false,
            minOrder: 0,
            defaultStatus: 'pending'
        },
        notifications: {
            discordWebhook: '',
            emailEnabled: false,
            telegramBot: ''
        },
        security: {
            twoFactor: false,
            loginLog: []
        }
    },
    rolePermissions: {},
    nextIds: {
        categories: 1,
        products: 1,
        orders: 1,
        customers: 1,
        activities: 1,
        notifications: 1
    }
};

function readData() {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('خطأ في قراءة قاعدة البيانات:', error);
    }
    return JSON.parse(JSON.stringify(defaultData));
}

function writeData(data) {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('خطأ في حفظ قاعدة البيانات:', error);
        return false;
    }
}

function addActivity(action, details, userId = 'System') {
    const data = readData();
    if (!data.activities) data.activities = [];
    data.activities.unshift({
        id: data.nextIds.activities++,
        action,
        details,
        userId,
        timestamp: new Date().toISOString()
    });
    if (data.activities.length > 100) data.activities = data.activities.slice(0, 100);
    writeData(data);
}

function addNotification(type, title, message) {
    const data = readData();
    if (!data.notifications) data.notifications = [];
    data.notifications.unshift({
        id: data.nextIds.notifications++,
        type,
        title,
        message,
        read: false,
        timestamp: new Date().toISOString()
    });
    if (data.notifications.length > 50) data.notifications = data.notifications.slice(0, 50);
    writeData(data);
}

module.exports = {
    initialize() {
        if (!fs.existsSync(DB_PATH)) {
            writeData(defaultData);
            console.log('✅ تم إنشاء قاعدة البيانات بنجاح');
        } else {
            const data = readData();
            if (!data.activities) data.activities = [];
            if (!data.notifications) data.notifications = [];
            if (!data.customers) data.customers = [];
            if (!data.settings) data.settings = defaultData.settings;
            if (!data.settings.store) data.settings.store = defaultData.settings.store;
            if (!data.settings.orders) data.settings.orders = defaultData.settings.orders;
            if (!data.settings.notifications) data.settings.notifications = defaultData.settings.notifications;
            if (!data.settings.security) data.settings.security = defaultData.settings.security;
            writeData(data);
            console.log('✅ قاعدة البيانات موجودة بالفعل');
        }
    },

    // === المنتجات ===
    createProduct(name, description, price, image_url, category_id, is_active = 1, extra = {}) {
        const data = readData();
        const newProduct = {
            id: data.nextIds.products++,
            name,
            description,
            price: parseFloat(price),
            image_url,
            images: extra.images || [],
            category_id: parseInt(category_id),
            is_active: parseInt(is_active),
            sku: extra.sku || '',
            barcode: extra.barcode || '',
            brand: extra.brand || '',
            tags: extra.tags || [],
            stock: extra.stock || 0,
            minStock: extra.minStock || 0,
            reservedStock: extra.reservedStock || 0,
            salesCount: 0,
            viewsCount: 0,
            earnings: 0,
            created_at: new Date().toISOString()
        };
        data.products.push(newProduct);
        writeData(data);
        addActivity('product_added', `تم إضافة منتج: ${name}`);
        return { lastInsertRowid: newProduct.id };
    },

    getAllProducts() {
        const data = readData();
        return data.products.map(product => {
            const category = data.categories.find(c => c.id === product.category_id);
            return { ...product, category_name: category ? category.name : null };
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getActiveProducts() {
        const data = readData();
        return data.products
            .filter(p => p.is_active === 1)
            .map(product => {
                const category = data.categories.find(c => c.id === product.category_id);
                return { ...product, category_name: category ? category.name : null };
            });
    },

    getProductById(id) {
        const data = readData();
        const product = data.products.find(p => p.id === parseInt(id));
        if (product) {
            const category = data.categories.find(c => c.id === product.category_id);
            return { ...product, category_name: category ? category.name : null };
        }
        return null;
    },

    updateProduct(id, updates) {
        const data = readData();
        const index = data.products.findIndex(p => p.id === parseInt(id));
        if (index !== -1) {
            data.products[index] = { ...data.products[index], ...updates };
            writeData(data);
            addActivity('product_updated', `تم تعديل منتج: ${data.products[index].name}`);
            return true;
        }
        return false;
    },

    deleteProduct(id) {
        const data = readData();
        const product = data.products.find(p => p.id === parseInt(id));
        data.products = data.products.filter(p => p.id !== parseInt(id));
        writeData(data);
        if (product) addActivity('product_deleted', `تم حذف منتج: ${product.name}`);
        return true;
    },

    toggleProductStatus(id) {
        const data = readData();
        const product = data.products.find(p => p.id === parseInt(id));
        if (product) {
            product.is_active = product.is_active === 1 ? 0 : 1;
            writeData(data);
            addActivity('product_toggled', `تم ${product.is_active ? 'تفعيل' : 'تعطيل'} منتج: ${product.name}`);
            return true;
        }
        return false;
    },

    updateProductStock(id, quantity, type = 'add') {
        const data = readData();
        const product = data.products.find(p => p.id === parseInt(id));
        if (product) {
            if (type === 'add') {
                product.stock = (product.stock || 0) + quantity;
            } else {
                product.stock = Math.max(0, (product.stock || 0) - quantity);
            }
            writeData(data);
            addActivity('stock_updated', `تم تحديث مخزون ${product.name}: ${type === 'add' ? '+' : '-'}${quantity}`);
            return true;
        }
        return false;
    },

    // === حزم خاصة (مرة واحدة لكل مستخدم) ===
    isSpecialPackCategory(categoryId) {
        const data = readData();
        const category = data.categories.find(c => c.id === parseInt(categoryId));
        return category && category.name === 'حزم خاصة';
    },

    getSpecialPackProductIds() {
        const data = readData();
        const specialCat = data.categories.find(c => c.name === 'حزم خاصة');
        if (!specialCat) return [];
        return data.products.filter(p => p.category_id === specialCat.id).map(p => p.id);
    },

    hasUserPurchasedProduct(userId, productId) {
        const data = readData();
        const purchasedStatuses = ['confirmed', 'completed', 'processing', 'received'];
        const pid = parseInt(productId);
        return data.orders.some(o => {
            if (String(o.user_id) !== String(userId)) return false;
            if (!purchasedStatuses.includes(o.status)) return false;
            try {
                const prods = typeof o.products === 'string' ? JSON.parse(o.products) : o.products;
                return Array.isArray(prods) && prods.some(p => parseInt(p.id || p.product_id) === pid);
            } catch (e) { return false; }
        });
    },

    getUserPurchasedProductIds(userId) {
        const data = readData();
        const purchasedStatuses = ['confirmed', 'completed', 'processing', 'received'];
        const purchasedIds = new Set();
        data.orders.forEach(o => {
            if (String(o.user_id) !== String(userId)) return;
            if (!purchasedStatuses.includes(o.status)) return;
            try {
                const prods = typeof o.products === 'string' ? JSON.parse(o.products) : o.products;
                if (Array.isArray(prods)) prods.forEach(p => purchasedIds.add(parseInt(p.id || p.product_id)));
            } catch (e) {}
        });
        return [...purchasedIds];
    },

    // === التصنيفات ===
    createCategory(name, description = '') {
        const data = readData();
        const newCategory = {
            id: data.nextIds.categories++,
            name,
            description,
            position: data.categories.length,
            created_at: new Date().toISOString()
        };
        data.categories.push(newCategory);
        writeData(data);
        addActivity('category_added', `تم إضافة تصنيف: ${name}`);
        return { lastInsertRowid: newCategory.id };
    },

    getAllCategories() {
        const data = readData();
        return data.categories.sort((a, b) => a.position - b.position);
    },

    getCategoryById(id) {
        const data = readData();
        return data.categories.find(c => c.id === parseInt(id));
    },

    updateCategory(id, name, description) {
        const data = readData();
        const index = data.categories.findIndex(c => c.id === parseInt(id));
        if (index !== -1) {
            data.categories[index].name = name;
            data.categories[index].description = description;
            writeData(data);
            addActivity('category_updated', `تم تعديل تصنيف: ${name}`);
            return true;
        }
        return false;
    },

    deleteCategory(id) {
        const data = readData();
        const category = data.categories.find(c => c.id === parseInt(id));
        data.categories = data.categories.filter(c => c.id !== parseInt(id));
        data.products = data.products.filter(p => p.category_id !== parseInt(id));
        writeData(data);
        if (category) addActivity('category_deleted', `تم حذف تصنيف: ${category.name}`);
        return true;
    },

    // === الطلبات ===
    createOrder(userId, username, products, totalPrice, ticketChannelId) {
        const data = readData();
        const newOrder = {
            id: data.nextIds.orders++,
            user_id: userId,
            username,
            products: typeof products === 'string' ? products : JSON.stringify(products),
            total_price: parseFloat(totalPrice),
            status: data.settings?.orders?.defaultStatus || 'pending',
            ticket_channel_id: ticketChannelId,
            notes: '',
            history: [{ status: data.settings?.orders?.defaultStatus || 'pending', timestamp: new Date().toISOString(), by: 'System' }],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        data.orders.push(newOrder);
        
        writeData(data);
        addActivity('order_created', `طلب جديد #${newOrder.id} من ${username} - $${totalPrice}`);
        addNotification('order', 'طلب جديد', `طلب جديد #${newOrder.id} من ${username}`);
        return { lastInsertRowid: newOrder.id };
    },

    getAllOrders() {
        const data = readData();
        return data.orders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getOrdersByStatus(status) {
        const data = readData();
        return data.orders.filter(o => o.status === status).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getOrderById(id) {
        const data = readData();
        return data.orders.find(o => o.id === parseInt(id));
    },

    updateOrderTicketChannel(id, channelId) {
        const data = readData();
        const order = data.orders.find(o => o.id === parseInt(id));
        if (order) {
            order.ticket_channel_id = channelId;
            writeData(data);
            return true;
        }
        return false;
    },

    updateOrderStatus(id, status, note = '', by = 'Admin') {
        const data = readData();
        const order = data.orders.find(o => o.id === parseInt(id));
        if (order) {
            order.status = status;
            order.updated_at = new Date().toISOString();
            if (!order.history) order.history = [];
            order.history.push({ status, timestamp: new Date().toISOString(), by, note });
            if (note) order.notes = (order.notes || '') + `\n[${new Date().toLocaleString('ar')}] ${note}`;
            
            // حساب المبيعات وخصم المخزون عند تأكيد الطلب
            if (status === 'confirmed' || status === 'completed') {
                try {
                    const prods = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
                    prods.forEach(p => {
                        const product = data.products.find(prod => prod.id === (p.id || p.product_id));
                        if (product) {
                            product.salesCount = (product.salesCount || 0) + 1;
                            product.earnings = (product.earnings || 0) + (p.price || 0);
                            product.stock = Math.max(0, (product.stock || 0) - 1);
                        }
                    });
                } catch (e) {}
            } else if (status === 'cancelled' || status === 'refunded') {
                // تراجع المبيعات والمخزون إذا تم إلغاء طلب كان confirmed
                try {
                    const previousStatus = order.history.length > 1 ? order.history[order.history.length - 2].status : null;
                    if (previousStatus === 'confirmed' || previousStatus === 'completed') {
                        const prods = typeof order.products === 'string' ? JSON.parse(order.products) : order.products;
                        prods.forEach(p => {
                            const product = data.products.find(prod => prod.id === (p.id || p.product_id));
                            if (product) {
                                product.salesCount = Math.max(0, (product.salesCount || 0) - 1);
                                product.earnings = Math.max(0, (product.earnings || 0) - (p.price || 0));
                                product.stock = (product.stock || 0) + 1;
                            }
                        });
                    }
                } catch (e) {}
            }
            
            writeData(data);
            addActivity('order_updated', `تحديث حالة الطلب #${id} إلى ${status}`);
            return true;
        }
        return false;
    },

    getOrdersByUser(userId) {
        const data = readData();
        return data.orders.filter(o => String(o.user_id) === String(userId)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    },

    getOrdersByChannel(channelId) {
        const data = readData();
        return data.orders.filter(o => o.ticket_channel_id === channelId);
    },

    searchOrders(query) {
        const data = readData();
        const q = query.toLowerCase();
        return data.orders.filter(o => 
            String(o.id).includes(q) ||
            String(o.username).toLowerCase().includes(q) ||
            String(o.user_id).includes(q)
        );
    },

    // === العملاء ===
    getCustomers() {
        const data = readData();
        const customerMap = {};
        data.orders.forEach(order => {
            if (!customerMap[order.user_id]) {
                customerMap[order.user_id] = {
                    id: order.user_id,
                    username: order.username,
                    orderCount: 0,
                    totalSpent: 0,
                    lastOrder: null,
                    blocked: false,
                    notes: ''
                };
            }
            customerMap[order.user_id].orderCount++;
            customerMap[order.user_id].totalSpent += order.total_price;
            if (!customerMap[order.user_id].lastOrder || new Date(order.created_at) > new Date(customerMap[order.user_id].lastOrder)) {
                customerMap[order.user_id].lastOrder = order.created_at;
            }
        });
        return Object.values(customerMap).sort((a, b) => b.totalSpent - a.totalSpent);
    },

    blockCustomer(userId) {
        const data = readData();
        if (!data.customers) data.customers = [];
        let customer = data.customers.find(c => c.id === userId);
        if (!customer) {
            customer = { id: userId, blocked: false, notes: '' };
            data.customers.push(customer);
        }
        customer.blocked = !customer.blocked;
        writeData(data);
        return customer.blocked;
    },

    // === المخزون ===
    getLowStockProducts() {
        const data = readData();
        return data.products.filter(p => p.stock <= (p.minStock || 0) && p.is_active === 1);
    },

    // === الإعدادات ===
    getSettings() {
        const data = readData();
        return data.settings || defaultData.settings;
    },

    updateSettings(section, settings) {
        const data = readData();
        if (!data.settings) data.settings = defaultData.settings;
        data.settings[section] = { ...data.settings[section], ...settings };
        writeData(data);
        addActivity('settings_updated', `تم تحديث إعدادات ${section}`);
        return true;
    },

    // === الصلاحيات ===
    setRolePermissions(roleId, permissions) {
        const data = readData();
        if (!data.rolePermissions) data.rolePermissions = {};
        data.rolePermissions[roleId] = { roleId, permissions, updatedAt: new Date().toISOString() };
        writeData(data);
        addActivity('permissions_updated', `تحديث صلاحيات الرتبة: ${roleId}`);
        return true;
    },

    getRolePermissions(roleId) {
        const data = readData();
        return data.rolePermissions?.[roleId] || null;
    },

    getAllRolePermissions() {
        const data = readData();
        return data.rolePermissions || {};
    },

    deleteRolePermissions(roleId) {
        const data = readData();
        if (data.rolePermissions) {
            delete data.rolePermissions[roleId];
            writeData(data);
        }
        return true;
    },

    // === الإحصائيات ===
    getOrderCount() { return readData().orders.length; },
    getTotalSales() { return readData().orders.filter(o => o.status === 'confirmed' || o.status === 'completed').reduce((s, o) => s + o.total_price, 0); },
    getProductCount() { return readData().products.length; },
    getCustomerCount() { return new Set(readData().orders.map(o => o.user_id)).size; },
    getMostSoldProducts(limit = 5) {
        const data = readData();
        return data.products.sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, limit).map(p => ({ name: p.name, total_sold: p.salesCount || 0 }));
    },

    // === سجل النشاطات ===
    getActivities(limit = 50) {
        const data = readData();
        return (data.activities || []).slice(0, limit);
    },

    // === الإشعارات ===
    getNotifications() { return readData().notifications || []; },
    markNotificationRead(id) {
        const data = readData();
        const notif = data.notifications?.find(n => n.id === id);
        if (notif) { notif.read = true; writeData(data); }
        return true;
    },
    markAllNotificationsRead() {
        const data = readData();
        if (data.notifications) data.notifications.forEach(n => n.read = true);
        writeData(data);
        return true;
    },

    // === الرسم البياني ===
    getSalesChartData() {
        const data = readData();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const daySales = data.orders
                .filter(o => o.created_at.startsWith(dateStr) && (o.status === 'confirmed' || o.status === 'completed'))
                .reduce((s, o) => s + o.total_price, 0);
            last7Days.push({ date: dateStr, label: date.toLocaleDateString('ar', { weekday: 'short' }), sales: daySales });
        }
        return last7Days;
    },

    getMonthlySales() {
        const data = readData();
        const months = {};
        data.orders.forEach(o => {
            if (o.status !== 'confirmed' && o.status !== 'completed') return;
            const month = o.created_at.substring(0, 7);
            months[month] = (months[month] || 0) + o.total_price;
        });
        return Object.entries(months).slice(-6).map(([month, sales]) => ({ month, sales }));
    }
};

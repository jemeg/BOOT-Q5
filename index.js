const { Client, GatewayIntentBits, Collection, ActivityType, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const db = require('./database/db');
const { startWebServer } = require('./web');

// إنشاء عميل البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
    ],
});

// تخزين العميل عالمياً للاستخدام في الويب
global.discordClient = client;

// تجميع الأوامر
client.commands = new Collection();
const commands = [];

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
}

// تحميل الأحداث
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// التعامل مع التفاعلات
client.on('interactionCreate', async interaction => {
    try {
        // التعامل مع أوامر الشلت
        if (interaction.isChatInputCommand()) {
            const command = client.commands.get(interaction.commandName);
            if (!command) return;
            
            await command.execute(interaction, client);
        }
        
        // التعامل مع الأزرار
        if (interaction.isButton()) {
            const buttonId = interaction.customId.split('_')[0];
            
            // خريطة الأزرار إلى ملفاتها
            const buttonMap = {
                'viewProducts': 'viewProducts',
                'viewCart': 'viewCart',
                'confirmOrder': 'confirmOrder',
                'cancelOrder': 'cancelOrder',
                'receiveOrder': 'receiveOrder',
                'closeTicket': 'closeTicket',
                'admin': 'adminPanel',
                'admin_products': 'adminProducts',
                'admin_categories': 'adminCategories',
                'admin_orders': 'adminOrders',
                'admin_stats': 'adminStats',
                'addProduct': 'addProduct',
                'editProduct': 'editProduct',
                'deleteProduct': 'deleteProduct',
                'toggleProduct': 'toggleProduct',
                'addCategory': 'addCategory',
                'editCategory': 'editCategory',
                'deleteCategory': 'deleteCategory',
                'confirmDeleteProduct': 'confirmDeleteProduct',
                'confirmDeleteCategory': 'confirmDeleteCategory',
                'viewAllOrders': 'viewAllOrders',
                'viewPendingOrders': 'viewPendingOrders',
                'viewCompletedOrders': 'viewCompletedOrders',
                'searchOrder': 'searchOrder',
                'cancelDelete': 'cancelDelete',
            };
            
            const buttonFile = buttonMap[interaction.customId] || buttonMap[buttonId];
            
            if (buttonFile) {
                const buttonPath = path.join(__dirname, 'buttons', `${buttonFile}.js`);
                if (fs.existsSync(buttonPath)) {
                    const button = require(buttonPath);
                    await button.execute(interaction, client);
                }
            }
        }
        
        // التعامل مع القوائم المنسدلة
        if (interaction.isStringSelectMenu()) {
            const selectId = interaction.customId.split('_')[0];
            
            const selectMap = {
                'productSelect': 'productSelect',
                'editCategorySelect': 'editCategorySelect',
                'deleteCategorySelect': 'deleteCategorySelect',
                'editProductSelect': 'editProductSelect',
                'deleteProductSelect': 'deleteProductSelect',
                'toggleProductSelect': 'toggleProductSelect',
                'adminProducts': 'adminProducts',
            };
            
            const selectFile = selectMap[interaction.customId] || selectMap[selectId];
            
            if (selectFile) {
                const selectPath = path.join(__dirname, 'selectMenus', `${selectFile}.js`);
                if (fs.existsSync(selectPath)) {
                    const select = require(selectPath);
                    await select.execute(interaction, client);
                }
            }
        }
        
        // التعامل مع المودال
        if (interaction.isModalSubmit()) {
            const modalId = interaction.customId.split('_')[0];
            
            const modalMap = {
                'addProductModal': 'addProductModal',
                'editProductModal': 'editProductModal',
                'addCategoryModal': 'addCategoryModal',
                'editCategoryModal': 'editCategoryModal',
                'searchOrderModal': 'searchOrderModal',
            };
            
            const modalFile = modalMap[interaction.customId] || modalMap[modalId];
            
            if (modalFile) {
                const modalPath = path.join(__dirname, 'modals', `${modalFile}.js`);
                if (fs.existsSync(modalPath)) {
                    const modal = require(modalPath);
                    await modal.execute(interaction, client);
                }
            }
        }
        
    } catch (error) {
        console.error('خطأ في التعامل مع التفاعل:', error);
        
        // محاولة الرد فقط إذا لم يتم الرد بالفعل
        try {
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ 
                    content: '❌ حدث خطأ أثناء تنفيذ هذا الإجراء.', 
                    flags: 64 
                });
            }
        } catch (e) {
            // تجاهل الأخطاء في محاولة الرد الثانية
        }
    }
});

// تسجيل الدخول
client.login(process.env.BOT_TOKEN);

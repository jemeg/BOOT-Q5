const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    // زر تفيل/تعطيل منتج
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية لتعديل حالة المنتجات.',
                    }],
                    flags: 64
                });
            }

            // جلب المنتجات
            const products = db.getAllProducts();
            
            if (products.length === 0) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} لا توجد منتجات`,
                        description: 'لا توجد منتجات لتغيير حالتها.',
                    }],
                    flags: 64
                });
            }

            // إنشاء قائمة اختيار المنتجات
            const options = products.map(product => ({
                label: product.name,
                description: `الحالة: ${product.is_active ? '🟢 مفعل' : '🔴 معطل'}`,
                value: product.id.toString(),
                emoji: product.is_active ? '🟢' : '🔴',
            }));

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('toggleProductSelect')
                    .setPlaceholder('اختر المنتج لتغيير حالته')
                    .addOptions(options.slice(0, 25))
            );

            // إرسال القائمة
            await interaction.reply({
                components: [selectMenu],
                flags: 64
            });

            console.log(`📦 فتح قائمة تغيير حالة المنتج بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر تغيير حالة المنتج:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح قائمة تغيير الحالة.',
                }],
                flags: 64
            });
        }
    }
};



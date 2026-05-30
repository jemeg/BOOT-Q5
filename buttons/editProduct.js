const { StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    // زر تعديل منتج
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية لتعديل المنتجات.',
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
                        description: 'لا توجد منتجات لتعديلها.',
                    }],
                    flags: 64
                });
            }

            // إنشاء قائمة اختيار المنتجات
            const options = products.map(product => ({
                label: product.name,
                description: `$${product.price.toFixed(2)} - ${product.category_name || 'غير محدد'}`,
                value: product.id.toString(),
                emoji: '📦',
            }));

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('editProductSelect')
                    .setPlaceholder('اختر المنتج المراد تعديله')
                    .addOptions(options.slice(0, 25))
            );

            // إرسال القائمة
            await interaction.reply({
                components: [selectMenu],
                flags: 64
            });

            console.log(`📦 فتح قائمة تعديل المنتج بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر تعديل منتج:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح قائمة التعديل.',
                }],
                flags: 64
            });
        }
    }
};



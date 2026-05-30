const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    // زر تعديل تصنيف
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية لتعديل التصنيفات.',
                    }],
                    flags: 64
                });
            }

            // جلب التصنيفات
            const categories = db.getAllCategories();
            
            if (categories.length === 0) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} لا توجد تصنيفات`,
                        description: 'لا توجد تصنيفات لتعديلها.',
                    }],
                    flags: 64
                });
            }

            // إنشاء قائمة اختيار التصنيفات
            const options = categories.map(category => ({
                label: category.name,
                description: category.description || 'تصنيف',
                value: category.id.toString(),
                emoji: '📂',
            }));

            const selectMenu = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('editCategorySelect')
                    .setPlaceholder('اختر التصنيف المراد تعديله')
                    .addOptions(options.slice(0, 25))
            );

            // إرسال القائمة
            await interaction.reply({
                components: [selectMenu],
                flags: 64
            });

            console.log(`📂 فتح قائمة تعديل التصنيف بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر تعديل تصنيف:', error);
            
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



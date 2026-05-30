const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    // قائمة اختيار تعديل التصنيف
    async execute(interaction, client) {
        try {
            // جلب التصنيف المحدد
            const categoryId = parseInt(interaction.values[0]);
            const category = db.getCategoryById(categoryId);
            
            if (!category) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} التصنيف غير موجود`,
                        description: 'لم يتم العثور على التصنيف المحدد.',
                    }],
                    flags: 64
                });
            }

            // إنشاء المودال
            const modal = new ModalBuilder()
                .setCustomId(`editCategoryModal_${categoryId}`)
                .setTitle(`تعديل التصنيف: ${category.name}`);

            // حقل اسم التصنيف
            const nameInput = new TextInputBuilder()
                .setCustomId('categoryName')
                .setLabel('اسم التصنيف')
                .setValue(category.name)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل وصف التصنيف
            const descriptionInput = new TextInputBuilder()
                .setCustomId('categoryDescription')
                .setLabel('وصف التصنيف')
                .setValue(category.description || '')
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph);

            // إضافة الحقول إلى المودال
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(descriptionInput)
            );

            // عرض المودال
            await interaction.showModal(modal);

            console.log(`📂 فتح مودال تعديل التصنيف ${category.name} بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في قائمة تعديل التصنيف:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح نموذج التعديل.',
                }],
                flags: 64
            });
        }
    }
};



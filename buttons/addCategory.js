const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');

module.exports = {
    // زر إضافة تصنيف
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية لإضافة التصنيفات.',
                    }],
                    flags: 64
                });
            }

            // إنشاء المودال
            const modal = new ModalBuilder()
                .setCustomId('addCategoryModal')
                .setTitle('إضافة تصنيف جديد');

            // حقل اسم التصنيف
            const nameInput = new TextInputBuilder()
                .setCustomId('categoryName')
                .setLabel('اسم التصنيف')
                .setPlaceholder('مثال: Discord')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل وصف التصنيف
            const descriptionInput = new TextInputBuilder()
                .setCustomId('categoryDescription')
                .setLabel('وصف التصنيف')
                .setPlaceholder('وصف مختصر للتصنيف')
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph);

            // إضافة الحقول إلى المودال
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(descriptionInput)
            );

            // عرض المودال
            await interaction.showModal(modal);

            console.log(`📂 فتح مودال إضافة تصنيف بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر إضافة تصنيف:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح نموذج الإضافة.',
                }],
                flags: 64
            });
        }
    }
};



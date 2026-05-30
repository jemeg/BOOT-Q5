const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const categoryId = parseInt(interaction.customId.split('_')[1]);
            const name = interaction.fields.getTextInputValue('categoryName');
            const description = interaction.fields.getTextInputValue('categoryDescription') || '';

            const existingCategory = db.getCategoryById(categoryId);
            if (!existingCategory) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} التصنيف غير موجود`)
                    .setDescription('التصنيف المحدد غير موجود.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            db.updateCategory(categoryId, name, description);

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تم تعديل التصنيف بنجاح`)
                .setDescription(`**${Icons.CATEGORY} اسم التصنيف:** ${name}\n**${Icons.INFO} الوصف:** ${description || 'لا يوجد وصف'}\n\n**تم تعديل التصنيف بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في مودال تعديل تصنيف:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء تعديل التصنيف.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

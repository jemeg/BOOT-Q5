const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const name = interaction.fields.getTextInputValue('categoryName');
            const description = interaction.fields.getTextInputValue('categoryDescription') || '';

            const existingCategories = db.getAllCategories();
            const nameExists = existingCategories.some(
                cat => cat.name.toLowerCase() === name.toLowerCase()
            );

            if (nameExists) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} التصنيف موجود`)
                    .setDescription('يوجد تصنيف بنفس الاسم بالفعل.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            db.createCategory(name, description);

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تمت إضافة التصنيف بنجاح`)
                .setDescription(`**${Icons.CATEGORY} اسم التصنيف:** ${name}\n**${Icons.INFO} الوصف:** ${description || 'لا يوجد وصف'}\n\n**تم إضافة التصنيف بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في مودال إضافة تصنيف:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء إضافة التصنيف.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

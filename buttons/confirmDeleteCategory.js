const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const categoryId = parseInt(interaction.customId.split('_')[2]);
            const category = db.getCategoryById(categoryId);
            
            if (!category) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} التصنيف غير موجود`)
                    .setDescription('لم يتم العثور على التصنيف المحدد.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            db.deleteCategory(categoryId);

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تم حذف التصنيف بنجاح`)
                .setDescription(`**${Icons.CATEGORY} اسم التصنيف:** ${category.name}\n\n**تم حذف التصنيف بنجاح من قاعدة البيانات**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

        } catch (error) {
            console.error('خطأ في تأكيد حذف التصنيف:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء حذف التصنيف.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

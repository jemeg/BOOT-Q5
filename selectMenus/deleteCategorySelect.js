const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const categoryId = parseInt(interaction.values[0]);
            const category = db.getCategoryById(categoryId);
            
            if (!category) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} التصنيف غير موجود`)
                    .setDescription('لم يتم العثور على التصنيف المحدد.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const confirmButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirmDeleteCategory_${categoryId}`)
                    .setLabel('نعم، حذف التصنيف')
                    .setEmoji(Icons.CHECK)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancelDelete')
                    .setLabel('إلغاء')
                    .setEmoji(Icons.CROSS)
                    .setStyle(ButtonStyle.Secondary),
            );

            const { EmbedBuilder } = require('discord.js');
            const confirmEmbed = new EmbedBuilder()
                .setColor(Colors.WARNING)
                .setTitle(`${Icons.WARNING} تأكيد الحذف`)
                .setDescription(`**هل أنت متأكد من حذف التصنيف؟**\n\n**${Icons.CATEGORY} اسم التصنيف:** ${category.name}\n**${Icons.INFO} الوصف:** ${category.description || 'لا يوجد وصف'}\n\n**⚠️ تحذير:** سيتم حذف جميع المنتجات المرتبطة بهذا التصنيف`)
                .setFooter({ text: 'إدارة المتجر | لا يمكن التراجع عن هذا الإجراء' })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], flags: 64 });

        } catch (error) {
            console.error('خطأ في قائمة حذف التصنيف:', error);
            const { EmbedBuilder } = require('discord.js');
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء فتح تأكيد الحذف.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

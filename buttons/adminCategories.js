const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية لإدارة التصنيفات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const categories = db.getAllCategories();
            let description = '';
            
            if (categories.length === 0) {
                description = '**لا توجد تصنيفات حالياً**';
            } else {
                categories.forEach((category) => {
                    description += `**${Icons.CATEGORY} ${category.name}**\n> ${Icons.INFO} ${category.description || 'لا يوجد وصف'}\n> ${Icons.TAG} ID: ${category.id}\n---\n`;
                });
            }

            const categoriesEmbed = new EmbedBuilder()
                .setColor(Colors.CYAN)
                .setTitle(`${Icons.CATEGORY} إدارة التصنيفات`)
                .setDescription(description)
                .setFooter({ text: `${categories.length} تصنيف` })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('addCategory').setLabel('إضافة تصنيف').setEmoji(Icons.PLUS).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('editCategory').setLabel('تعديل تصنيف').setEmoji(Icons.EDIT).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('deleteCategory').setLabel('حذف تصنيف').setEmoji(Icons.TRASH).setStyle(ButtonStyle.Danger),
            );

            await interaction.editReply({ embeds: [categoriesEmbed], components: [buttons] });

        } catch (error) {
            console.error('خطأ في إدارة التصنيفات:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء عرض إدارة التصنيفات.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

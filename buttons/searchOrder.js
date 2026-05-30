const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            if (!checkSpecificPermission(interaction.member, 'manage_orders')) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية للبحث عن الطلبات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const modal = new ModalBuilder()
                .setCustomId('searchOrderModal')
                .setTitle('بحث عن طلب');

            const searchInput = new TextInputBuilder()
                .setCustomId('searchQuery')
                .setLabel('رقم الطلب أو اسم المستخدم')
                .setPlaceholder('مثال: 123 أو username')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            modal.addComponents(
                new ActionRowBuilder().addComponents(searchInput)
            );

            await interaction.editReply({ modal });

            console.log(`🔍 فتح مودال البحث عن طلب بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر البحث عن طلب:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء فتح نموذج البحث.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

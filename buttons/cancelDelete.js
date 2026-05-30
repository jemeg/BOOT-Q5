const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const embed = new EmbedBuilder()
                .setColor(0x5865F2)
                .setTitle(`${Icons.CANCEL} تم الإلغاء`)
                .setDescription('تم إلغاء عملية الحذف بنجاح.')
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('خطأ في زر إلغاء الحذف:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء إلغاء الحذف.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

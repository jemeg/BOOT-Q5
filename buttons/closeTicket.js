const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            if (!checkSpecificPermission(interaction.member, 'manage_orders')) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية لإغلاق التذاكر.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            // إغلاق جميع الطلبات في هذه القناة
            const channelOrders = db.getOrdersByChannel(interaction.channel.id);
            let closedCount = 0;
            channelOrders.forEach(o => {
                if (o.status !== 'closed') {
                    db.updateOrderStatus(o.id, 'closed');
                    closedCount++;
                }
            });

            // تعطيل الأزرار في جميع رسائل القناة
            try {
                const messages = await interaction.channel.messages.fetch({ limit: 50 });
                for (const [, msg] of messages) {
                    if (msg.components.length > 0 && msg.editable) {
                        const disabledRow = new ActionRowBuilder().addComponents(
                            msg.components[0].components.map(c => ButtonBuilder.from(c).setDisabled(true))
                        );
                        await msg.edit({ components: [disabledRow] }).catch(() => {});
                    }
                }
            } catch (e) {}

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.DARK)
                .setTitle(`${Icons.CLOSE} تم إغلاق التذكرة`)
                .setDescription(`**تم إغلاق ${closedCount} طلب/طلبات** في هذه التذكرة\n\n**سيتم حذف القناة خلال 10 ثوانٍ**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            setTimeout(async () => {
                try {
                    await interaction.channel.delete();
                } catch (e) {
                    console.error('خطأ في حذف القناة:', e);
                }
            }, 10000);

        } catch (error) {
            console.error('خطأ في إغلاق التذكرة:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء إغلاق التذكرة.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

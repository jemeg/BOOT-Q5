const { EmbedBuilder } = require('discord.js');
const { Colors, Icons, getStatusEmoji, getStatusText } = require('../utils/embeds');
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
                    .setDescription('ليس لديك صلاحية لعرض الطلبات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const orders = db.getAllOrders();
            let description = '';
            
            if (orders.length === 0) {
                description = '**لا توجد طلبات حالياً**';
            } else {
                const recentOrders = orders.slice(0, 15);
                recentOrders.forEach(order => {
                    description += `**${Icons.RECEIPT} طلب #${order.id}**\n> ${Icons.USER} العميل: <@${order.user_id}>\n> ${Icons.MONEY} المجموع: $${order.total_price.toFixed(2)}\n> ${getStatusEmoji(order.status)} الحالة: ${getStatusText(order.status)}\n> ${Icons.CALENDAR} التاريخ: <t:${Math.floor(new Date(order.created_at).getTime() / 1000)}:R>\n---\n`;
                });
            }

            const ordersEmbed = new EmbedBuilder()
                .setColor(Colors.ORANGE)
                .setTitle(`${Icons.RECEIPT} جميع الطلبات`)
                .setDescription(description)
                .setFooter({ text: `${orders.length} طلب إجمالي` })
                .setTimestamp();

            await interaction.editReply({ embeds: [ordersEmbed] });

        } catch (error) {
            console.error('خطأ في عرض جميع الطلبات:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء عرض الطلبات.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
                    .setDescription('ليس لديك صلاحية لإدارة الطلبات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const orders = db.getAllOrders();
            let description = '';
            
            if (orders.length === 0) {
                description = '**لا توجد طلبات حالياً**';
            } else {
                const recentOrders = orders.slice(0, 10);
                recentOrders.forEach(order => {
                    const statusEmoji = order.status === 'pending' ? '🟡' : order.status === 'completed' ? '✅' : '❌';
                    description += `**${Icons.RECEIPT} طلب #${order.id}**\n> ${Icons.USER} العميل: <@${order.user_id}>\n> ${Icons.MONEY} المجموع: $${order.total_price.toFixed(2)}\n> ${statusEmoji} الحالة: ${order.status}\n> ${Icons.CALENDAR} التاريخ: <t:${Math.floor(new Date(order.created_at).getTime() / 1000)}:R>\n---\n`;
                });
            }

            const ordersEmbed = new EmbedBuilder()
                .setColor(Colors.ORANGE)
                .setTitle(`${Icons.CART} إدارة الطلبات`)
                .setDescription(description)
                .setFooter({ text: `${orders.length} طلب إجمالي` })
                .setTimestamp();

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('viewAllOrders').setLabel('جميع الطلبات').setEmoji(Icons.RECEIPT).setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId('viewPendingOrders').setLabel('المعلقة').setEmoji(Icons.CLOCK).setStyle(ButtonStyle.Secondary),
                new ButtonBuilder().setCustomId('viewCompletedOrders').setLabel('المكتملة').setEmoji(Icons.CHECK).setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId('searchOrder').setLabel('بحث').setEmoji('🔍').setStyle(ButtonStyle.Secondary),
            );

            await interaction.editReply({ embeds: [ordersEmbed], components: [buttons] });

        } catch (error) {
            console.error('خطأ في إدارة الطلبات:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء عرض إدارة الطلبات.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

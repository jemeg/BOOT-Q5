const { EmbedBuilder } = require('discord.js');
const { Colors, Icons, getStatusEmoji, getStatusText } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const searchQuery = interaction.fields.getTextInputValue('searchQuery');
            const orders = db.searchOrders(searchQuery);
            
            if (orders.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} لا توجد نتائج`)
                    .setDescription(`لم يتم العثور على طلبات تطابق "${searchQuery}"`)
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            let description = '';
            const displayOrders = orders.slice(0, 10);
            
            displayOrders.forEach(order => {
                description += `**${Icons.RECEIPT} طلب #${order.id}**\n> ${Icons.USER} العميل: <@${order.user_id}>\n> ${Icons.MONEY} المجموع: $${order.total_price.toFixed(2)}\n> ${getStatusEmoji(order.status)} الحالة: ${getStatusText(order.status)}\n> ${Icons.CALENDAR} التاريخ: <t:${Math.floor(new Date(order.created_at).getTime() / 1000)}:R>\n---\n`;
            });

            const resultsEmbed = new EmbedBuilder()
                .setColor(Colors.CYAN)
                .setTitle(`${Icons.STATS} نتائج البحث`)
                .setDescription(description)
                .setFooter({ text: `${orders.length} نتيجة` })
                .setTimestamp();

            await interaction.reply({ embeds: [resultsEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في مودال البحث عن طلب:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء البحث.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

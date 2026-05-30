const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            if (!checkSpecificPermission(interaction.member, 'view_stats')) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية لعرض الإحصائيات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const stats = {
                orderCount: db.getOrderCount(),
                totalSales: db.getTotalSales(),
                productCount: db.getProductCount(),
                customerCount: db.getCustomerCount(),
                mostSold: db.getMostSoldProducts(5)
            };

            const statsEmbed = new EmbedBuilder()
                .setColor(Colors.CYAN)
                .setTitle(`${Icons.STATS} إحصائيات المتجر`)
                .setDescription(`**${Icons.RECEIPT} إجمالي الطلبات:** ${stats.orderCount}\n**${Icons.MONEY} إجمالي المبيعات:** $${stats.totalSales.toFixed(2)}\n**${Icons.PRODUCT} عدد المنتجات:** ${stats.productCount}\n**${Icons.PEOPLE} عدد العملاء:** ${stats.customerCount}\n\n---\n**أكثر المنتجات مبيعاً:**\n${stats.mostSold.length > 0 ? stats.mostSold.map((p, i) => `${Icons.STAR} ${i + 1}. ${p.name} - ${p.total_sold} مبيعة`).join('\n') : 'لا توجد بيانات بعد'}`)
                .setFooter({ text: 'آخر تحديث' })
                .setTimestamp();

            await interaction.editReply({ embeds: [statsEmbed] });

            console.log(`📊 فتح الإحصائيات بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في الإحصائيات:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء عرض الإحصائيات.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const orderId = parseInt(interaction.customId.split('_')[1]);
            const order = db.getOrderById(orderId);
            
            if (!order) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} الطلب غير موجود`)
                    .setDescription('لم يتم العثور على هذا الطلب.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            db.updateOrderStatus(orderId, 'confirmed');

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تم تأكيد الطلب`)
                .setDescription(`**${Icons.RECEIPT} رقم الطلب:** #${orderId}\n**${Icons.USER} العميل:** <@${order.user_id}>\n**${Icons.CHECK} الحالة:** تم التأكيد\n\n**تم تأكيد الطلب بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            try {
                const client_user = await client.users.fetch(order.user_id);
                if (client_user) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(Colors.SUCCESS)
                        .setTitle(`${Icons.SUCCESS} تم تأكيد طلبك`)
                        .setDescription(`**${Icons.RECEIPT} رقم الطلب:** #${orderId}\n**${Icons.CHECK} الحالة:** تم التأكيد\n\n**تم تأكيد طلبك من قبل الإدارة**\n**سيتم التواصل معك قريباً**`)
                        .setFooter({ text: 'المتجر | شكراً لك' })
                        .setTimestamp();
                    await client_user.send({ embeds: [dmEmbed] });
                }
            } catch (e) {
                console.log('⚠️ لا يمكن إرسال رسالة خاصة للعميل');
            }

        } catch (error) {
            console.error('خطأ في تأكيد الطلب:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء تأكيد الطلب.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

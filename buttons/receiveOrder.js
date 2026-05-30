const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

const FINAL_STATUSES = ['confirmed', 'cancelled', 'completed', 'refunded', 'closed', 'received'];

function areAllOrdersHandled(channelId) {
    const orders = db.getOrdersByChannel(channelId);
    if (orders.length === 0) return false;
    return orders.every(o => FINAL_STATUSES.includes(o.status));
}

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            if (!checkSpecificPermission(interaction.member, 'manage_orders')) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية لاستلام الطلبات.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const orderId = interaction.customId.split('_')[1];
            const order = db.getOrderById(parseInt(orderId));
            
            if (!order) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} الطلب غير موجود`)
                    .setDescription('لم يتم العثور على هذا الطلب.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            db.updateOrderStatus(orderId, 'received');

            // تحديث الرسالة الأصلية: تعطيل الأزرار وتحديث الإمبد
            try {
                const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                    .setColor(Colors.SUCCESS)
                    .setFooter({ text: `📦 تم الاستلام بواسطة ${interaction.user.tag}` })
                    .setTimestamp();
                
                const oldRow = interaction.message.components[0];
                if (oldRow) {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        oldRow.components.map(c => ButtonBuilder.from(c).setDisabled(true))
                    );
                    await interaction.message.edit({ embeds: [updatedEmbed], components: [disabledRow] });
                } else {
                    await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
                }
            } catch (e) { console.error('خطأ في تحديث الرسالة:', e); }

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.TRUCK} تم استلام الطلب`)
                .setDescription(`**${Icons.RECEIPT} رقم الطلب:** #${orderId}\n**${Icons.USER} العميل:** <@${order.user_id}>\n**${Icons.CHECK} الحالة:** تم الاستلام\n\n**تم تحديث حالة الطلب بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            try {
                const client_user = await client.users.fetch(order.user_id);
                if (client_user) {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(0x5865F2)
                        .setTitle(`${Icons.TRUCK} تم استلام طلبك`)
                        .setDescription(`**${Icons.RECEIPT} رقم الطلب:** #${orderId}\n**${Icons.CHECK} الحالة:** تم الاستلام\n\n**تم استلام طلبك من قبل الإدارة**\n**سيتم التواصل معك قريباً لتسليم المنتجات**`)
                        .setFooter({ text: 'المتجر | شكراً لك' })
                        .setTimestamp();
                    await client_user.send({ embeds: [dmEmbed] });
                }
            } catch (e) {
                console.log('⚠️ لا يمكن إرسال رسالة خاصة للعميل');
            }

            // التحقق مما إذا كانت جميع الطلبات في القناة قد اكتملت
            if (areAllOrdersHandled(interaction.channel.id)) {
                setTimeout(async () => {
                    try {
                        await interaction.channel.send('✅ **تمت معالجة جميع الطلبات، سيتم إغلاق التذكرة...**');
                        await new Promise(r => setTimeout(r, 3000));
                        await interaction.channel.delete();
                    } catch (e) {
                        console.error('خطأ في حذف القناة:', e);
                    }
                }, 2000);
            }

        } catch (error) {
            console.error('خطأ في استلام الطلب:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء استلام الطلب.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

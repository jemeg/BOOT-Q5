const { ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const { Colors, Icons, createTicketEmbed } = require('../utils/embeds');
const { createTicketButtons, checkSpecificPermission, findExistingTicketChannel } = require('../utils/helpers');
const { userSelections } = require('../selectMenus/productSelect');
const db = require('../database/db');

// الحالات النهائية للطلب
const FINAL_STATUSES = ['confirmed', 'cancelled', 'completed', 'refunded', 'closed', 'received'];

// التحقق مما إذا كانت جميع الطلبات في القناة قد اكتملت
function areAllOrdersHandled(channelId) {
    const orders = db.getOrdersByChannel(channelId);
    if (orders.length === 0) return false;
    return orders.every(o => FINAL_STATUSES.includes(o.status));
}

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            // إذا كان الزر هو confirmOrder_123 (موافقة على طلب موجود من التذكرة)
            if (interaction.customId.startsWith('confirmOrder_')) {
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
                
                if (order.status === 'confirmed' || order.status === 'completed') {
                    const embed = new EmbedBuilder()
                        .setColor(Colors.WARNING)
                        .setTitle(`${Icons.WARNING} الطلب مؤكد مسبقاً`)
                        .setDescription('هذا الطلب تم تأكيده مسبقاً.')
                        .setTimestamp();
                    return interaction.editReply({ embeds: [embed] });
                }
                
                // تأكيد الطلب - هذا يشغل حساب المبيعات تلقائياً في updateOrderStatus
                db.updateOrderStatus(orderId, 'confirmed', 'تم تأكيد الطلب', interaction.user.tag);
                
                // تحديث الرسالة الأصلية: تعطيل الأزرار وتحديث الإمبد
                try {
                    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
                        .setColor(Colors.SUCCESS)
                        .setFooter({ text: `✅ تم التأكيد بواسطة ${interaction.user.tag}` })
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
                    .setTitle(`${Icons.SUCCESS} تم تأكيد الطلب #${orderId}`)
                    .setDescription(`**${Icons.RECEIPT} رقم الطلب:** #${orderId}\n**${Icons.USER} العميل:** <@${order.user_id}>\n**${Icons.MONEY} المجموع:** $${order.total_price.toFixed(2)}\n**${Icons.CHECK} الحالة:** تم التأكيد ✅\n\n**تم تأكيد الطلب وحساب المبيعات**`)
                    .setFooter({ text: 'إدارة المتجر' })
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [successEmbed] });
                
                console.log(`✅ تم تأكيد الطلب #${orderId} بواسطة ${interaction.user.tag}`);
                
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
                
                return;
            }
            
            // === الزر الأساسي: confirmOrder (بدون suffix) ===
            // هنا المستخدم يؤكد طلبه بعد اختيار المنتجات من القائمة المنسدلة
            
            const userId = interaction.user.id;
            const user = interaction.user;
            
            const cartData = userSelections.get(userId);
            
            if (!cartData || !cartData.products || cartData.products.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} السلة فارغة`)
                    .setDescription('لم تقم باختيار أي منتجات بعد.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            // التحقق من حزم خاصة (مرة واحدة لكل مستخدم)
            const restrictedProds = cartData.products.filter(p => db.isSpecialPackCategory(p.category_id) && db.hasUserPurchasedProduct(userId, p.id));
            if (restrictedProds.length > 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} لا يمكن شراء هذا المنتج`)
                    .setDescription(`المنتج/المنتجات التالية من **حزم خاصة** وقد قمت بشرائها مسبقاً:\n${restrictedProds.map(p => `📦 ${p.name}`).join('\n')}\n\n**لا يمكن شراء حزمة خاصة إلا مرة واحدة فقط.**`)
                    .setFooter({ text: 'إدارة المتجر' })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const orderResult = db.createOrder(
                userId,
                user.username,
                cartData.products,
                cartData.totalPrice,
                null
            );
            
            const orderId = orderResult.lastInsertRowid;
            const ticketCategoryId = process.env.TICKET_CATEGORY_ID;
            const guild = interaction.guild;
            
            if (!ticketCategoryId) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('لم يتم تكوين كاتب التذاكر.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            // محاولة إعادة استخدام تذكرة مفتوحة لنفس المستخدم
            let ticketChannel = await findExistingTicketChannel(guild, userId);
            let isNewChannel = false;

            if (!ticketChannel) {
                ticketChannel = await guild.channels.create({
                    name: `store-${user.username}`,
                    type: ChannelType.GuildText,
                    parent: ticketCategoryId,
                    permissionOverwrites: [
                        {
                            id: guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: userId,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                        {
                            id: process.env.ADMIN_ROLE_ID || guild.roles.everyone.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                        {
                            id: process.env.MANAGER_ROLE_ID || guild.roles.everyone.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                        {
                            id: process.env.STAFF_ROLE_ID || guild.roles.everyone.id,
                            allow: [
                                PermissionFlagsBits.ViewChannel,
                                PermissionFlagsBits.SendMessages,
                                PermissionFlagsBits.ReadMessageHistory,
                            ],
                        },
                    ],
                });
                isNewChannel = true;
            } else {
                // التأكد من أن المستخدم لديه صلاحية رؤية القناة عند إعادة الاستخدام
                try {
                    await ticketChannel.permissionOverwrites.edit(userId, {
                        ViewChannel: true,
                        SendMessages: true,
                        ReadMessageHistory: true
                    });
                } catch (e) { /* الصلاحية موجودة مسبقاً */ }
            }

            db.updateOrderStatus(orderId, 'pending');
            db.updateOrderTicketChannel(orderId, ticketChannel.id);

            const orderData = {
                id: orderId,
                user_id: userId,
                username: user.username,
                products: cartData.products,
                total_price: cartData.totalPrice,
                status: 'pending'
            };

            const ticketEmbed = createTicketEmbed(orderData, cartData.products);
            const ticketButtons = createTicketButtons(orderId);

            // إرسال رسالة فصل عند إعادة استخدام التذكرة
            if (!isNewChannel) {
                await ticketChannel.send({
                    content: `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                });
            }

            await ticketChannel.send({
                content: `<@${userId}> <@&${process.env.ADMIN_ROLE_ID || ''}> <@&${process.env.MANAGER_ROLE_ID || ''}>`,
                embeds: [ticketEmbed],
                components: [ticketButtons]
            });

            const ticketMention = isNewChannel ? `**تم إنشاء تذكرة خاصة بك:** <#${ticketChannel.id}>` : `**تمت الإضافة إلى تذكرتك:** <#${ticketChannel.id}>`;
            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تم إنشاء الطلب بنجاح`)
                .setDescription(`**${Icons.TICKET} رقم الطلب:** #${orderId}\n**${Icons.MONEY} المجموع:** $${cartData.totalPrice.toFixed(2)}\n**${Icons.CHECK} الحالة:** قيد المراجعة\n\n${ticketMention}\n\n**يمكنك متابعة الطلب من خلال التذكرة**`)
                .setFooter({ text: 'المتجر | شكراً لك' })
                .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });

            userSelections.delete(userId);
            
            console.log(`✅ تم إنشاء طلب #${orderId} بواسطة ${user.tag}`);

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

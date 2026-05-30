const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const productId = parseInt(interaction.values[0]);
            const product = db.getProductById(productId);
            
            if (!product) {
                const { EmbedBuilder } = require('discord.js');
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} المنتج غير موجود`)
                    .setDescription('لم يتم العثور على المنتج المحدد.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const confirmButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`confirmDeleteProduct_${productId}`)
                    .setLabel('نعم، حذف المنتج')
                    .setEmoji(Icons.CHECK)
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancelDelete')
                    .setLabel('إلغاء')
                    .setEmoji(Icons.CROSS)
                    .setStyle(ButtonStyle.Secondary),
            );

            const { EmbedBuilder } = require('discord.js');
            const confirmEmbed = new EmbedBuilder()
                .setColor(Colors.WARNING)
                .setTitle(`${Icons.WARNING} تأكيد الحذف`)
                .setDescription(`**هل أنت متأكد من حذف المنتج؟**\n\n**${Icons.PRODUCT} اسم المنتج:** ${product.name}\n**${Icons.MONEY} السعر:** $${product.price.toFixed(2)}\n**${Icons.TAG} التصنيف:** ${product.category_name || 'غير محدد'}\n\n**⚠️ تحذير:** لا يمكن التراجع عن هذا الإجراء`)
                .setFooter({ text: 'إدارة المتجر | لا يمكن التراجع عن هذا الإجراء' })
                .setTimestamp();

            await interaction.reply({ embeds: [confirmEmbed], components: [confirmButtons], flags: 64 });

        } catch (error) {
            console.error('خطأ في قائمة حذف المنتج:', error);
            const { EmbedBuilder } = require('discord.js');
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء فتح تأكيد الحذف.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

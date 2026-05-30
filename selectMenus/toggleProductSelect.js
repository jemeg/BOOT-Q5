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

            db.toggleProductStatus(productId);
            const updatedProduct = db.getProductById(productId);

            const { EmbedBuilder } = require('discord.js');
            const successEmbed = new EmbedBuilder()
                .setColor(updatedProduct.is_active ? Colors.SUCCESS : Colors.DANGER)
                .setTitle(`${Icons.SUCCESS} تم تغيير حالة المنتج بنجاح`)
                .setDescription(`**${Icons.PRODUCT} اسم المنتج:** ${updatedProduct.name}\n**${Icons.INFO} الحالة الجديدة:** ${updatedProduct.is_active ? '🟢 مفعل' : '🔴 معطل'}\n\n**تم تغيير حالة المنتج بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في تغيير حالة المنتج:', error);
            const { EmbedBuilder } = require('discord.js');
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء تغيير حالة المنتج.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

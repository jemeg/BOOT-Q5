const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
            const productId = parseInt(interaction.customId.split('_')[1]);
            const name = interaction.fields.getTextInputValue('productName');
            const price = parseFloat(interaction.fields.getTextInputValue('productPrice'));
            const description = interaction.fields.getTextInputValue('productDescription') || '';
            const imageUrl = interaction.fields.getTextInputValue('productImage') || '';
            const categoryId = parseInt(interaction.fields.getTextInputValue('productCategory'));

            if (isNaN(price) || price < 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} بيانات غير صحيحة`)
                    .setDescription('يرجى إدخال سعر صحيح.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            if (isNaN(categoryId)) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} تصنيف غير صحيح`)
                    .setDescription('يرجى إدخال رقم التصنيف صحيح.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const category = db.getCategoryById(categoryId);
            if (!category) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} التصنيف غير موجود`)
                    .setDescription('التصنيف المحدد غير موجود.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            const existingProduct = db.getProductById(productId);
            if (!existingProduct) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} المنتج غير موجود`)
                    .setDescription('المنتج المحدد غير موجود.')
                    .setTimestamp();
                return interaction.reply({ embeds: [embed], flags: 64 });
            }

            db.updateProduct(productId, name, description, price, imageUrl, categoryId, existingProduct.is_active);

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تم تعديل المنتج بنجاح`)
                .setDescription(`**${Icons.PRODUCT} اسم المنتج:** ${name}\n**${Icons.MONEY} السعر:** $${price.toFixed(2)}\n**${Icons.TAG} التصنيف:** ${category.name}\n\n**تم تعديل المنتج بنجاح**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في مودال تعديل منتج:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء تعديل المنتج.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

const { EmbedBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    async execute(interaction, client) {
        try {
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

            db.createProduct(name, description, price, imageUrl, categoryId, 1);

            const successEmbed = new EmbedBuilder()
                .setColor(Colors.SUCCESS)
                .setTitle(`${Icons.SUCCESS} تمت إضافة المنتج بنجاح`)
                .setDescription(`**${Icons.PRODUCT} اسم المنتج:** ${name}\n**${Icons.MONEY} السعر:** $${price.toFixed(2)}\n**${Icons.TAG} التصنيف:** ${category.name}\n**${Icons.INFO} الحالة:** مفعل\n\n**تم إضافة المنتج بنجاح إلى المتجر**`)
                .setFooter({ text: 'إدارة المتجر' })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed], flags: 64 });

        } catch (error) {
            console.error('خطأ في مودال إضافة منتج:', error);
            const errorEmbed = new EmbedBuilder()
                .setColor(Colors.DANGER)
                .setTitle(`${Icons.CROSS} خطأ`)
                .setDescription('حدث خطأ أثناء إضافة المنتج.')
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], flags: 64 });
        }
    }
};

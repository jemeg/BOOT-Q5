const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    // قائمة اختيار تعديل المنتج
    async execute(interaction, client) {
        try {
            // جلب المنتج المحدد
            const productId = parseInt(interaction.values[0]);
            const product = db.getProductById(productId);
            
            if (!product) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} المنتج غير موجود`,
                        description: 'لم يتم العثور على المنتج المحدد.',
                    }],
                    flags: 64
                });
            }

            // جلب التصنيفات
            const categories = db.getAllCategories();
            
            // إنشاء المودال
            const modal = new ModalBuilder()
                .setCustomId(`editProductModal_${productId}`)
                .setTitle(`تعديل المنتج: ${product.name}`);

            // حقل اسم المنتج
            const nameInput = new TextInputBuilder()
                .setCustomId('productName')
                .setLabel('اسم المنتج')
                .setValue(product.name)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل السعر
            const priceInput = new TextInputBuilder()
                .setCustomId('productPrice')
                .setLabel('السعر (بالدولار)')
                .setValue(product.price.toString())
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل الوصف
            const descriptionInput = new TextInputBuilder()
                .setCustomId('productDescription')
                .setLabel('وصف المنتج')
                .setValue(product.description || '')
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph);

            // حقل رابط الصورة
            const imageInput = new TextInputBuilder()
                .setCustomId('productImage')
                .setLabel('رابط الصورة')
                .setValue(product.image_url || '')
                .setRequired(false)
                .setStyle(TextInputStyle.Short);

            // حقل التصنيف
            const categoryInput = new TextInputBuilder()
                .setCustomId('productCategory')
                .setLabel('رقم التصنيف')
                .setValue(product.category_id?.toString() || '')
                .setPlaceholder(`التصنيفات: ${categories.map(c => `${c.id}. ${c.name}`).join(', ')}`)
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // إضافة الحقول إلى المودال
            modal.addComponents(
                new ActionRowBuilder().addComponents(nameInput),
                new ActionRowBuilder().addComponents(priceInput),
                new ActionRowBuilder().addComponents(descriptionInput),
                new ActionRowBuilder().addComponents(imageInput),
                new ActionRowBuilder().addComponents(categoryInput)
            );

            // عرض المودال
            await interaction.showModal(modal);

            console.log(`📦 فتح مودال تعديل المنتج ${product.name} بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في قائمة تعديل المنتج:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح نموذج التعديل.',
                }],
                flags: 64
            });
        }
    }
};



const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { checkSpecificPermission } = require('../utils/helpers');

module.exports = {
    // زر إضافة منتج
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية لإضافة المنتجات.',
                    }],
                    flags: 64
                });
            }

            // جلب التصنيفات
            const categories = db.getAllCategories();
            
            if (categories.length === 0) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} لا توجد تصنيفات`,
                        description: 'يجب إنشاء تصنيف أولاً قبل إضافة منتج.',
                    }],
                    flags: 64
                });
            }

            // إنشاء المودال
            const modal = new ModalBuilder()
                .setCustomId('addProductModal')
                .setTitle('إضافة منتج جديد');

            // حقل اسم المنتج
            const nameInput = new TextInputBuilder()
                .setCustomId('productName')
                .setLabel('اسم المنتج')
                .setPlaceholder('مثال: Nitro Boost')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل السعر
            const priceInput = new TextInputBuilder()
                .setCustomId('productPrice')
                .setLabel('السعر (بالدولار)')
                .setPlaceholder('مثال: 9.99')
                .setRequired(true)
                .setStyle(TextInputStyle.Short);

            // حقل الوصف
            const descriptionInput = new TextInputBuilder()
                .setCustomId('productDescription')
                .setLabel('وصف المنتج')
                .setPlaceholder('وصف مختصر للمنتج')
                .setRequired(false)
                .setStyle(TextInputStyle.Paragraph);

            // حقل رابط الصورة
            const imageInput = new TextInputBuilder()
                .setCustomId('productImage')
                .setLabel('رابط الصورة')
                .setPlaceholder('https://example.com/image.png')
                .setRequired(false)
                .setStyle(TextInputStyle.Short);

            // حقل التصنيف
            const categoryInput = new TextInputBuilder()
                .setCustomId('productCategory')
                .setLabel('رقم التصنيف')
                .setPlaceholder(`التصنيفات المتاحة: ${categories.map(c => `${c.id}. ${c.name}`).join(', ')}`)
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

            console.log(`📦 فتح مودال إضافة منتج بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر إضافة منتج:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء فتح نموذج الإضافة.',
                }],
                flags: 64
            });
        }
    }
};



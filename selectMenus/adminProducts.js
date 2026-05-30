const { Colors, Icons, createProductsEmbed, createStatsEmbed } = require('../utils/embeds');
const { createProductManagementButtons, createPaginationButtons } = require('../utils/helpers');
const { checkSpecificPermission } = require('../utils/helpers');
const db = require('../database/db');

module.exports = {
    // قائمة إدارة المنتجات
    async execute(interaction, client) {
        try {
            // التحقق من الصلاحيات
            if (!checkSpecificPermission(interaction.member, 'manage_products')) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.DANGER,
                        title: `${Icons.SHIELD} خطأ في الصلاحيات`,
                        description: 'ليس لديك صلاحية للوصول إلى إدارة المنتجات.',
                    }],
                    flags: 64
                });
            }

            // جلب جميع المنتجات
            const products = db.getAllProducts();
            
            if (products.length === 0) {
                return interaction.reply({
                    embeds: [{
                        color: Colors.WARNING,
                        title: `${Icons.WARNING} لا توجد منتجات`,
                        description: 'لا توجد منتجات في المتجر حالياً.',
                    }],
                    components: [createProductManagementButtons()],
                    flags: 64
                });
            }

            // إنشاء embed المنتجات
            const page = 1;
            const productsPerPage = 5;
            const productsEmbed = createProductsEmbed(products, page, productsPerPage);
            
            // إنشاء أزرار إدارة المنتجات
            const productManagementButtons = createProductManagementButtons();
            
            // إنشاء أزرار التنقل
            const totalPages = Math.ceil(products.length / productsPerPage);
            const paginationButtons = createPaginationButtons(page, totalPages);

            // إرسال القائمة
            await interaction.reply({
                embeds: [productsEmbed],
                components: [productManagementButtons, paginationButtons],
                flags: 64
            });

            console.log(`📦 فتح إدارة المنتجات بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في قائمة إدارة المنتجات:', error);
            
            await interaction.reply({
                embeds: [{
                    color: Colors.DANGER,
                    title: `${Icons.CROSS} خطأ`,
                    description: 'حدث خطأ أثناء عرض إدارة المنتجات.',
                }],
                flags: 64
            });
        }
    }
};



const { EmbedBuilder } = require('discord.js');
const { Colors, Icons, createCartEmbed } = require('../utils/embeds');
const { createOrderButtons, calculateTotalPrice } = require('../utils/helpers');
const db = require('../database/db');

// تخزين مؤقت لاختيارات المستخدمين
const userSelections = new Map();

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const userId = interaction.user.id;
            const selectedValues = interaction.values;
            
            const selectedProducts = [];
            for (const productId of selectedValues) {
                const product = db.getProductById(parseInt(productId));
                if (product) {
                    selectedProducts.push(product);
                }
            }
            
            if (selectedProducts.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} لا توجد منتجات`)
                    .setDescription('لم يتم العثور على المنتجات المختارة.')
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }
            
            const totalPrice = calculateTotalPrice(selectedProducts);
            
            userSelections.set(userId, {
                products: selectedProducts,
                totalPrice: totalPrice
            });
            
            const cartEmbed = createCartEmbed(selectedProducts, totalPrice);
            const orderButtons = createOrderButtons();

            await interaction.editReply({
                embeds: [cartEmbed],
                components: [orderButtons]
            });

            console.log(`🛒 أضاف ${interaction.user.tag} ${selectedProducts.length} منتجات إلى السلة`);

        } catch (error) {
            console.error('خطأ في قائمة اختيار المنتجات:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء إضافة المنتجات إلى السلة.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

module.exports.userSelections = userSelections;

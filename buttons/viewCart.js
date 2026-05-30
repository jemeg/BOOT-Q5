const { EmbedBuilder } = require('discord.js');
const { Colors, Icons, createCartEmbed } = require('../utils/embeds');
const { createOrderButtons } = require('../utils/helpers');
const { userSelections } = require('../selectMenus/productSelect');

module.exports = {
    async execute(interaction, client) {
        try {
            await interaction.deferReply({ flags: 64 });
            
            const userId = interaction.user.id;
            
            const cartData = userSelections.get(userId);
            
            if (!cartData || !cartData.products || cartData.products.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(Colors.WARNING)
                    .setTitle(`${Icons.WARNING} السلة فارغة`)
                    .setDescription(`**سلة المشتريات فارغة**\n\n${Icons.INFO} قم باختيار المنتجات أولاً من خلال زر "عرض المنتجات"`)
                    .setFooter({ text: 'المتجر | اختر منتجاتك المفضلة' })
                    .setTimestamp();
                return interaction.editReply({ embeds: [embed] });
            }

            const cartEmbed = createCartEmbed(cartData.products, cartData.totalPrice);
            const orderButtons = createOrderButtons();

            await interaction.editReply({
                embeds: [cartEmbed],
                components: [orderButtons]
            });

            console.log(`🛒 عرض السلة بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر عرض السلة:', error);
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء عرض السلة.')
                    .setTimestamp();
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                }
            } catch (e) {}
        }
    }
};

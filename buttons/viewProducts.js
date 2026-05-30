const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');

module.exports = {
    async execute(interaction, client) {
        try {
            const webPort = process.env.WEB_PORT || 3000;
            const storeUrl = `http://localhost:${webPort}/store`;
            
            const embed = new EmbedBuilder()
                .setColor(Colors.PRIMARY)
                .setTitle(`${Icons.STORE} متجرنا الرقمي`)
                .setDescription(`**اكتشف جميع منتجاتنا المميزة**\n\n🔥 **منتجات حصرية**\n💰 **أفضل الأسعار**\n⚡ **تسليم فوري**\n\n---\n**اضغط على الزر أدناه لتصفح المتجر**`)
                .setFooter({ text: 'المتجر | تسوق الآن' })
                .setTimestamp();
            
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('🛒 فتح المتجر')
                    .setURL(storeUrl)
                    .setStyle(ButtonStyle.Link),
            );
            
            await interaction.reply({
                embeds: [embed],
                components: [buttons],
                flags: 64
            });
            
            console.log(`📦 تم فتح المتجر بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في زر عرض المنتجات:', error);
        }
    }
};

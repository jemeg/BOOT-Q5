const path = require('path');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('store')
        .setDescription('فتح المتجر وعرض المنتجات')
        .setDMPermission(false),

    async execute(interaction, client) {
        try {
            const siteUrl = process.env.SITE_URL || `http://localhost:${process.env.WEB_PORT || 3000}`;
            const storeUrl = `${siteUrl}/store`;
            
            const products = db.getActiveProducts();
            
            const embed = new EmbedBuilder()
                .setColor(Colors.PRIMARY)
                .setTitle('مرحباً بك في 𝐋𝐄𝐆𝐀𝐂𝐘 𝑆𝑇𝑂𝑅𝐸')
                .setDescription(`**من نحن نقدم لك أفضل المنتجات والخدمات الرقمية**\n\n🔥 **متجرنا** - ${products.length} منتج متاح\n🎁 **عروض حصرية وخصومات**\n⭐ **جودة عالية وخدمة ممتازة**\n\n---\n`)
                .setImage('attachment://LEGACY.png')
                .setFooter({ text: '𝐋𝐄𝐆𝐀𝐂𝐘 𝐂𝐅𝐖 | جميع الحقوق محفوظة' })
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
                files: [{ attachment: path.join(__dirname, '..', 'LEGACY.png'), name: 'LEGACY.png' }]
            });

            console.log(`📦 تم فتح المتجر بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في أمر المتجر:', error);
        }
    }
};

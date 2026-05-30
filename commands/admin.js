const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Colors, Icons } = require('../utils/embeds');
const { isAdmin } = require('../utils/helpers');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('admin')
        .setDescription('لوحة التحكم الإدارية للمتجر')
        .setDMPermission(false),

    async execute(interaction, client) {
        try {
            // تأجيل الرد لتجنب Timeout
            await interaction.deferReply({ flags: 64 });
            
            // التحقق من الصلاحيات
            if (!isAdmin(interaction.member)) {
                const noPermEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.SHIELD} خطأ في الصلاحيات`)
                    .setDescription('ليس لديك صلاحية للوصول إلى لوحة التحكم الإدارية.')
                    .setFooter({ text: 'المتجر | صلاحيات محدودة' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [noPermEmbed] });
            }

            const siteUrl = process.env.SITE_URL || `http://localhost:${process.env.WEB_PORT || 3000}`;
            const panelUrl = siteUrl;

            // إنشاء embed لوحة التحكم
            const adminEmbed = new EmbedBuilder()
                .setColor(Colors.PURPLE)
                .setTitle(`${Icons.GEAR} لوحة تحكم المتجر`)
                .setDescription(`**مرحباً بك في لوحة التحكم الإدارية**\n\n${Icons.PRODUCT} **إدارة المنتجات** - إضافة، تعديل، حذف المنتجات\n${Icons.CATEGORY} **إدارة التصنيفات** - إنشاء وتعديل التصنيفات\n${Icons.CART} **إدارة الطلبات** - متابعة وإدارة الطلبات\n${Icons.STATS} **الإحصائيات** - عرض إحصائيات المتجر\n\n---\n**اضغط على الزر أدناه للوصول إلى لوحة التحكم على الويب**`)
                .setFooter({ text: 'لوحة التحكم الإدارية' })
                .setTimestamp();

            // إنشاء أزرار لوحة التحكم
            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('فتح لوحة التحكم')
                    .setURL(panelUrl)
                    .setStyle(ButtonStyle.Link)
                    .setEmoji('🌐'),
            );

            await interaction.editReply({
                embeds: [adminEmbed],
                components: [buttons]
            });

            console.log(`⚙️ تم فتح لوحة التحكم بواسطة ${interaction.user.tag}`);

        } catch (error) {
            console.error('خطأ في أمر الإدارة:', error);
            
            try {
                const errorEmbed = new EmbedBuilder()
                    .setColor(Colors.DANGER)
                    .setTitle(`${Icons.CROSS} خطأ`)
                    .setDescription('حدث خطأ أثناء فتح لوحة التحكم.')
                    .setFooter({ text: 'المتجر | نعتذر عن الإزعاج' })
                    .setTimestamp();

                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [errorEmbed] });
                } else if (!interaction.replied) {
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
            } catch (e) {
                // تجاهل
            }
        }
    }
};

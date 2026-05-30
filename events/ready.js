const { ActivityType, REST, Routes } = require('discord.js');
const db = require('../database/db');
const { startWebServer } = require('../web');

module.exports = {
    name: 'ready',
    once: true,
    
    async execute(client) {
        console.log(`✅ البوت جاهز! Logged in as ${client.user.tag}`);
        
        client.user.setActivity('المتجر | /store', { type: ActivityType.Watching });
        client.user.setStatus('online');
        
        db.initialize();
        console.log('📦 تم تهيئة قاعدة البيانات بنجاح');
        
        startWebServer();
        
        const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
        
        try {
            console.log('جاري تسجيل أوامر البوت...');
            
            const commands = [];
            client.commands.forEach(cmd => {
                commands.push(cmd.data.toJSON());
            });
            
            await rest.put(
                Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID),
                { body: commands }
            );
            
            console.log('✅ تم تسجيل الأوامر بنجاح!');
        } catch (error) {
            console.error('❌ خطأ في تسجيل الأوامر:', error);
        }
        
        console.log('🚀 البوت يعمل بنجاح!');
    }
};

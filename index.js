require('dotenv').config();
const Discord = require('discord.js');
const bot = new Discord.Client();
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async msg => {
    if (msg.content === 'mute all') {

        if (msg.member.voiceChannelID) {
            let channel = msg.guild.channels.get(msg.member.voiceChannelID);
            for (const [memberID, member] of channel.members) {
                member.setMute(true);
            }
            msg.channel.send('muted');
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    } else if (msg.content === 'unmute all') {
        if (msg.member.voiceChannelID) {
            let channel = msg.guild.channels.get(msg.member.voiceChannelID);
            for (const [memberID, member] of channel.members) {
                member.setMute(false);
            }
            msg.channel.send('unmuted');
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    }

});
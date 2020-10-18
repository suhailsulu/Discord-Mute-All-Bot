require('dotenv').config();
const Discord = require('discord.js');
const { Transform } = require('stream');
const googleSpeech = require('@google-cloud/speech');
const bot = new Discord.Client();
const googleSpeechClient = new googleSpeech.SpeechClient()
const TOKEN = process.env.TOKEN;

bot.login(TOKEN);

bot.on('ready', () => {
    console.info(`Logged in as ${bot.user.tag}!`);
});

bot.on('message', async msg => {
    if (!msg.guild) return;
    console.log(msg.content);
    //if(msg.mentions.members)
    let sender = msg.member;
    if (msg.mentions.members.has(bot.user.id) && msg.content.includes("join")) {
        // Only try to join the sender's voice channel if they are in one themselves
        if (sender.voice.channel) {
            const connection = await sender.voice.channel.join();
            const receiver = connection.receiver
            let voiceChannel = sender.voice.channel
            connection.on('speaking', (user, speaking) => {
                if (speaking) {
                    console.log(`I'm listening to ${user.username}`)
                } else {
                    console.log(`I stopped listening to ${user.username}`)
                }
                const audioStream = receiver.createStream(user, { mode: 'pcm' })
                const requestConfig = {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 48000,
                    languageCode: 'en-US'
                }
                const request = {
                    config: requestConfig
                }
                const recognizeStream = googleSpeechClient
                    .streamingRecognize(request)
                    .on('error', console.error)
                    .on('data', response => {
                        const transcription = response.results
                            .map(result => result.alternatives[0].transcript)
                            .join('\n')
                            .toLowerCase()
                        console.log(`Transcription: ${transcription}`)
                        if (transcription === "mute everyone") {

                            for (const [memberID, member] of voiceChannel.members) {
                                if (memberID !== sender.id && memberID !== bot.user.id) {
                                    member.voice.setMute(true);
                                }
                            }
                            msg.channel.send('muted');
                        } else if (transcription === "unmute everyone") {

                            for (const [memberID, member] of voiceChannel.members) {
                                member.voice.setMute(false);
                            }
                            msg.channel.send('unmuted');
                        }
                    })

                const convertTo1ChannelStream = new ConvertTo1ChannelStream()

                audioStream.pipe(convertTo1ChannelStream).pipe(recognizeStream)

                audioStream.on('end', async() => {
                    console.log('audioStream end')
                })
            })
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    }
    if (msg.mentions.members.has(bot.user.id) && msg.content.includes("leave")) {
        // Only try to join the sender's voice channel if they are in one themselves
        if (sender.voice.channel) {
            const connection = await sender.voice.channel.leave();
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    }
    if (msg.content === 'mute all') {

        if (sender.voice.channel) {
            let channel = msg.guild.channels.cache.get(sender.voice.channelID);
            for (const [memberID, member] of channel.members) {
                member.voice.setMute(true);
            }
            msg.channel.send('muted everyone except you and bot');
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    } else if (msg.content === 'unmute all') {
        if (sender.voice.channel) {
            let channel = msg.guild.channels.cache.get(sender.voice.channelID);
            for (const [memberID, member] of channel.members) {
                member.voice.setMute(false);
            }
            msg.channel.send('unmuted');
        } else {
            msg.reply('You need to join a voice channel first!');
        }
    }

});


function convertBufferTo1Channel(buffer) {
    const convertedBuffer = Buffer.alloc(buffer.length / 2)

    for (let i = 0; i < convertedBuffer.length / 2; i++) {
        const uint16 = buffer.readUInt16LE(i * 4)
        convertedBuffer.writeUInt16LE(uint16, i * 2)
    }

    return convertedBuffer
}

class ConvertTo1ChannelStream extends Transform {
    constructor(source, options) {
        super(options)
    }

    _transform(data, encoding, next) {
        next(null, convertBufferTo1Channel(data))
    }
}
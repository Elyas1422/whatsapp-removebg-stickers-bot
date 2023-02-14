const config = require('./config/config.json');
const fs = require('fs');
const spawner = require('child_process').spawn;
const { Client, MessageMedia,LocalAuth, NoAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    restartOnAuthFail: true,
    ffmpegPath:"C:\\Program Files (x86)\\ffmpeg-5.1.2-essentials_build\\bin\\ffmpeg.exe",
    puppeteer: {
        executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [ '--no-sandbox', '--disable-setuid-sandbox' ]
    },
    authStrategy:new LocalAuth({ clientId: "client" })
});
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});
client.on('ready', () => {
    console.log(`${config.author} is ready to work :)`);
});
client.on('message', async (message) => {
    console.log(`you\'ve received a ${message.type}`);
    const mentions = await message.getMentions();
    let isMentioned=false;
    for (let c of mentions){
        if (c.id.user==client.info.wid.user)
            isMentioned=true;
    }

    //This code is used when user send picture and want to it as sticker with the background removed.
    if ((message.type=="image")&& isMentioned&& message.body.includes("-r")){
        const media = await message.downloadMedia();
        //Here we passing the picture to the python scribt which remove the background.
        const data_to_pass_in= `./upload/${Math.random()}.png`;
        fs.writeFile(data_to_pass_in,media.data,"base64",function (err) {
              if (err) {console.log(err);}});
        const python_process = spawner('python', ['./remove_bg.py', data_to_pass_in]);
        python_process.stdout.on('data', async (data) => {
        client.sendMessage(message.from, MessageMedia.fromFilePath(data.toString()), {
            sendMediaAsSticker: true,
            stickerName:(await message.getContact()).pushname,
            stickerAuthor:config.author
        }).then(() => {
            message.react('👍');
        });
        });
    }
    //below, used when the user send picture or video and want to conver it into sticker.
    else if ((message.type== "video"||message.type=="image")&& isMentioned) {
        try {
            const media = await message.downloadMedia();
            client.sendMessage(message.from, media, {
                sendMediaAsSticker: true,
                stickerName:(await message.getContact()).pushname,
                stickerAuthor:config.author
            }).then(() => {
                message.react('👍');
            });
        } catch(e){
            console.log('error'+ e);
        }
    }
    client.getChatById(message.id.remote).then(async (chat) => {
        await chat.sendSeen();
    });
});
client.initialize();
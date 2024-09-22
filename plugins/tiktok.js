const { fetchJson } = require('../lib/functions');
const config = require('../config');
const { cmd, commands } = require('../command');

let baseUrl = 'https://api.fgmods.xyz/api/downloader/tiktok';

cmd({
    pattern: "tiktok",
    alias: ["tt"],
    react: "🎥",
    desc: "download tt videos",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q || !q.startsWith("https://")) return reply("*Please provide a valid TikTok URL ❌*");
        m.react('👀');

        // Fetch data from the API
        let response = await fetchJson(`${baseUrl}?url=${q}&apikey=RNbsFYOe`);
        
        if (!response.success) {
            return reply(`*Error:* ${response.message}`);
        }

        let data = response.data; // Access the data object
        let desc = `
*✘🎟️ TikTok Download 🎟️✘*

*Title:* ${data.title}
*Region:* ${data.region}
*Size:* ${data.size || 'Undefined'}
*Duration:* ${data.duration || 'Undefined'}

🔢 *Select an option:*
1️⃣ *Video Options:*
   1.1 | 📼 No Watermark
   1.2 | 🎟️ With Watermark
2️⃣ *Audio Options:*
   2.1 | 🎶 Audio File
   2.2 | 📁 Document File

*URL:* ${q}
`;

        const sentMsg = await conn.sendMessage(from, { image: { url: data.cover }, caption: desc }, { quoted: mek });
        const messageID = sentMsg.key.id; // Save the message ID for later reference

        // Listen for the user's response
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;
            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const from = mek.key.remoteJid;

            // Check if the message is a reply to the previously sent message
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                // React to the user's reply
                await conn.sendMessage(from, { react: { text: '⬇️', key: mek.key } });

                // React to the upload (sending the file)
                await conn.sendMessage(from, { react: { text: '⬆️', key: mek.key } });

                if (messageType === '1.1') {
                    // Handle option 1.1 (no watermark)
                    await conn.sendMessage(from, { video: { url: data.no_wm }, mimetype: "video/mp4", caption: `> NO WATERMARK` }, { quoted: mek });
                } else if (messageType === '1.2') {
                    // Handle option 1.2 (with watermark)
                    await conn.sendMessage(from, { video: { url: data.wm }, mimetype: "video/mp4", caption: `> WITH WATERMARK` }, { quoted: mek });
                } else if (messageType === '2.1') {
                    // Handle option 2.1 (audio file)
                    await conn.sendMessage(from, { audio: { url: data.audio }, mimetype: "audio/mpeg" }, { quoted: mek });
                } else if (messageType === '2.2') {
                    // Handle option 2.2 (audio document)
                    await conn.sendMessage(from, { document: { url: data.audio }, mimetype: "audio/mpeg" }, { quoted: mek });
                }

                // React to the successful completion of the task
                await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
                console.log("Response sent successfully");
            }
        });
    } catch (e) {
        console.log(e);
        reply(`${e}`);
    }
});

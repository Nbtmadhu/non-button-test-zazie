const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command');

cmd({
    pattern: "scine",
    react: '📽️',
    category: "download",
    desc: "Scrape movie search results with Sinhala subtitles",
    filename: __filename
}, async (conn, m, mek, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query! (e.g., Deadpool)*');

        const searchUrl = `https://cineru.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        let results = [];

        $("article.item-list").each((index, element) => {
            const title = $(element).find("h2.post-box-title > a").text().trim();
            const postLink = $(element).find("h2.post-box-title > a").attr("href");
            const postDate = $(element).find("span.tie-date").text().trim();
            const imageUrl = $(element).find("div.post-thumbnail > a > img").attr("src");

            if (title && postLink) {
                results.push({
                    title,
                    postDate,
                    postLink,
                    imageUrl
                });
            }
        });

        if (results.length === 0) {
            return await reply(`No results found for: ${q}`);
        }

        let info = `🎬 Search Results for *${q}:*\n\n`;
        results.forEach((result, index) => {
            info += `*${index + 1}.* ${result.title}\n🗓️ Posted: ${result.postDate}\n🔗 Link: ${result.postLink}\n\n`;
        });

        const sentMsg = await conn.sendMessage(from, { text: info }, { quoted: mek });
        const messageID = sentMsg.key.id;

        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;
            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const from = mek.key.remoteJid;

            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;
            if (isReplyToSentMsg) {
                const selectedNumber = parseInt(messageType.trim());
                if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= results.length) {
                    const selectedResult = results[selectedNumber - 1];

                    const downloadPageUrl = selectedResult.postLink;
                    const downloadResponse = await axios.get(downloadPageUrl);
                    const $ = cheerio.load(downloadResponse.data);

                    const downloadLink = $('a#btn-download').attr('data-link');
                    if (!downloadLink) return await reply("🔍 No download link found.");

                    const fileName = "NBT.zip";
                    await conn.sendMessage(from, { document: { url: downloadLink }, mimetype: "application/zip", fileName: fileName, caption: "📥 Here is your download." }, { quoted: mek });

                } else {
                    await reply(`Please reply with a valid number from the list.`);
                }
            }
        });

    } catch (e) {
        reply('*Error occurred while scraping!*');
        console.error(e);
    }
});

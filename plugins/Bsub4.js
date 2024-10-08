const axios = require('axios');
const cheerio = require('cheerio');
const { cmd, commands } = require('../command');

// Command handler for searching Avatar episodes
cmd({
    pattern: "bsub4",
    react: '📑',
    category: "download",
    desc: "Scrape Avatar episodes from baiscope.lk",
    filename: __filename
}, async (conn, m, mek, { from, q, isDev, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query! (e.g., Avatar)*');

        // Construct the search URL
        const searchUrl = `https://www.baiscope.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        let episodes = [];

        // Scrape episode details (title, link, and image)
        $("article.elementor-post").each((index, element) => {
            const title = $(element).find("h5.elementor-post__title > a").text().trim(); // Trim whitespace
            const episodeLink = $(element).find("h5.elementor-post__title > a").attr("href");
            const imgUrl = $(element).find(".elementor-post__thumbnail img").attr("src");

            if (title && episodeLink && imgUrl) {
                episodes.push({
                    title,
                    episodeLink,
                    imgUrl
                });
            }
        });

        // If no episodes found
        if (episodes.length === 0) {
            return await reply(`No results found for: ${q}`);
        }

        // Prepare message info
        let info = `📺 Search Results for *${q}:*\n\n`;
        episodes.forEach((ep, index) => {
            info += `*${index + 1}.* ${ep.title}\n🔗 Link: ${ep.episodeLink}\n\n`;
        });

        // Send the compiled information
        const sentMsg = await conn.sendMessage(from, { text: info }, { quoted: mek });
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
                const selectedNumber = parseInt(messageType.trim());
                if (!isNaN(selectedNumber) && selectedNumber > 0 && selectedNumber <= episodes.length) {
                    const selectedEpisode = episodes[selectedNumber - 1];

                    // Fetch the episode page
                    const episodeResponse = await axios.get(selectedEpisode.episodeLink);
                    const $episodePage = cheerio.load(episodeResponse.data);

                    // Get the download link from the episode page
                    const downloadLink = $episodePage("a.dlm-buttons-button").attr("href");
                    
                    // Get the episode title to avoid spaces
                    const episodeTitle = $episodePage("h5.elementor-post__title > a").text().trim();

                    if (downloadLink) {
                        // Send the image of the selected episode along with the download link
                        await conn.sendMessage(from, {
                            image: { url: selectedEpisode.imgUrl },
                            caption: `🎬 *${episodeTitle}*\n🔗 Episode Link: ${selectedEpisode.episodeLink}\n⬇️ [Download Episode](${downloadLink})`
                        }, { quoted: mek });
                    } else {
                        await reply('*Download link not found for the selected episode.*');
                    }
                } else {
                    await reply('*Invalid selection. Please choose a valid number.*');
                }
            }
        });

    } catch (error) {
        console.error(error);
        await reply('*An error occurred while scraping the data.*');
    }
});

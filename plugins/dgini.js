const axios = require('axios');
const cheerio = require('cheerio');
const { cmd, commands } = require('../command');

// Command handler for searching cartoons
cmd({
    pattern: "dgini",
    react: '📑',
    category: "search",
    desc: "Scrape cartoon episodes",
    filename: __filename
}, async (conn, m, mek, { from, q, isDev, reply }) => {
    try {
        if (!q) return await reply('*Please provide a search query! (e.g., Garfield)*');

        // Construct the search URL
        const searchUrl = `https://ginisisilacartoon.net/search.php?q=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        let episodes = [];

        // Scrape episode details
        $("div.inner-video-cell").each((index, element) => {
            const title = $(element).find("div.video-title > a").attr("title");
            const postedTime = $(element).find("div.posted-time").text().trim();
            const episodeLink = $(element).find("div.video-title > a").attr("href");
            const imageUrl = $(element).find("div.inner-video-thumb-wrapper img").attr("src"); // Get episode image URL

            if (title && episodeLink) {
                episodes.push({
                    title,
                    postedTime,
                    episodeLink: `https://ginisisilacartoon.net${episodeLink}`,
                    imageUrl: imageUrl
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
            info += `*${index + 1}.* ${ep.title}\n🗓️ Posted: ${ep.postedTime}\n🔗 Link: ${ep.episodeLink}\n\n`;
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
                    
                    // Step 1: Scrape the episode link to get the player iframe
                    const episodePageResponse = await axios.get(selectedEpisode.episodeLink);
                    const $ = cheerio.load(episodePageResponse.data);

                    // Step 2: Extract the IFRAME src link
                    const iframeSrc = $('div#player-holder iframe').attr('src');
                    if (!iframeSrc) {
                        return await reply('Unable to retrieve the video link. Please try another episode.');
                    }

                    // Step 3: Send the selected episode details with image
                    const episodeInfo = `*${selectedEpisode.title}*\n🗓️ Posted: ${selectedEpisode.postedTime}\n🔗 [Watch Episode](${selectedEpisode.episodeLink})`;
                    const imageMessage = {
                        image: { url: selectedEpisode.imageUrl },
                        caption: episodeInfo
                    };
                    await conn.sendMessage(from, imageMessage, { quoted: mek });

                    // Step 4: Send the video/audio link as a document (e.g., .mp3 or .mp4)
                    const downloadUrl = iframeSrc; // Use the iframe src as the download link
                    await conn.sendMessage(from, {
                        document: { url: downloadUrl },
                        mimetype: "video/mp4",  // You can modify this to video/mpeg if it's a video file
                        fileName: `${selectedEpisode.title}.mp4`,
                        caption: `> Qᴜᴇᴇɴ-ᴢᴀᴢɪᴇ-ᴍᴅ ʙʏ ɴʙᴛ`
                    }, { quoted: mek });

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

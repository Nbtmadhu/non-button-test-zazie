const axios = require('axios');
const cheerio = require('cheerio');
const { cmd } = require('../command');

// Command to handle the URL input
cmd({
    pattern: "gini",
    desc: "Get the video link from the given URL.",
    category: "media",
    filename: __filename
}, async (conn, mek, m, { from, q }) => {
    try {
        // Check if the URL is from ginisisilacartoon.net
        if (!q || !q.includes("ginisisilacartoon.net")) {
            return conn.sendMessage(from, { text: "🔖  *Please provide a valid URL from ginisisilacartoon.net.*" }, { quoted: mek });
        }

        // Fetch the HTML from the provided URL
        const response = await axios.get(q);
        const html = response.data;

        // Load the HTML into cheerio
        const $ = cheerio.load(html);

        // Extract the IFRAME src link
        const iframeSrc = $('div#player-holder iframe').attr('src');
        // Extract the title from watch-contentHd
        const videoTitle = $('#watch-contentHd').text().trim();

        if (!iframeSrc) return conn.sendMessage(from, { text: "🔖  *No video link found.*" }, { quoted: mek });

        // Construct message to send back to user
        const desc = `🎥 *Title:* ${videoTitle}\n*Video Link:* ${iframeSrc}`;
        
        // Send the extracted link and title to the user
        await conn.sendMessage(from, { text: desc }, { quoted: mek });

    } catch (e) {
        console.log(e);
        conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

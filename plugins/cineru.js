const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "cineru",
    desc: "Get download link from the provided URL.",
    category: "download",
    filename: __filename
},
async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) return reply("🔖 Please provide a link.");

        // Fetch the webpage content
        const response = await axios.get(q);
        const html = response.data;

        // Load HTML with Cheerio
        const $ = cheerio.load(html);
        
        // Select the download link (adjust the selector based on the actual HTML structure)
        const downloadLink = $('a#btn-download').attr('data-link');

        if (!downloadLink) return reply("🔍 No download link found.");

        // Prepare the message with the ZIP file
        const fileName = "download.zip"; // Name for the ZIP file

        // Send the ZIP document
        await conn.sendMessage(from, { document: { url: downloadLink }, mimetype: "application/zip", fileName: fileName, caption: "📥 Here is your download." }, { quoted: mek });

    } catch (e) {
        console.log(e);
        reply(`An error occurred: ${e.message}`);
    }
});

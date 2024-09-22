const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

// Store user states
const userStates = {};

cmd({
    pattern: "gini",
    desc: "Search cartoon",
    category: "search",
    react: "🎨",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the cartoon." }, { quoted: mek });
        }

        // Clear previous state if a new search is started
        if (userStates[from]) {
            delete userStates[from];
        }

        // Fetch cartoon search results using the PHP link
        const searchUrl = `https://ginisisilacartoon.net/search.php?q=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        // Parse search results
        const cartoons = [];
        $('selector-for-cartoon-items').each((index, element) => {
            const title = $(element).find('selector-for-title').text().trim(); // Adjust selector for title
            const date = $(element).find('selector-for-date').text().trim(); // Adjust selector for posted date
            cartoons.push({ title, date });
        });

        if (!cartoons.length) {
            return await conn.sendMessage(from, { text: "No cartoons found." }, { quoted: mek });
        }

        const cartoonList = cartoons.map((cartoon) => `• ${cartoon.title}\n  Posted ${cartoon.date}`).join("\n\n");
        const message = `*Ginisisila Search Results*\n\n${cartoonList}`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

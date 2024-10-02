const axios = require('axios');
const cheerio = require('cheerio');
const { cmd, commands } = require('../command');

// Command handler for searching Avatar episodes
cmd({
    pattern: "bsub",
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

        // Scrape episode details
        $("article.elementor-post").each((index, element) => {
            const title = $(element).find("h5.elementor-post__title > a").text();
            const episodeLink = $(element).find("h5.elementor-post__title > a").attr("href");

            if (title && episodeLink) {
                episodes.push({
                    title,
                    episodeLink
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

        await reply(info);
    } catch (error) {
        console.error(error);
        await reply('*An error occurred while scraping the data.*');
    }
});

const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "mx",
    alias: ["ytssearch"],
    desc: "Search for movies on YTS",
    category: "search",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Fetch the search results from yts.mx
        const searchUrl = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        // Extract movie titles
        const movies = [];
        $('.browse-movie-wrap').each((index, element) => {
            const title = $(element).find('.browse-movie-title').text();
            if (title) {
                movies.push(title);
            }
        });

        if (!movies.length) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        // Create a list of movies
        const movieList = movies.map((title, index) => `*${index + 1}.* 🎬 ${title}`).join("\n");
        const message = `*YTS Movie Search Results:*\n\n${movieList}`;

        // Send the search results
        await conn.sendMessage(from, { text: message }, { quoted: mek });

    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

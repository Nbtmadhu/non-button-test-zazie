const { cmd } = require('../command'); // Ensure this matches your command handler
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "csubzsearch",
    alias: ["csubz", "searchmovie"],
    desc: "Search movies from Cinesubz",
    category: "search",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Scrape Cinesubz for movie search results
        const searchUrl = `https://cinesubz.co/?s=${encodeURIComponent(q)}`;
        const { data } = await axios.get(searchUrl);
        const $ = cheerio.load(data);

        let movies = [];
        $('.post').each((index, element) => {
            const title = $(element).find('.entry-title a').text();
            movies.push(title);
        });

        if (movies.length === 0) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = movies.map((title, index) => `*${index + 1}.* ${title}`).join("\n");
        const message = `*Cinesubz Movie Search*\n\nMovies Found:\n${movieList}`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });
    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

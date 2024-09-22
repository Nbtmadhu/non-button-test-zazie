const { cmd } = require('../command'); // Ensure this matches your command handler
const axios = require('axios');
const cheerio = require('cheerio');

async function cinesubzSearch(query) {
    const URL = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
    return new Promise((resolve, reject) => {
        axios.get(URL)
            .then((response) => {
                const $ = cheerio.load(response.data);
                let titles = [];
                $('.post').each((index, element) => {
                    const title = $(element).find('.entry-title a').text();
                    titles.push(title);
                });
                resolve(titles);
            })
            .catch((error) => {
                reject({ status: false, error: error.message });
            });
    });
}

// Command to search Cinesubz
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

        const titles = await cinesubzSearch(q);

        if (titles.length === 0) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = titles.map((title, index) => `*${index + 1}.* ${title}`).join("\n");
        const message = `*Cinesubz Movie Search*\n\nMovies Found:\n${movieList}`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });
    } catch (error) {
        console.log("Error: ", error);
        return await conn.sendMessage(from, { text: `An error occurred: ${error.message}` }, { quoted: mek });
    }
});

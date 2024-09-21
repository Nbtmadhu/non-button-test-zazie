const { cmd } = require('../command');
const config = require('../config');
const { fetchJson, sleep } = require('../lib/functions');
const prabathApi = "6467ad0b29"; // API key || 2 months
const api = "https://prabath-md-api.up.railway.app/api/"; // Base API link

// Movie Search Command
cmd({
    pattern: "mv2",
    alias: ["mv", "moviedl", "mvdl", "cinesub", "cinesubz"],
    desc: "movie",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, reply }) => {
    try {
        // Fetch movie search results
        if (!q) return reply("Please provide the name of the movie.");
        const searchData = await fetchJson(`${api}cinesearch?q=${q}&apikey=${prabathApi}`);
        if (!searchData.data || !searchData.data.data.length) return reply("No results found.");

        // Display the search results with more visual appeal
        const allMovies = searchData.data.data.map((app, index) => {
            return `📽️ *${index + 1}. ${app.title}*\n🗓️ Year: ${app.year}\n🔗 [Link](${app.link})\n`;
        });
        const message = `*🎬 Cinesubz Movie Search 🎬*\n\n*Search Results for: ${q}*\n_________________________\n\n${allMovies.join('')}`;
        await conn.sendMessage(from, { text: message }, { quoted: mek });

        // Listen for user response to select the movie
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            if (!messageType || isNaN(messageType)) return;

            const selectedMovieIndex = parseInt(messageType) - 1;
            if (selectedMovieIndex < 0 || selectedMovieIndex >= searchData.data.data.length) {
                return reply("Invalid selection.");
            }

            const selectedMovie = searchData.data.data[selectedMovieIndex];
            const desc = await fetchJson(`${api}cinemovie?url=${selectedMovie.link}&apikey=${prabathApi}`);

            const movieTitle = desc.data.mainDetails.maintitle;
            const releaseDate = desc.data.mainDetails.dateCreated;
            const directorName = desc.data.moviedata.director;
            const country = desc.data.mainDetails.country;
            const duration = desc.data.mainDetails.runtime;
            const imdbRating = desc.data.moviedata.imdbRating;
            const posterUrl = desc.data.mainDetails.poster;
            const url = selectedMovie.link;

            const qualities = desc.data.dllinks.directDownloadLinks.map((link, i) => `${i + 1}. ${link.quality} (${link.size})`).join("\n");

            let template = `
🎬 *Movie:* ${movieTitle}
🗓️ *Release Date:* ${releaseDate}
🎥 *Director:* ${directorName}
🌍 *Country:* ${country}
⏳ *Duration:* ${duration}
⭐ *IMDB Rating:* ${imdbRating}
🔗 *URL:* ${url}

*Available Qualities:* 
${qualities}
`;

            // Send movie poster along with details
            await conn.sendMessage(from, { image: { url: posterUrl }, caption: template }, { quoted: mek });

            // Listen for user response to select the quality
            conn.ev.on('messages.upsert', async (messageUpdate) => {
                const mek = messageUpdate.messages[0];
                if (!mek.message) return;

                const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
                if (!messageType || isNaN(messageType)) return;

                const selectedQualityIndex = parseInt(messageType) - 1;
                if (selectedQualityIndex < 0 || selectedQualityIndex >= desc.data.dllinks.directDownloadLinks.length) {
                    return reply("Invalid quality selection.");
                }

                const selectedQuality = desc.data.dllinks.directDownloadLinks[selectedQualityIndex];
                const sizeLimit = 2; // 2 GB limit for WhatsApp

                if (parseSize(selectedQuality.size) > sizeLimit) {
                    return reply("File size exceeds the 2GB limit, unable to send via WhatsApp.");
                }

                await reply(`⬇️ *Downloading:*\n\n📥 *Name:* ${movieTitle}\n\n🔥 *File size:* ${selectedQuality.size}`);
                await sleep(2000);
                await reply("⬆️ *Uploading your movie...*");

                const downloadLink = await fetchJson(`${api}cinedownload?url=${selectedQuality.link}&apikey=${prabathApi}`);
                await conn.sendMessage(from, {
                    document: { url: downloadLink.data.direct },
                    mimetype: downloadLink.data.mimeType,
                    fileName: downloadLink.data.fileName,
                    caption: "> Powered by Queen-Zazie-MD"
                });
            });
        });
    } catch (e) {
        console.log(e);
        reply("An error occurred.");
    }
});

function parseSize(sizeStr) {
    const sizeMatch = sizeStr.match(/^([\d.]+)\s*GB$/);
    return sizeMatch ? parseFloat(sizeMatch[1]) : 0;
}

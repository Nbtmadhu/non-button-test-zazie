const { cmd } = require('../command');
const config = require('../config');
const { fetchJson, sleep } = require('../lib/functions');
const prabathApi = "6467ad0b29"; // API key || 2 months
const api = "https://prabath-md-api.up.railway.app/api/"; // Base API link

cmd({
    pattern: "nbt",
    alias: ["mv", "moviedl", "mvdl", "cinesub", "cinesubz"],
    desc: "movie",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q }) => {
    try {
        if (!q) {
            return await reply("Please provide the name of the movie.");
        }

        // Fetch movie search results
        const data = await fetchJson(`${api}cinesearch?q=${q}&apikey=${prabathApi}`);
        const allMovies = data.data.data;

        if (!allMovies.length) {
            return await reply("No movies found.");
        }

        const movieList = allMovies.map((app, index) => {
            return `${index + 1}. 🎬 ${app.title}`;
        }).join("\n");

        const message = '*Cinesubz Movie SEARCH*\n____________________________\n\n*Movies Found:*\n\n' + movieList;
        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });
        const messageID = sentMsg.key.id; // Save the message ID for later reference

        // Listen for the user's response
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const userResponse = parseInt(messageType); // Convert user response to number
            const selectedMovie = allMovies[userResponse - 1];

            // If the response is valid
            if (selectedMovie) {
                const movieDetails = await fetchJson(`${api}cinemovie?url=${selectedMovie.link}&apikey=${prabathApi}`);
                const desc = movieDetails.data;

                let movieTitle = desc.mainDetails.maintitle;
                let releaseDate = desc.mainDetails.dateCreated;
                let directorName = desc.moviedata.director;
                let country = desc.mainDetails.country;
                let duration = desc.mainDetails.runtime;
                let url = selectedMovie.link;
                let imdbRating = desc.moviedata.imdbRating;
                let qualities = desc.dllinks.directDownloadLinks.map((link, index) => `> ${index + 1}. ${link.quality} (${link.size})`).join("\n");

                let detailMessage = `
- Movie: ${movieTitle}
- Release Date: ${releaseDate}
- Director: ${directorName}
- Country: ${country}
- Duration: ${duration}
- IMDB Rating: ${imdbRating}
- Url: ${url}

*Available Qualities:* 

${qualities}
`;

                const detailsMsg = await conn.sendMessage(from, { text: detailMessage }, { quoted: mek });
                const detailsMessageID = detailsMsg.key.id; // Save the message ID for the quality selection

                // Listen for quality selection
                conn.ev.on('messages.upsert', async (qualityUpdate) => {
                    const qualityMek = qualityUpdate.messages[0];
                    if (!qualityMek.message) return;

                    const qualityType = parseInt(qualityMek.message.conversation || qualityMek.message.extendedTextMessage?.text);
                    const selectedQuality = desc.dllinks.directDownloadLinks[qualityType - 1];

                    if (selectedQuality) {
                        if (parseSize(selectedQuality.size) > 2) {
                            return await reply("Max size 2GB, so can't send via WhatsApp.");
                        } else {
                            const downloadLink = await fetchJson(`${api}cinedownload?url=${selectedQuality.link}&apikey=${prabathApi}`);
                            await conn.sendMessage(from, { document: { url: downloadLink.data.direct }, mimetype: downloadLink.data.mimeType, fileName: downloadLink.data.fileName, caption: "> Cinesubz Movie Download" });
                        }
                    } else {
                        await reply("Invalid quality selection.");
                    }
                });
            } else {
                await reply("Invalid movie selection.");
            }
        });
    } catch (e) {
        console.log(e);
    }
});

// Utility function to parse size
function parseSize(sizeStr) {
    let sizeMatch = sizeStr.match(/^([\d.]+)\s*GB$/);
    return sizeMatch ? parseFloat(sizeMatch[1]) : 0;
}

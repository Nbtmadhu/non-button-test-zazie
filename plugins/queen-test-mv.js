const {cmd} = require('../command')
const config = require('../config');
const {fetchJson,sleep} = require('../lib/functions')
const prabathApi = "6467ad0b29" // api key || 2 month
const api = "https://prabath-md-api.up.railway.app/api/" // base api link
cmd({
    pattern: "queen",
    alias: ["mv", "moviedl", "mvdl", "cinesub", "cinesubz"],
    desc: "movie",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Fetch movie search results
        const data = await fetchJson(`${api}cinesearch?q=${q}&apikey=${prabathApi}`);
        const allMovies = data.data.data;

        if (!allMovies.length) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = allMovies.map((app, index) => {
            return `*${index + 1}.* 🎬 ${app.title}`;
        }).join("\n");

        const message = `*Cinesubz Movie SEARCH*\n` +
                        `____________________________\n\n` +
                        `*Movies Found:*\n\n` +
                        `${movieList}\n\n` +
                        `Please reply with the number of the movie you want.`;

        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });
        const messageID = sentMsg.key.id;

        // Listen for the user's response to select a movie
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const userResponse = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const userSelectedNumber = parseInt(userResponse);

            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                const selectedMovie = allMovies[userSelectedNumber - 1];

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
                let imageUrl = desc.mainDetails.imageUrl;

                let detailMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${movieTitle}
*Release Date:* ${releaseDate}
*Director:* ${directorName}
*Country:* ${country}
*Duration:* ${duration}
*IMDB Rating:* ${imdbRating}
*Url:* ${url}

*Available Qualities:* 
=========================
${qualities}
`;

                // Send the image with the movie details as the caption
                await conn.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: detailMessage,
                    footer: "Powered by Cinesubz"
                }, { quoted: mek });

                // Listen for quality selection
                conn.ev.on('messages.upsert', async (qualityUpdate) => {
                    const qualityMek = qualityUpdate.messages[0];
                    if (!qualityMek.message) return;

                    const qualityType = parseInt(qualityMek.message.conversation || qualityMek.message.extendedTextMessage?.text);
                    const selectedQuality = desc.dllinks.directDownloadLinks[qualityType - 1];

                    if (qualityMek.key.remoteJid === from) {
                        const downloadLink = await fetchJson(`${api}cinedownload?url=${selectedQuality.link}&apikey=${prabathApi}`);

                        // Send the document
                        const downloadMessage = {
                            document: { url: downloadLink.data.direct },
                            mimetype: downloadLink.data.mimeType,
                            fileName: downloadLink.data.fileName,
                            caption: `Movie downloaded successfully for quality selection number ${qualityType}.`
                        };

                        await conn.sendMessage(from, downloadMessage);
                        
                        // Set success reaction
                        await conn.sendMessage(from, { react: { text: '✅', key: qualityMek.key } });
                    }
                });
            }
        });
    } catch (e) {
        console.log(e);
    }
});

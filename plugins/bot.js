const { cmd } = require('../command');
const config = require('../config');
const { fetchJson } = require('../lib/functions');
const apiBaseUrl = "https://yts.mx/api/v2/";
const torrentBaseUrl = "https://yts.mx/torrent/download/";

cmd({
    pattern: "mx",
    alias: ["moviedl"],
    desc: "Download movie",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Fetch movie search results
        const searchResponse = await fetchJson(`${apiBaseUrl}list_movies.json?query_term=${encodeURIComponent(q)}`);
        if (!searchResponse || !searchResponse.data || !searchResponse.data.movies) {
            return await conn.sendMessage(from, { text: "No movies found or invalid response from the server." }, { quoted: mek });
        }

        const allMovies = searchResponse.data.movies;
        if (!allMovies.length) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = allMovies.map((movie, index) => `*${index + 1}.* 🎬 ${movie.title}`).join("\n");
        const message = `*YTS Movie Search*\n\nMovies Found:\n${movieList}\n\nPlease reply with the number of the movie you want.`;

        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });
        const messageID = sentMsg.key.id;

        // Listen for the user's movie selection
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const userResponse = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const userSelectedNumber = parseInt(userResponse);
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg && userSelectedNumber && userSelectedNumber <= allMovies.length && userSelectedNumber > 0) {
                const selectedMovie = allMovies[userSelectedNumber - 1];

                // Fetch movie details
                const movieDetailsResponse = await fetchJson(`${apiBaseUrl}movie_details.json?movie_id=${selectedMovie.id}`);
                if (!movieDetailsResponse || !movieDetailsResponse.data || !movieDetailsResponse.data.movie) {
                    return await conn.sendMessage(from, { text: "Error fetching movie details." }, { quoted: mek });
                }

                const desc = movieDetailsResponse.data.movie;
                const title = desc.title;
                const year = desc.year;
                const rating = desc.rating;
                const summary = desc.summary || "Description not available.";
                const language = desc.language || "N/A";
                const dateUploaded = desc.date_uploaded || "N/A";
                const imageUrl = desc.medium_cover_image;

                let qualities = desc.torrents.map((torrent, index) => `> ${index + 1}. ${torrent.quality}`).join("\n");

                const detailMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${title}
*Year:* ${year}
*Rating:* ${rating}
*Summary:* ${summary}
*Language:* ${language}
*Date Uploaded:* ${dateUploaded}

*Available Qualities:* 
=========================
${qualities}
`;

                await conn.sendMessage(from, { 
                    image: { url: imageUrl }, 
                    caption: detailMessage 
                }, { quoted: mek });

                // Listen for the user's quality selection
                conn.ev.on('messages.upsert', async (messageUpdate2) => {
                    const mekQualityResponse = messageUpdate2.messages[0];
                    if (!mekQualityResponse.message) return;

                    const qualityResponse = mekQualityResponse.message.conversation || mekQualityResponse.message.extendedTextMessage?.text;
                    const userSelectedQuality = parseInt(qualityResponse);
                    const isReplyToQualityMsg = mekQualityResponse.message.extendedTextMessage && mekQualityResponse.message.extendedTextMessage.contextInfo.stanzaId === messageID;

                    if (isReplyToQualityMsg && userSelectedQuality && userSelectedQuality <= desc.torrents.length && userSelectedQuality > 0) {
                        const selectedTorrent = desc.torrents[userSelectedQuality - 1];

                        // Construct the torrent download URL
                        const torrentDownloadUrl = `${torrentBaseUrl}${selectedTorrent.hash}`;

                        // Send the document (torrent file link)
                        await conn.sendMessage(from, {
                            document: { url: torrentDownloadUrl },
                            fileName: `${title} - ${selectedTorrent.quality}.torrent`,
                            mimetype: 'application/x-bittorrent',
                            caption: `Here is your movie "${title}" in quality ${selectedTorrent.quality}. Enjoy!`
                        }, { quoted: mekQualityResponse });
                    }
                });
            }
        });
    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

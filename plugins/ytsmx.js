const { cmd } = require('../command');
const config = require('../config');
const { fetchJson } = require('../lib/functions');
const apiBaseUrl = "https://yts.mx/api/v2/";
const torrentBaseUrl = "https://yts.mx/torrent/download/";

cmd({
    pattern: "ytsmx",
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

            if (isReplyToSentMsg && userSelectedNumber && userSelectedNumber <= allMovies.length) {
                const selectedMovie = allMovies[userSelectedNumber - 1];

                // Fetch movie details
                const movieDetailsResponse = await fetchJson(`${apiBaseUrl}movie_details.json?movie_id=${selectedMovie.id}`);
                if (!movieDetailsResponse || !movieDetailsResponse.data || !movieDetailsResponse.data.movie) {
                    return await conn.sendMessage(from, { text: "Error fetching movie details." }, { quoted: mek });
                }

                const desc = movieDetailsResponse.data.movie;
                const title = desc.title;
                const imageUrl = desc.large_cover_image;

                // Combine movie details and available qualities into one message
                let qualities = desc.torrents.map((torrent, index) => `> ${index + 1}. ${torrent.quality}`).join("\n");
                const detailMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${title}
*Year:* ${desc.year}
*Rating:* ${desc.rating}
*Summary:* ${desc.summary || "Description not available."}
*Language:* ${desc.language || "N/A"}
*Date Uploaded:* ${desc.date_uploaded || "N/A"}

*Available Qualities:* 
=========================
${qualities}
`;

                await conn.sendMessage(from, { text: detailMessage, image: { url: imageUrl } }, { quoted: mek });

                // Listen for the user's quality selection
                const qualitySelectionHandler = async (messageUpdate2) => {
                    const mekQualityResponse = messageUpdate2.messages[0];
                    if (!mekQualityResponse.message) return;

                    const qualityResponse = mekQualityResponse.message.conversation || mekQualityResponse.message.extendedTextMessage?.text;
                    const userSelectedQuality = parseInt(qualityResponse);
                    const isReplyToQualityMsg = mekQualityResponse.message.extendedTextMessage && mekQualityResponse.message.extendedTextMessage.contextInfo.stanzaId === sentMsg.key.id;

                    if (isReplyToQualityMsg && userSelectedQuality && userSelectedQuality <= desc.torrents.length) {
                        const selectedTorrent = desc.torrents[userSelectedQuality - 1];

                        // Construct the torrent download URL
                        const torrentDownloadUrl = `${torrentBaseUrl}${selectedTorrent.hash}`;

                        // Send the download link directly
                        await conn.sendMessage(from, { text: torrentDownloadUrl }, { quoted: mekQualityResponse });

                        // Remove the event listener after handling the response
                        conn.ev.removeListener('messages.upsert', qualitySelectionHandler);
                    }
                };

                // Add the event listener for quality selection
                conn.ev.on('messages.upsert', qualitySelectionHandler);
            }
        });
    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

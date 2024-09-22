const { cmd } = require('../command');
const config = require('../config');
const { fetchJson } = require('../lib/functions');
const apiBaseUrl = "https://yts.mx/api/v2/";
const torrentBaseUrl = "https://yts.mx/torrent/download/";

// Store user states
const userStates = {};

cmd({
    pattern: "ytsdl",
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

        // Clear previous state if a new search is started
        if (userStates[from]) {
            delete userStates[from];
        }

        const currentSearchId = Date.now(); // Unique ID for current search

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

        // Set user state for the movie list
        userStates[from] = { movies: allMovies, messageID, currentSearchId };

        // Function to handle movie selection
        const movieSelectionHandler = async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;

            const userResponse = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const userSelectedNumber = parseInt(userResponse);
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            // Check if the message is replying to the correct movie search and number is valid
            if (isReplyToSentMsg && userSelectedNumber && userSelectedNumber <= allMovies.length && userStates[from].currentSearchId === currentSearchId) {
                const selectedMovie = allMovies[userSelectedNumber - 1];
                const movieDetailsResponse = await fetchJson(`${apiBaseUrl}movie_details.json?movie_id=${selectedMovie.id}`);
                if (!movieDetailsResponse || !movieDetailsResponse.data || !movieDetailsResponse.data.movie) {
                    return await conn.sendMessage(from, { text: "Error fetching movie details." }, { quoted: mek });
                }

                const desc = movieDetailsResponse.data.movie;
                const title = desc.title;
                const imageUrl = desc.large_cover_image;

                let qualitiesMessage = desc.torrents.length > 0 
                    ? desc.torrents.map((torrent, index) => `> ${index + 1}. ${torrent.quality}`).join("\n") 
                    : "No qualities available.";

                let detailMessage = `
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
${qualitiesMessage}
`;

                await conn.sendMessage(from, { text: detailMessage, image: { url: imageUrl } }, { quoted: mek });

                // Store current movie details in user state
                userStates[from].currentMovie = desc;

                // Function to handle quality selection
                const qualitySelectionHandler = async (messageUpdate2) => {
                    const mekQualityResponse = messageUpdate2.messages[0];
                    if (!mekQualityResponse.message) return;

                    const qualityResponse = mekQualityResponse.message.conversation || mekQualityResponse.message.extendedTextMessage?.text;
                    const userSelectedQuality = parseInt(qualityResponse);

                    if (userSelectedQuality && userSelectedQuality <= desc.torrents.length && userStates[from].currentSearchId === currentSearchId) {
                        const selectedTorrent = desc.torrents[userSelectedQuality - 1];
                        const torrentDownloadUrl = `${torrentBaseUrl}${selectedTorrent.hash}`;

                        // Send the download link directly
                        await conn.sendMessage(from, { text: torrentDownloadUrl }, { quoted: mekQualityResponse });
                    }
                };

                // Add the event listener for quality selection, scoped to the user
                conn.ev.on('messages.upsert', async (update) => {
                    if (update.messages[0].key.remoteJid === from && userStates[from] && userStates[from].currentMovie) {
                        await qualitySelectionHandler(update);
                    }
                });

                // Remove the movie selection handler after the movie is selected
                conn.ev.removeListener('messages.upsert', movieSelectionHandler);
            }
        };

        // Add the event listener for movie selection, scoped to the user
        conn.ev.on('messages.upsert', async (update) => {
            if (update.messages[0].key.remoteJid === from && userStates[from] && !userStates[from].currentMovie) {
                await movieSelectionHandler(update);
            }
        });

    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

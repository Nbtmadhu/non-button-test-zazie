const { cmd } = require('../command');
const axios = require('axios');

cmd({
    pattern: "mx",
    desc: "Search for movies on YTS",
    category: "download",
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Search for the movie
        const searchResponse = await axios.get(`https://yts.mx/api/v2/list_movies.json?query_term=${encodeURIComponent(q)}`);
        const movies = searchResponse.data.data.movies;

        if (!movies || movies.length === 0) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = movies.map((movie, index) => `*${index + 1}.* 🎬 ${movie.title} (${movie.year})`).join("\n");
        const message = `*YTS Movie Search Results:*\n\n${movieList}\n\nPlease reply with the number of the movie you want.`;

        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });
        const messageID = sentMsg.key.id; // Save the message ID for later reference

        // Listen for the user's response
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mekResponse = messageUpdate.messages[0];
            if (!mekResponse.message) return;

            const userResponse = mekResponse.message.conversation || mekResponse.message.extendedTextMessage?.text;
            const userSelectedNumber = parseInt(userResponse);

            // Check if the message is a reply to the previously sent message
            const isReplyToSentMsg = mekResponse.message.extendedTextMessage && mekResponse.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                if (isNaN(userSelectedNumber) || userSelectedNumber < 1 || userSelectedNumber > movies.length) {
                    return await conn.sendMessage(from, { text: "Invalid movie selection. Please try again." }, { quoted: mek });
                }

                const selectedMovie = movies[userSelectedNumber - 1];

                // Extract movie details directly from the API response
                const movieDetailsResponse = await axios.get(`https://yts.mx/api/v2/movie_details.json?movie_id=${selectedMovie.id}`);
                const movieDetails = movieDetailsResponse.data.data.movie;

                // Extract necessary details
                const title = movieDetails.title;
                const year = movieDetails.year;
                const rating = movieDetails.rating || "N/A";
                const summary = movieDetails.summary || "No summary available.";
                const language = movieDetails.language || "N/A";
                const dateUploaded = movieDetails.date_uploaded || "N/A";
                const imageUrl = movieDetails.large_cover_image; // Movie image
                const qualities = movieDetails.torrents.map(torrent => torrent.quality).join(', '); // Available qualities

                const detailsMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${title || "N/A"}
*Year:* ${year || "N/A"}
*Rating:* ${rating || "N/A"}
*Summary:* ${summary}
*Language:* ${language}
*Date Uploaded:* ${dateUploaded}
*Available Qualities:* ${qualities.length ? qualities : "No quality information available."}
=========================
🎬 Enjoy your movie!
`;

                // Send movie details with image
                await conn.sendMessage(from, {
                    image: { url: imageUrl },
                    caption: detailsMessage
                }, { quoted: mek });
            }
        });
    } catch (err) {
        console.error("Error fetching movie details:", err.message);
        await conn.sendMessage(from, { text: "Error fetching movie details. Please try again later." }, { quoted: mek });
    }
});

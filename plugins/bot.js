const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "yts",
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

                // Fetch movie details
                const movieResponse = await axios.get(selectedMovie.url); // Use the correct movie URL
                const moviePage = cheerio.load(movieResponse.data);

                // Extract movie details
                const title = moviePage('title').text().trim() || "N/A"; // Adjust selector as needed
                const year = moviePage('.release-year').text().trim() || "N/A"; // Adjust selector as needed
                const rating = moviePage('.rating').text().trim() || "N/A"; // Adjust selector as needed
                const summary = moviePage('.summary').text().trim() || "No summary available."; // Adjust selector for description
                const language = moviePage('.language').text().trim() || "N/A"; // Adjust selector for language
                const dateUploaded = moviePage('.date_uploaded').text().trim() || "N/A"; // Adjust selector for date uploaded
                
                // Extract available qualities and their sizes
                const qualities = [];
                moviePage('.quality').each((index, element) => {
                    const qualityText = moviePage(element).text().trim();
                    const sizeText = moviePage(element).siblings('.size').text().trim(); // Adjust selector for size
                    if (qualityText && sizeText) {
                        qualities.push(`${qualityText} (${sizeText})`);
                    }
                });

                const detailsMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${title || "N/A"}
*Year:* ${year || "N/A"}
*Rating:* ${rating || "N/A"}
*Summary:* ${summary || "N/A"}
*Language:* ${language || "N/A"}
*Date Uploaded:* ${dateUploaded || "N/A"}
*Available Qualities:* ${qualities.length ? qualities.join(', ') : "No quality information available."}
=========================
🎬 Enjoy your movie!
`;

                // Send movie details
                await conn.sendMessage(from, { text: detailsMessage }, { quoted: mek });
            }
        });
    } catch (err) {
        console.error("Error fetching movie details:", err.message);
        await conn.sendMessage(from, { text: "Error fetching movie details. Please try again later." }, { quoted: mek });
    }
});

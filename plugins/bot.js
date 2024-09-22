const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

cmd({
    pattern: "mx",
    alias: ["ytssearch"],
    desc: "Search for movies on YTS",
    category: "search",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, q }) => {
    try {
        if (!q) {
            return await conn.sendMessage(from, { text: "Please provide the name of the movie." }, { quoted: mek });
        }

        // Fetch the search results from yts.mx
        const searchUrl = `https://yts.mx/browse-movies/${encodeURIComponent(q)}/all/all/0/latest/0/all`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        // Extract movie titles and links
        const movies = [];
        $('.browse-movie-wrap').each((index, element) => {
            const title = $(element).find('.browse-movie-title').text();
            const year = $(element).find('.browse-movie-year').text();
            const link = $(element).find('.browse-movie-title').attr('href');
            if (title && link) {
                movies.push({ title, year, link: `https://yts.mx${link}` });
            }
        });

        if (!movies.length) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        // Create a list of movies
        const movieList = movies.map((movie, index) => `*${index + 1}.* 🎬 ${movie.title} (${movie.year})`).join("\n");
        const message = `*YTS Movie Search Results:*\n\n${movieList}`;

        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });
        const messageID = sentMsg.key.id; // Save the message ID for later reference

        // Listen for the user's response
        conn.ev.on('messages.upsert', async (messageUpdate) => {
            const mek = messageUpdate.messages[0];
            if (!mek.message) return;
            const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
            const from = mek.key.remoteJid;
            const sender = mek.key.participant || mek.key.remoteJid;

            // Check if the message is a reply to the previously sent message
            const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

            if (isReplyToSentMsg) {
                const userSelectedNumber = parseInt(messageType);
                
                if (userSelectedNumber && userSelectedNumber <= movies.length) {
                    const selectedMovie = movies[userSelectedNumber - 1];
                    
                    // Fetch movie details from the movie link
                    const movieResponse = await axios.get(selectedMovie.link);
                    const moviePage = cheerio.load(movieResponse.data);

                    // Extract movie details
                    const description = moviePage('.movie-description').text().trim() || "No description available.";
                    const qualities = [];
                    moviePage('.quality').each((index, element) => {
                        const quality = $(element).text().trim();
                        if (quality) {
                            qualities.push(quality);
                        }
                    });

                    const detailsMessage = `
🌟 *Movie Details* 🌟
=========================
*Title:* ${selectedMovie.title}
*Year:* ${selectedMovie.year}
*Description:* ${description}
*Available Qualities:* ${qualities.length ? qualities.join(', ') : "No quality information available."}
`;

                    // Send movie details
                    await conn.sendMessage(from, { text: detailsMessage }, { quoted: mek });
                } else {
                    await conn.sendMessage(from, { text: "Invalid movie selection. Please try again." }, { quoted: mek });
                }
            }
        });
    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

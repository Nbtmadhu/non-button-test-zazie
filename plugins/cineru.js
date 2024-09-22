const { cmd } = require('../command');
const axios = require('axios');
const cheerio = require('cheerio');

// Store user states
const userStates = {};

cmd({
    pattern: "sinhala",
    desc: "Search movies",
    category: "search",
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

        // Fetch movie search results
        const searchUrl = `https://cineru.lk/?s=${encodeURIComponent(q)}`;
        const response = await axios.get(searchUrl);
        const $ = cheerio.load(response.data);

        // Parse search results
        const movies = [];
        $('.search-results .post').each((index, element) => {
            const title = $(element).find('.post-title').text();
            const link = $(element).find('a').attr('href');
            movies.push({ title, link });
        });

        if (!movies.length) {
            return await conn.sendMessage(from, { text: "No movies found." }, { quoted: mek });
        }

        const movieList = movies.map((movie, index) => `*${index + 1}.* 🎬 ${movie.title}`).join("\n");
        const message = `*Movie Search Results*\n\n${movieList}\n\nReply with the number of the movie to get the zip file.`;

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

            if (isReplyToSentMsg && !isNaN(messageType)) {
                const index = parseInt(messageType) - 1;
                if (index >= 0 && index < movies.length) {
                    const selectedMovie = movies[index];

                    // Fetch the actual movie page to get the zip URL
                    const moviePageResponse = await axios.get(selectedMovie.link);
                    const $page = cheerio.load(moviePageResponse.data);

                    // Extract the zip file URL after clicking the "සිංහල උපසිරැසි" button
                    const zipLink = $page('a.btn-download[data-link]').attr('data-link'); // Adjust selector if needed

                    await conn.sendMessage(from, { text: `Here is the download link for ${selectedMovie.title}: ${zipLink}` }, { quoted: mek });
                } else {
                    await conn.sendMessage(from, { text: "Invalid selection. Please try again." }, { quoted: mek });
                }
            }
        });

    } catch (e) {
        console.log("Error: ", e.message);
        return await conn.sendMessage(from, { text: `An error occurred: ${e.message}` }, { quoted: mek });
    }
});

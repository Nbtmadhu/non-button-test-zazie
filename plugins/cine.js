const { cmd } = require('../command');
const config = require('../config');
const { fetchJson, sleep } = require('../lib/functions');
const prabathApi = "6467ad0b29"; // API key
const api = "https://prabath-md-api.up.railway.app/api/"; // Base API link

let pendingRequests = {};

cmd({
    pattern: "csub",
    alias: ["mv", "moviedl", "mvdl", "cinesub", "cinesubz"],
    desc: "movie",
    category: "download",
    react: "🎬",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) {
            return await reply("Please provide the name of the movie.");
        }

        const data = await fetchJson(`${api}cinesearch?q=${q}&apikey=${prabathApi}`);
        const allMovies = data.data.data.map((app, index) => `${index + 1}. ${app.title}`).join('\n');

        const searchMessage = `*Cinesubz Movie Search*\n\n*Search Results:*\n${allMovies}\n\nPlease reply with the number of the movie you want to download.`;
        const sentMsg = await conn.sendMessage(from, { text: searchMessage }, { quoted: mek });

        pendingRequests[from] = {
            type: 'movie-selection',
            messageID: sentMsg.key.id,
            searchData: data.data.data
        };
    } catch (e) {
        console.log(e);
    }
});

cmd({
    pattern: "findmovie",
    alias: ["findmv", "searchmovie", "smovie"],
    desc: "search movies",
    category: "search",
    react: "🔎",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!q) {
            return reply("Please provide the name of the movie.");
        }

        const data = await fetchJson(`${api}cinesearch?q=${q}&apikey=${prabathApi}`);
        const allMovies = data.data.data.map((app, index) => `${index + 1}. ${app.title}`).join('\n');

        const message = `*Cinesubz Movie Search*\n\n*Search Results:*\n${allMovies}\n\nPlease reply with the number of the movie you want to download.`;
        const sentMsg = await conn.sendMessage(from, { text: message }, { quoted: mek });

        pendingRequests[from] = {
            type: 'movie-selection',
            messageID: sentMsg.key.id,
            searchData: data.data.data
        };
    } catch (e) {
        console.log(e);
    }
});

// Listener for incoming messages
async function handleIncomingMessage(conn, messageUpdate) {
    const mek = messageUpdate.messages[0];
    if (!mek.message) return;
    const messageType = mek.message.conversation || mek.message.extendedTextMessage?.text;
    const from = mek.key.remoteJid;
    const sender = mek.key.participant || mek.key.remoteJid;

    if (pendingRequests[from]) {
        const { type, messageID, searchData } = pendingRequests[from];
        const isReplyToSentMsg = mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo.stanzaId === messageID;

        if (type === 'movie-selection' && isReplyToSentMsg) {
            const selectedMovieIndex = parseInt(messageType.trim()) - 1;
            if (isNaN(selectedMovieIndex) || selectedMovieIndex < 0 || selectedMovieIndex >= searchData.length) {
                return await conn.sendMessage(from, { text: "Invalid selection. Please reply with a valid number." });
            }

            const movieLink = searchData[selectedMovieIndex].link;
            const desc = await fetchJson(`${api}cinemovie?url=${movieLink}&apikey=${prabathApi}`);
            const movieDetails = desc.data.mainDetails;
            const movieData = desc.data.moviedata;
            const qualities = desc.data.dllinks.directDownloadLinks.map((link, index) => `${index + 1}. ${link.quality} (${link.size})`).join('\n');

            const template = `
- Movie: ${movieDetails.maintitle}
- Release Date: ${movieDetails.dateCreated}
- Director: ${movieData.director}
- Country: ${movieDetails.country}
- Duration: ${movieDetails.runtime}
- IMDB Rating: ${movieData.imdbRating}
- Url: ${movieLink}

*Available Qualities:*\n${qualities}
\nPlease reply with the number of the quality you want to download.`;

            const sentMsg = await conn.sendMessage(from, { text: template });

            pendingRequests[from] = {
                type: 'quality-selection',
                messageID: sentMsg.key.id,
                downloadLinks: desc.data.dllinks.directDownloadLinks
            };
        } else if (type === 'quality-selection' && isReplyToSentMsg) {
            const selectedQualityIndex = parseInt(messageType.trim()) - 1;
            const { downloadLinks } = pendingRequests[from];

            if (isNaN(selectedQualityIndex) || selectedQualityIndex < 0 || selectedQualityIndex >= downloadLinks.length) {
                return await conn.sendMessage(from, { text: "Invalid selection. Please reply with a valid number." });
            }

            const selectedLinkData = downloadLinks[selectedQualityIndex];

            if (parseSize(selectedLinkData.size) > 2) {
                return await conn.sendMessage(from, { text: "Max size 2GB so Can't send via WhatsApp :(" });
            }

            await conn.sendMessage(from, { text: `⬇️ *Downloading:*\n\n📥 *Name:* ${selectedLinkData.name}\n\n🔥 *File_size:* ${selectedLinkData.size}` });
            await sleep(2000);
            await conn.sendMessage(from, { text: "⬆️ *Uploading your movie...*" });

            const down = await fetchJson(`${api}cinedownload?url=${selectedLinkData.link}&apikey=${prabathApi}`);
            const sendDoc = await conn.sendMessage(from, { document: { url: down.data.direct }, mimetype: down.data.mimeType, fileName: down.data.fileName, caption: "> Qᴜᴇᴇɴ-ᴢᴀᴢɪᴇ-ᴍᴅ ᴘᴏᴡᴇʀᴇᴅ ʙʏ ɴʙᴛ" });

            await conn.sendMessage(from, { react: { text: '🎬', key: sendDoc.key } });

            delete pendingRequests[from]; // Clear the request after completing
        }
    }
}

// Bind the message listener to the connection event
conn.ev.on('messages.upsert', (messageUpdate) => handleIncomingMessage(conn, messageUpdate));

// Utility function to parse file size
function parseSize(sizeStr) {
    let sizeMatch = sizeStr.match(/^([\d.]+)\s*GB$/);
    return sizeMatch ? parseFloat(sizeMatch[1]) : 0;
}

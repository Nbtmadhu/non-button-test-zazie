const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson} = require('../lib/functions')

var desct = "It search on chatgpt ai for what you provided."

var needus = "*Hellow.! i am queen-zazie-md whatsapp user bot. How can i help you.?*" 

var cantf = "*Server is busy. Try again later.!*"




cmd({
    pattern: "gemini",
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.gemini <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://apiz-darkyasiya.vercel.app/ai/gemini?q='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

cmd({
    pattern: "chatgpt",
    alias: ["ai","gpt","openai","chat","froen"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.chatgpt <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://hercai.onrender.com/v3/hercai?question='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

cmd({
    pattern: "chatgpt2",
    alias: ["ai2","gpt2","openai2","frozen2","chat2"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.chatgpt2 <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://hercai.onrender.com/v3-32k/hercai?question='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

cmd({
    pattern: "chatgpt3",
    alias: ["ai3","gpt3","openai3","frozen3","chat3"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.chatgpt3 hi',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
res = (await fetchJson('https://llm-chat.vercel.app/api?text=' + q))
return await reply(res)
} catch (e) {
reply(cantf)
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
console.log(e)
}
} )

cmd({
    pattern: "turbo",
    alias: ["ai4","gpt4","openai4","chat4", "chatgpt4"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.turbo <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://hercai.onrender.com/turbo/hercai?question='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

cmd({
    pattern: "turbo2",
    alias: ["ai5","gpt5","turbo16k","chat5", "chatgpt5"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.turbo16k <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://hercai.onrender.com/turbo-16k/hercai?question='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

cmd({
    pattern: "gemini",
    alias: ["ai6","gpt6","openai6","chat6", "chatgpt6"],
    react: '👾',
    desc: desct,
    category: "ai",
    use: '.gemini <query>',
    filename: __filename
},
async(conn, mek, m,{from, l, prefix, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply}) => {
try{
if(!q) return reply(needus)
//let res = (await fetchJson('https://hercai.onrender.com/v3/hercai?question=' + q)).response
let res = await fetchJson('https://hercai.onrender.com/gemini/hercai?question='+q)

return await reply(res.reply)
} catch (e) {
await conn.sendMessage(from, { react: { text: '❌', key: mek.key } })
reply(cantf)
l(e)
}
})

// index.js
import makeWASocket, { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } from "@adiwajshing/baileys";
import { Boom } from "@hapi/boom";
import P from "pino";
import qrcode from "qrcode-terminal";

// Bot configuration
const BOT_NAME = "🍷𓆩𝐓𝐚𝐥𝐢𝐛 ​᭄𝐌𝐃🚩";
const OWNER_NUMBER = "923431798985";

// Main function
async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("baileys_auth_info");

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
        version,
        printQRInTerminal: false,
        auth: state,
        logger: P({ level: "trace" })
    });

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // Connection & QR handling
    sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log(`Scan this QR to login ${BOT_NAME}:`);
            qrcode.generate(qr, { small: true });
        }

        if (connection === "close") {
            const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Connection closed. Reconnecting:", shouldReconnect);
            if (shouldReconnect) startBot();
        } else if (connection === "open") {
            console.log(`${BOT_NAME} is now connected!`);
        }
    });

    // Message listener
    sock.ev.on("messages.upsert", (m) => {
        const messages = m.messages;
        for (const message of messages) {
            if (!message.key.fromMe && message.message) {
                const text = message.message.conversation || "";
                console.log(`New message from ${OWNER_NUMBER}: ${text}`);
                // Example auto-reply
                sock.sendMessage(message.key.remoteJid, { text: `Hello! This is ${BOT_NAME}` });
            }
        }
    });
}

// Start the bot
startBot().catch(console.error);

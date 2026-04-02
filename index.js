const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const config = require("./config");
require("./server");

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("session");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
    printQRInTerminal: true
  });

  sock.ev.on("creds.update", saveCreds);

  // Load commands
  const commands = [];
  fs.readdirSync("./commands").forEach(file => {
    commands.push(require(`./commands/${file}`));
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message) return;

    const from = m.key.remoteJid;
    const msg =
      m.message.conversation ||
      m.message.extendedTextMessage?.text;

    if (!msg) return;

    const isCmd = msg.startsWith(config.PREFIX);
    const command = isCmd ? msg.slice(1).split(" ")[0].toLowerCase() : "";

    if (!isCmd && config.AUTO_REPLY) {
      await sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      await sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });

  sock.ev.on("connection.update", (update) => {
    const { connection } = update;

    if (connection === "close") {
      console.log("Reconnecting...");
      startBot();
    } else if (connection === "open") {
      console.log("Bot Connected ✅");
    }
  });
}

startBot();

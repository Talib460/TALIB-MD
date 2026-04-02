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
  });

  sock.ev.on("creds.update", saveCreds);

  // Load commands (FIXED)
  const commands = [];
  const path = "./commands";

  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(file => {
      if (file.endsWith(".js")) {
        commands.push(require(`${path}/${file}`));
      }
    });
  } else {
    console.log("❌ commands folder not found");
  }

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
      sock.sendMessage(from, { text: "🤖 TALIB-MD ACTIVE" });
    }

    if (config.ANTI_LINK && msg.includes("chat.whatsapp.com")) {
      sock.sendMessage(from, { text: "🚫 Links not allowed!" });
    }

    for (let cmd of commands) {
      if (cmd.name === command) {
        cmd.execute(sock, m, msg);
      }
    }
  });
}

startBot();
